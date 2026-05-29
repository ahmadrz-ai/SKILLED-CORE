import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        let base64Data = "";
        let mimeType = "application/pdf";

        try {
            const contentType = req.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const body = await req.json();
                const resumeUrl = body.url;
                if (!resumeUrl) {
                    return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 400 });
                }
                const response = await fetch(resumeUrl);
                if (!response.ok) {
                    return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
                }
                const arrayBuffer = await response.arrayBuffer();
                base64Data = Buffer.from(arrayBuffer).toString('base64');
            } else {
                const formData = await req.formData();
                const file = formData.get("file") as File;

                if (!file) {
                    return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 400 });
                }

                const arrayBuffer = await file.arrayBuffer();
                base64Data = Buffer.from(arrayBuffer).toString('base64');
                mimeType = file.type || "application/pdf";
            }
        } catch (fileErr: any) {
            console.error("Option B File read failed:", fileErr);
            return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
        }

        // Initialize Gemini
        const apiKey = process.env.QODEE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.RESUME_PARSER;
        if (!apiKey) {
            return NextResponse.json({ error: "AI parsing failed", details: "No API Key configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // STEP 3: Send to Gemini as inlineData
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
            console.log("Raw Gemini response text (Option B):", textResult);
        } catch (geminiErr: any) {
            console.error("Gemini Content Generation Failed for Option B:", geminiErr);
            return NextResponse.json({ error: "AI parsing failed", details: geminiErr.message }, { status: 500 });
        }

        // STEP 4: Strip markdown fences before parsing:
        try {
            let text = textResult;
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
        } catch (jsonErr: any) {
            console.error("Option B JSON parse failed. Raw text was:", textResult, jsonErr);
            return NextResponse.json({ error: "Could not read AI response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Resume Analysis Error:", error);
        return NextResponse.json({ error: "AI parsing failed", details: error.message }, { status: 500 });
    }
}
