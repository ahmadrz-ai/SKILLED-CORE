
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

async function main() {
    console.log("Verifying Real AI Integration...");

    const apiKey = process.env.QODEE_API_KEY;
    if (!apiKey) {
        console.error("❌ Message: Missing QODEE_API_KEY");
        return;
    }

    try {
        const google = createGoogleGenerativeAI({ apiKey });
        console.log("Sending request to Gemini 1.5 Flash...");

        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: 'Rewrite this: "We need a java dev who knows spring boot." to be a professional job requirement.',
        });

        console.log("\n✅ AI Response Received:");
        console.log("--------------------------------------------------");
        console.log(text);
        console.log("--------------------------------------------------");
        console.log("AI integration is FUNCTIONAL.");

    } catch (error: any) {
        console.error("❌ AI Error:", error.message);
    }
}

main();
