import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";
import { guardAiRoute } from "@/lib/apiGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

/**
 * Build a calibration context block from the recruiter's company hiring calibration
 * (the hero/missed/mismatched examples captured at onboarding). This is injected into
 * the query-parsing prompt so requirement extraction reflects the company's real
 * standards — the onboarding calibration genuinely influences each search.
 */
async function getCalibrationContext(userId: string): Promise<string> {
    try {
        const me = await prisma.user.findUnique({
            where: { id: userId },
            select: { company: { select: { calibration: true } } },
        });
        const cal = me?.company?.calibration as any;
        if (!cal) return "";
        const lines: string[] = [];
        if (cal.hero?.traits) lines.push(`- HERO HIRE (the bar to match)${cal.hero.role ? ` — ${cal.hero.role}` : ""}: ${cal.hero.traits}`);
        if (cal.missed?.traits) lines.push(`- MISSED SIGNAL (a builder they wrongly passed on — value this kind)${cal.missed.role ? ` — ${cal.missed.role}` : ""}: ${cal.missed.traits}`);
        if (cal.mismatched?.traits) lines.push(`- MISMATCHED HIRE (interviewed well but failed on the job — be skeptical of this kind)${cal.mismatched.role ? ` — ${cal.mismatched.role}` : ""}: ${cal.mismatched.traits}`);
        if (!lines.length) return "";
        return `\n\nThis recruiter's company has provided hiring calibration. While still honoring the explicit query above, lean the requirements toward the qualities of the HERO HIRE and MISSED SIGNAL, and de-emphasize traits typical of the MISMATCHED HIRE:\n${lines.join("\n")}\n`;
    } catch {
        return "";
    }
}

export async function POST(req: Request) {
    // Auth + rate limit — paid LLM call.
    const guard = await guardAiRoute("talent-parse-query", 30, 60);
    if (guard instanceof Response) return guard;
    const { userId } = guard;

    try {
        const body = await req.json();
        const { query } = body;

        if (!query || typeof query !== "string" || !query.trim()) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const calibrationContext = await getCalibrationContext(userId);

        const prompt = `You are an expert technical recruiter assistant.
A recruiter has typed this search query:
"${query}"
${calibrationContext}

Extract all the requirements they are looking for and rank them
by priority. The first requirement mentioned or the most emphasized
skill is Priority 1 (highest). Additional skills follow in order.

Return ONLY valid JSON with no markdown, no backticks, no preamble:
{
  "requirements": [
    {
      "priority": number,
      "label": "Human readable label — e.g. React Developer",
      "searchTerms": ["react", "reactjs", "react.js", "react developer"],
      "type": "primary" | "secondary" | "contextual" | "person-name",
      "isHardFilter": boolean,
      "experienceLevel": "any" | "junior" | "mid" | "senior" | "expert" | null,
      "notes": "any context from the query about this requirement"
    }
  ],
  "industry": "industry context if mentioned — e.g. Restaurant, Finance, Healthcare — or null",
  "queryIntent": "one sentence summary of what recruiter wants"
}

SPECIAL REQUIREMENT TYPES:
When the query explicitly contains a specific person's name (e.g., "find [Name]", "named [Name]", "person called [Name]"), mark that requirement with:
  type: "person-name"
  isHardFilter: true
  priority: 0  (highest — above all skill requirements)

A person-name requirement means ONLY candidates whose name contains that string should appear in results. Everyone else is excluded.
DO NOT extract a person-name requirement unless a specific person's name is explicitly written in the recruiter query.

Detection patterns for names in the search query:
  "named [Name]", "called [Name]", "find [Name]", "person [Name]", "[Name] who knows", "[Name] with experience", "looking for [Name]"

Rules:
- Extract every distinct requirement from the query, no matter how small.
- For each requirement, you MUST include a rich, comprehensive list of searchTerms (aim for 5-10 terms per requirement) to enable fuzzy semantic matching. This list should include:
    1. Common abbreviations, acronyms, and aliases (e.g. for "Machine Learning" include "ml", "machine learning", "deep learning", "ai", "artificial intelligence"; for "TypeScript" include "ts", "typescript", "javascript", "js").
    2. Variations in spacing, symbols, and suffixes (e.g. "React.js", "reactjs", "react", "react dev", "react developer").
    3. Common alternative spellings or typical spelling variations and typos (e.g. "python" -> "pyton", "pythn"; "PostgreSQL" -> "postgres", "postgresql", "postgre", "sql").
    4. For specific frameworks or tools, include parent languages and related core tech (e.g. for "Next.js" include "nextjs", "next.js", "react", "reactjs", "frontend", "front-end", "javascript", "typescript").
    5. For generic roles or tasks, include common synonyms and primary sub-skills (e.g. for "Data Scientist" include "data science", "data scientist", "machine learning", "python", "pandas", "numpy", "statistics").
- Determine experience level from context words:
    experienced / senior / expert / years → senior or expert
    junior / entry / beginner / learning → junior
    knowledge of / familiar with / knows → any (not requiring expertise)
- Never invent requirements not mentioned in the query.
- Return ONLY JSON.`;

        const result = await executeAI(
            'search',
            [
                {
                    role: 'system',
                    content: 'You are a talent search query parser. Return ONLY valid JSON. No markdown. No backticks.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            {
                temperature: 0.1,  // Very low — needs consistent structured output
                maxTokens: 2048,
                jsonMode: true,
            }
        );

        const rawResponse = result.choices[0].message.content;

        try {
            const parsed = parseAIJson<any>(rawResponse);
            return NextResponse.json(parsed);
        } catch (parseError) {
            console.error("JSON parsing of query parser failed:", parseError, "Raw output:", rawResponse);
            return NextResponse.json({ error: "Could not parse query", details: "Failed to parse AI JSON response" }, { status: 500 });
        }

    } catch (err: any) {
        console.error("Query parser API error:", err);
        return NextResponse.json({ error: "Could not parse query", details: err.message }, { status: 500 });
    }
}

