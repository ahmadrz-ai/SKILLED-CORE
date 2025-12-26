import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "No URL provided" },
                { status: 400 }
            );
        }

        // Fetch the file from the URL (UploadThing)
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // POLYFILLS for PDF Parser (same as before)
        if (!global.DOMMatrix) {
            // @ts-ignore
            global.DOMMatrix = class DOMMatrix { };
        }
        if (!global.DOMPoint) {
            // @ts-ignore
            global.DOMPoint = class DOMPoint { };
        }

        // @ts-ignore
        const pdf = require("pdf-parse");
        const { GoogleGenerativeAI } = require("@google/generative-ai");

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

        // Extract Text
        let extractedText = "";
        let aiData = null;

        try {
            const pdfData = await pdf(buffer);
            extractedText = pdfData.text;

            if (extractedText.length > 50) {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const prompt = `
                You are an expert HR AI. Analyze this resume text and extract the following JSON data ONLY.
                Do not assume valid JSON if the text is garbage.
                
                JSON Structure:
                {
                    "headline": "A professional 3-5 word headline based on role and experience",
                    "summary": "A concise 2-sentence professional bio",
                    "skills": ["Array", "of", "top", "5", "skills"],
                    "location": "City, Country (inferred or explicit)",
                    "yearsOfExperience": "Number (inferred)"
                }

                Resume Text:
                ${extractedText.substring(0, 10000)}
                `;

                const result = await model.generateContent(prompt);
                const aiResponse = result.response;
                const text = aiResponse.text();

                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                aiData = JSON.parse(jsonStr);
            }
        } catch (err) {
            console.error("AI Parse Error:", err);
        }

        return NextResponse.json({
            success: true,
            aiData,
            textSnippet: extractedText.substring(0, 100) // Optional: confirm text
        });

    } catch (error) {
        console.error("Parse error:", error);
        return NextResponse.json(
            { error: "Parse failed" },
            { status: 500 }
        );
    }
}
