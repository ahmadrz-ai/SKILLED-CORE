import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Use the specific API key provided for Qodee
    const apiKey = process.env.QODEE_API_KEY;

    console.log("Qodee API Request:", {
        messagesCount: messages?.length,
        hasApiKey: !!apiKey,
        firstMessage: messages?.[0]
    });

    if (!apiKey) {
        console.error("Qodee API Error: Missing API Key");
        return new Response("Configuration Error: Missing QODEE_API_KEY", { status: 500 });
    }

    // Define the Gentle Professional Persona
    const systemPrompt = `You are Qodee, the official AI Assistant for SkilledCore.
  
  CORE IDENTITY:
  - Tone: Gentle, Professional, Friendly, and Helpful.
  - Role: Guide users through the platform, help them find jobs, and explain features.
  - Style: Concise but warm. Use emojis occasionally (e.g., 👋, 🚀).
  
  CONTEXT:
  - App Name: SkilledCore (Enterprise Recruitment Node).
  - Navigation: /feed (Main), /jobs (Jobs), /profile (Identity), /settings (Config).
  
  INSTRUCTIONS:
  - If a user asks for help, provide clear steps.
  - If a user feels lost, reassure them kindly.
  - Do NOT be intimidating (unlike the Interview Bot). You are a friend.
  `;

    // Create custom Google provider instance with the specific API key
    const google = createGoogleGenerativeAI({
        apiKey: apiKey
    });

    try {
        const result = await streamText({
            model: google('gemini-2.5-flash'), // User requested specific model
            system: systemPrompt,
            messages,
        });

        // Manually implement Vercel AI Data Stream Protocol v1
        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Qodee Generation Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
