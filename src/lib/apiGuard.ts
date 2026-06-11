import "server-only";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * Gate for expensive/paid API route handlers (LLM calls). Requires an
 * authenticated session AND applies a per-user distributed rate limit, so an
 * anonymous or scripted caller can't drain provider budget or DoS the service.
 *
 * Returns the userId on success, or a ready-to-return Response (401/429) on
 * failure: `const g = await guardAiRoute(...); if (g instanceof Response) return g;`
 *
 * Errors are PLAIN TEXT (never echo internals) per the info-leak hardening.
 */
export async function guardAiRoute(
    bucket: string,
    limit = 20,
    windowSec = 60,
): Promise<{ userId: string } | Response> {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", {
            status: 401,
            headers: { "content-type": "text/plain", "cache-control": "no-store" },
        });
    }
    const { success } = await checkRateLimit(bucket, session.user.id, limit, windowSec);
    if (!success) {
        return new Response("Too many requests — please slow down.", {
            status: 429,
            headers: { "content-type": "text/plain", "cache-control": "no-store" },
        });
    }
    return { userId: session.user.id };
}
