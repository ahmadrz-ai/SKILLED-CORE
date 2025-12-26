
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load Env
try {
    const envPath = path.join(__dirname, '../.env');
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
} catch (e) {
    console.log("Error loading .env", e);
}

async function textAnalysis() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }

    console.log("Using API Key:", apiKey.substring(0, 5) + "...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = "Explain React in 1 sentence.";
    const models = ["gemini-2.0-flash-exp", "gemini-2.0-flash", "gemini-1.5-flash-8b"];

    for (const mName of models) {
        console.log(`\nTesting model: ${mName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent(prompt);
            console.log(`SUCCESS [${mName}]:`, result.response.text());
            return; // Found a working one
        } catch (e) {
            const msg = e.toString();
            console.log(`FAILED [${mName}]:`, msg.substring(0, 150) + "...");
        }
    }
}

textAnalysis();
