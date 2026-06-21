import { NextResponse } from 'next/server';
import { executeAI, parseAIJson } from '@/lib/ai/modelRouter';
import { guardAiRoute } from '@/lib/apiGuard';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // V1: require auth + rate limit (expensive AI resume polish).
    const guard = await guardAiRoute('resume-generate', 10, 60);
    if (guard instanceof Response) return guard;

    const rawData = await req.json();

    const prompt = `You are a professional resume writer with 15 years of experience.
You are given a candidate's raw profile data from SkilledCore.
Your job is to transform this raw data into polished, professional resume content ready for senior engineering roles.

Candidate Raw Data:
${JSON.stringify(rawData, null, 2)}

Rules:
- Do NOT invent facts, technologies, or achievements not in the data. Only elaborate and polish existing items.
- Rewrite experience description bullet points as strong achievement statements starting with action verbs (Built, Designed, Led, Optimized, etc.).
- For each experience entry, write 2-4 bullet points from the description.
- Expand project descriptions to 2-3 professional sentences.
- Write a 3-sentence professional summary in first person based on the candidate's strongest experience and skills.
- Clean up grammar, spelling, and formatting.
- Standardize date formats to "Month Year" format.
- Return ONLY valid JSON with no markdown, no backticks, no preamble. Start directly with the opening curly brace.

Return exactly this structure:
{
  "name": "Full name",
  "headline": "Professional title",
  "location": "City, Country",
  "email": "email",
  "phone": "phone or empty string",
  "summary": "3-sentence professional summary",
  "socials": [
    { "label": "LinkedIn", "url": "https://..." },
    { "label": "GitHub", "url": "https://..." }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "City or Remote",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "bullets": [
        "Achievement statement 1",
        "Achievement statement 2",
        "Achievement statement 3"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor's in Computer Science",
      "institution": "University name",
      "location": "City, Country",
      "startYear": "2018",
      "endYear": "2022",
      "honors": "GPA or honors if present, else empty string"
    }
  ],
  "skills": ["React", "TypeScript", "Node.js"],
  "projects": [
    {
      "name": "Project name",
      "description": "2-3 polished professional sentences about what was built, the problem it solved, and the outcome.",
      "technologies": ["React", "PostgreSQL"],
      "url": "https://... or empty string"
    }
  ],
  "aiInterviewScore": "Score and summary if available, else null",
  "verifiedBadges": ["React.js (Verified)", "Python (Verified)"]
}`;

    console.log(`[Resume Generate] Sending request to executeAI('resumeExport')`);

    let responseText: string;
    try {
      const result = await executeAI(
        'resumeExport',
        [
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          temperature: 0.1,
          jsonMode: true,
        }
      );
      responseText = result.choices[0].message.content;
    } catch (modelErr: any) {
      console.warn(`[Resume Generate] Custom resumeExport failed, falling back to default assistant model:`, modelErr?.message || modelErr);
      const fallbackResult = await executeAI(
        'assistant',
        [
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          temperature: 0.1,
          jsonMode: true,
        }
      );
      responseText = fallbackResult.choices[0].message.content;
    }

    try {
      const parsed = parseAIJson<any>(responseText);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error('[Resume Generate] JSON parsing failed. Response text:', responseText, parseErr);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Resume Generate] API Error:', error);
    return NextResponse.json({ error: 'AI generation failed', details: error.message }, { status: 500 });
  }
}
