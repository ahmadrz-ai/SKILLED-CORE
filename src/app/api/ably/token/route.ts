import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as Ably from "ably";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Issues a short-lived Ably token scoped to the caller. Grants:
//   user:{id}            subscribe        — nav-badge nudges
//   presence:global      subscribe+presence — online status
//   conversation:{id}    publish+subscribe+presence — for each conversation the
//                        caller actually belongs to (enumerated from the DB, no
//                        wildcard) so nobody can snoop another thread.
// The raw ABLY_API_KEY never leaves the server.
// Error responses are deliberately PLAIN TEXT, not JSON: ably-js parses any JSON
// body from an auth endpoint as a TokenRequest/TokenDetails, so a JSON error like
// {"error":"..."} gets POSTed to Ably as a malformed token request and comes back
// as an opaque statusCode=400 retry storm (audit bug I1).
function authError(message: string, status: number) {
    return new NextResponse(message, {
        status,
        headers: { "content-type": "text/plain", "cache-control": "no-store" },
    });
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return authError("Unauthorized", 401);
    }

    const key = process.env.ABLY_API_KEY;
    // Validate the key shape (keyName.keyId:secret) — a missing OR malformed env
    // value (stray quotes/whitespace from a bad paste) must fail loudly here, not
    // as a cryptic Ably-side 400.
    if (!key || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(key.trim())) {
        console.error("[ably] ABLY_API_KEY is", key ? "malformed" : "missing", "in this environment");
        return authError("Realtime not configured", 503);
    }

    try {
        const userId = session.user.id;

        const capability: Record<string, string[]> = {
            [`user:${userId}`]: ["subscribe"],
            "presence:global": ["subscribe", "presence"],
        };

        // Scope conversation channels to threads the caller is a participant of.
        // Capped to the most recently active threads: Ably rejects oversized token
        // requests, and a power user with thousands of dormant threads must never
        // brick their own realtime auth. Older threads still reconcile via polling.
        try {
            const convos = await prisma.conversation.findMany({
                where: { participants: { some: { userId } } },
                select: { id: true },
                orderBy: { updatedAt: "desc" },
                take: 300,
            });
            for (const c of convos) {
                capability[`conversation:${c.id}`] = ["publish", "subscribe", "presence"];
            }
        } catch (e) {
            // A DB hiccup shouldn't block realtime entirely — the user still gets
            // badges + presence; conversation channels resolve on the next token.
            console.error("[ably] capability enumeration failed:", e);
        }

        const client = new Ably.Rest(key.trim());
        const tokenRequest = await client.auth.createTokenRequest({
            clientId: userId,
            capability: JSON.stringify(capability),
        });
        return NextResponse.json(tokenRequest, { headers: { "cache-control": "no-store" } });
    } catch (err: any) {
        console.error("[ably] token request failed:", err?.message || err);
        return authError("Token request failed", 500);
    }
}
