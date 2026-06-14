import { guardAiRoute } from "@/lib/apiGuard";
import { firstGeminiKey } from "@/lib/ai/modelRouter";
import { LIVE_MODEL, buildLiveConfig } from "@/lib/interview/liveConfig";

// @google/genai needs the Node runtime (not edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mints a SHORT-LIVED ephemeral token for the browser to open a Gemini Live
 * session directly. The real API key never leaves the server — only this
 * single-use, ~minutes-long token is returned. Auth + rate-limited so nobody
 * can mint tokens anonymously and drain the Gemini budget.
 */
export async function POST() {
    const guard = await guardAiRoute("live-interview-token", 10, 60);
    if (guard instanceof Response) return guard;

    const apiKey = firstGeminiKey();
    if (!apiKey) {
        return new Response("Live interview is not configured.", {
            status: 503,
            headers: { "content-type": "text/plain", "cache-control": "no-store" },
        });
    }

    try {
        const { GoogleGenAI } = await import("@google/genai");
        // v1alpha is required for both ephemeral tokens and affective dialog.
        const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });

        const now = Date.now();
        const token = await ai.authTokens.create({
            config: {
                // Token usable to open ONE session, valid for a short window.
                uses: 1,
                expireTime: new Date(now + 15 * 60 * 1000).toISOString(),       // overall token TTL
                newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(), // must start session within 2 min
                // Lock the token to exactly our interviewer model + config.
                liveConnectConstraints: {
                    model: LIVE_MODEL,
                    config: {
                        sessionResumption: {},
                        temperature: 0.7,
                        ...buildLiveConfig(true),
                    },
                },
                httpOptions: { apiVersion: "v1alpha" },
            },
        });

        return Response.json(
            { token: token.name, model: LIVE_MODEL },
            { headers: { "cache-control": "no-store" } },
        );
    } catch (err) {
        console.error("live-token mint failed:", err);
        return new Response("Could not start live interview. Please try again.", {
            status: 502,
            headers: { "content-type": "text/plain", "cache-control": "no-store" },
        });
    }
}
