import { streamNvidiaText } from "@/lib/ai/modelRouter";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    console.log("Qodee API Request via executeAI:", {
        messagesCount: messages?.length,
        firstMessage: messages?.[0]
    });

    // Define the Gentle Professional Persona and SkilledCore Platform Knowledge Base
    const systemPrompt = `You are Qodee, the official AI Assistant for SkilledCore.
  
  CORE GUIDELINES:
  - Persona: Warm, professional, concise, and non-sycophantic.
  - Constraint: Respond in a maximum of 3 sentences. Be direct and avoid overly flowery or deferential language.
  - Role: Provide accurate support information for the SkilledCore platform.

  SKILLEDCORE PLATFORM KNOWLEDGE BASE:
  1. ROLE CHANGE: Candidates cannot change roles directly on their profile page. They must go to Settings -> Account Access (/settings), submit a verified corporate email, and await administrator approval.
  2. GHOST MODE: Anonymous discovery privacy mode. Browsing candidate profiles or jobs does not log or dispatch view telemetry.
  3. AI INTERVIEW: Evaluates code correctness, runtime efficiency, communication skills, and architectural reasoning. Best score is saved; full transcripts of all runs are preserved.
  4. CREDITS & BILLING: Top up via the Credits tab in the sidebar. Purchased credits cost $1 for 5 credits and never expire. Promotional monthly credits expire at the end of the billing cycle.
  5. SECURITY & PRIVACY: Uses AES-256 encryption at rest and TLS 1.3 in transit. Enable 2FA in Settings -> Security (/settings) by scanning a QR code with an authenticator app.
  
  If the question is outside this scope, politely direct the user to the Support Center (/help) to open a ticket. Always keep your response strictly under 3 sentences.`;

    try {
        const glmMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...messages.map((m: any) => ({
                role: m.role as 'user' | 'assistant',
                content: typeof m.content === 'string'
                    ? m.content
                    : m.content.map((c: any) => c.text || '').join(''),
            })),
        ];

        const textStreamResponse = await streamNvidiaText('assistant', glmMessages, {
            temperature: 0.7,
            maxTokens: 4096,
        });

        return textStreamResponse;
    } catch (error: any) {
        console.error("Qodee Generation Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
