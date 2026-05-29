import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const resumeUrl = body.url;
        if (!resumeUrl) {
            return NextResponse.json({ error: "No URL provided" }, { status: 400 });
        }

        // STEP 2: Fetch the file SERVER-SIDE inside the API route:
        let base64Data: string;
        let mimeType = 'application/pdf';
        try {
            const response = await fetch(resumeUrl);
            if (!response.ok) {
                return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
            }
            const arrayBuffer = await response.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString('base64');
        } catch (fetchErr: any) {
            console.error("Fetch Resume URL Failed:", fetchErr);
            return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
        }

        // Initialize Gemini
        const apiKey = process.env.QODEE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.RESUME_PARSER;
        if (!apiKey) {
            return NextResponse.json({ error: "AI parsing failed", details: "No API Key configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // STEP 3: Send to Gemini as inline_data — NOT as a URL
        let textResult = "";
        try {
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                    }
                },
                {
                    text: `You are a professional resume parser. Extract all 
information from this resume and return ONLY valid JSON 
with no markdown, no backticks, no preamble.

Return this exact structure:
{
  "basics": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "headline": "",
    "summary": ""
  },
  "experience": [
    {
      "company": "",
      "title": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "fieldOfStudy": "",
      "startYear": "",
      "endYear": ""
    }
  ],
  "skills": ["skill1", "skill2"],
  "projects": [
    {
      "name": "",
      "description": "Expand this to 4-6 professional sentences. Never invent details not in the original.",
      "technologies": ["tech1"],
      "url": ""
    }
  ],
  "socials": [
    {
      "label": "",
      "url": ""
    }
  ]
}

For projects: take the raw description and expand it to 
4-6 well-written professional sentences. Keep all facts 
accurate. Never add technologies or features not mentioned.

Return ONLY the JSON object. No other text.`
                }
            ]);
            textResult = result.response.text();
            console.log("Raw Gemini response text (Option A):", textResult);
        } catch (geminiErr: any) {
            console.error("Gemini Content Generation Failed:", geminiErr);
            return NextResponse.json({ error: "AI parsing failed", details: geminiErr.message }, { status: 500 });
        }

        // STEP 4: Strip markdown fences before parsing:
        try {
            let text = textResult;
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
        } catch (jsonErr: any) {
            console.error("JSON parse failed. Raw text was:", textResult, jsonErr);
            return NextResponse.json({ error: "Could not read AI response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Fatal Parse Error:", error);
        return NextResponse.json({ error: "AI parsing failed", details: error.message }, { status: 500 });
    }
}
