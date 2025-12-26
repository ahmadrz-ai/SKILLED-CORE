
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
    console.log("Verifying Interview Analysis AI...");

    const apiKey = process.env.QODEE_API_KEY;
    if (!apiKey) {
        console.error("Missing API Key");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Mock Transcript
    const transcript = `
    INTERVIEWER: Tell me about React hooks.
    CANDIDATE: React hooks are functions that let you "hook into" React state and lifecycle features from function components. Key hooks include useState for state and useEffect for side effects.
    INTERVIEWER: Can you explain dependency array in useEffect?
    CANDIDATE: Yes, it controls when the effect runs. If empty, it runs once. If it includes variables, it runs when they change.
    `;

    const prompt = `
    You are an Expert Technical Interviewer.
    Analyze this transcript for a React Developer position (Level 3).
    TRANSCRIPT:
    ${transcript}
    Generate JSON: { score, feedback, radarData: { technical, communication, problemSolving, confidence, culturalFit }, strengths, weaknesses }.
    Strict JSON only.
    `;

    try {
        console.log("Sending request...");
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        console.log("Raw Response:", text);

        const json = JSON.parse(text);
        console.log("✅ JSON Parsed Successfully:");
        console.log(JSON.stringify(json, null, 2));

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
