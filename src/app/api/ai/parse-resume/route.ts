import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Force Node.js runtime for pdf-parse
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract Text from PDF
        let text = "";
        try {
            const data = await pdf(buffer);
            text = data.text;
        } catch (e) {
            console.error("PDF Parse Error:", e);
            return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
        }

        // Initialize Gemini
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "AI Configuration missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an expert Resume Parser. 
            Analyze the following resume text and extract structured data in strict JSON format.
            
            Target Schema:
            {
                "bio": "A professional summary (max 300 chars)",
                "headline": "Current professional title (e.g. Senior Frontend Engineer)",
                "skills": ["Skill 1", "Skill 2"],
                "experience": [
                    { 
                        "title": "Job Title", 
                        "company": "Company Name", 
                        "date": "2020 - Present",
                        "description": "Short summary of responsibilities"
                    }
                ],
                "education": [
                    { 
                        "school": "University Name", 
                        "degree": "Degree Name", 
                        "year": "2019" 
                    }
                ]
            }

            If fields are missing, leave them empty or empty arrays. 
            Do NOT hallucinate. Only extract what is there.
            
            RESUME TEXT:
            ${text.substring(0, 10000)} 
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const jsonString = result.response.text();
        const parsedData = JSON.parse(jsonString);

        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error("Resume Analysis Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
