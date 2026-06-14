"use server";

import { auth } from "@/auth";
import { callGeminiVision } from "@/lib/ai/modelRouter";
import { INTERVIEWER_SYSTEM_INSTRUCTION } from "@/lib/interview/liveConfig";

export type LiveTurn = { role: "user" | "model"; text: string };

/**
 * One interviewer turn for the FREE live video interview (browser STT/TTS +
 * server Gemini brain). Takes the conversation so far, the role being assessed,
 * and (optionally) a single camera frame for light engagement awareness.
 *
 * The reply is meant to be SPOKEN by the browser's speech synthesizer, so we
 * force plain prose — no markdown, lists, code blocks, or emoji.
 */
export async function getInterviewerReply(
    history: LiveTurn[],
    role: string,
    frameBase64?: string,
): Promise<{ text: string } | { error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const cleanRole = (role || "").trim().slice(0, 120) || "a general role";

    const systemInstruction = `${INTERVIEWER_SYSTEM_INSTRUCTION}

# THIS SESSION
You are interviewing the candidate for: "${cleanRole}". Ask questions specific to this role/skill.

# OUTPUT FORMAT (critical)
Your words are read aloud by a text-to-speech voice. Output PLAIN spoken sentences only — absolutely no markdown, no bullet points, no numbered lists, no code blocks, no emoji, no stage directions. Keep each reply to 1 to 3 short sentences, ask ONE thing at a time, then stop.`;

    // Build Gemini contents. Attach the camera frame (if any) to the latest user turn.
    const safeHistory = (history || []).slice(-24); // keep the request small
    const contents: any[] = safeHistory.map((t, idx) => {
        const isLastUser = idx === safeHistory.length - 1 && t.role === "user";
        const parts: any[] = [{ text: t.text }];
        if (isLastUser && frameBase64) {
            parts.push({ inlineData: { mimeType: "image/jpeg", data: frameBase64 } });
        }
        return { role: t.role === "model" ? "model" : "user", parts };
    });

    // First turn (no history) → prompt the model to open the interview.
    if (contents.length === 0) {
        const parts: any[] = [{ text: "(The candidate has joined with their camera on. Greet them warmly but professionally, briefly introduce yourself as Core, and ask them to introduce themselves and confirm the role or skill they want to be assessed on.)" }];
        if (frameBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: frameBase64 } });
        contents.push({ role: "user", parts });
    }

    try {
        const text = await callGeminiVision(contents, systemInstruction, 0.7);
        return { text: text.trim() };
    } catch (e) {
        console.error("getInterviewerReply failed:", e);
        return { error: "Core is momentarily unavailable. Please try again in a moment." };
    }
}
