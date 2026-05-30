import { callGLM, parseGLMJson } from "@/lib/glm";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query } = body;

        if (!query || typeof query !== "string" || !query.trim()) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const prompt = `You are an expert technical recruiter assistant.
A recruiter has typed this search query:
"${query}"

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
      "type": "primary" | "secondary" | "contextual",
      "experienceLevel": "any" | "junior" | "mid" | "senior" | "expert" | null,
      "notes": "any context from the query about this requirement"
    }
  ],
  "industry": "industry context if mentioned — e.g. Restaurant, Finance, Healthcare — or null",
  "queryIntent": "one sentence summary of what recruiter wants"
}

Rules:
- Extract every distinct requirement from the query, no matter how small
- For each requirement, include all common variations/synonyms as searchTerms (e.g. "React", "React.js", "ReactJS", "React Developer" for a React requirement)
- Determine experience level from context words:
    experienced / senior / expert / years → senior or expert
    junior / entry / beginner / learning → junior
    knowledge of / familiar with / knows → any (not requiring expertise)
- Never invent requirements not mentioned in the query
- Return ONLY JSON`;

        const rawResponse = await callGLM(
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
                enableThinking: false,  // Fast, no deep reasoning needed
            }
        );

        try {
            const parsed = parseGLMJson<any>(rawResponse);
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
