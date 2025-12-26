
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import pdf from 'pdf-parse';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdf(buffer);
        const text = pdfData.text;

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert resume parser. Extract the following structured data from the resume text provided below. Return ONLY a valid JSON object with no additional text or markdown formatting.

        Schema:
        {
            "headline": "string (e.g. Senior Frontend Engineer)",
            "summary": "string (a professional bio summary, max 50 words)",
            "skills": ["string", "string"],
            "experience": [
                {
                    "position": "string",
                    "company": "string",
                    "startDate": "string (YYYY-MM or YYYY)",
                    "endDate": "string (YYYY-MM or YYYY or Present)",
                    "description": "string (short description)"
                }
            ],
            "education": [
                {
                    "school": "string",
                    "degree": "string",
                    "startDate": "string (YYYY)",
                    "endDate": "string (YYYY)"
                }
            ]
        }
        
        Note: If a field is not found, leave it as empty string or dry array. Format dates consistently.

        Resume Text:
        ${text.slice(0, 10000)} // Limit context if very large
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(jsonString);

        return NextResponse.json(parsedData);
    } catch (error) {
        console.error('Resume Parse Error:', error);
        return NextResponse.json(
            { error: 'Failed to process resume' },
            { status: 500 }
        );
    }
}
