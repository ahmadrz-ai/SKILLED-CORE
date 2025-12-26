import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const apiKey = process.env.QODEE_API_KEY;
    if (!apiKey) return new Response("Missing Key", { status: 500 });

    const google = createGoogleGenerativeAI({ apiKey });
    const models = ['gemini-flash-latest', 'gemini-1.0-pro', 'gemini-1.5-flash-001'];

    const results: Record<string, string> = {};

    for (const m of models) {
        try {
            console.log(`Testing model: ${m}`);
            const result = await generateText({
                model: google(m),
                prompt: 'Test',
            });
            results[m] = "Success: " + result.text;
        } catch (e: any) {
            console.error(`Failed ${m}:`, e.message);
            results[m] = "Error: " + e.message;
        }
    }

    return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}
