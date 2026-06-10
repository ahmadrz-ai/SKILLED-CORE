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
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key = process.env.ABLY_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "Realtime not configured" }, { status: 503 });
    }

    try {
        const userId = session.user.id;

        const capability: Record<string, string[]> = {
            [`user:${userId}`]: ["subscribe"],
            "presence:global": ["subscribe", "presence"],
        };

        // Scope conversation channels to threads the caller is a participant of.
        try {
            const convos = await prisma.conversation.findMany({
                where: { participants: { some: { userId } } },
                select: { id: true },
            });
            for (const c of convos) {
                capability[`conversation:${c.id}`] = ["publish", "subscribe", "presence"];
            }
        } catch (e) {
            // A DB hiccup shouldn't block realtime entirely — the user still gets
            // badges + presence; conversation channels resolve on the next token.
            console.error("[ably] capability enumeration failed:", e);
        }

        const client = new Ably.Rest(key);
        const tokenRequest = await client.auth.createTokenRequest({
            clientId: userId,
            capability: JSON.stringify(capability),
        });
        return NextResponse.json(tokenRequest);
    } catch (err: any) {
        console.error("[ably] token request failed:", err?.message || err);
        return NextResponse.json({ error: "Token request failed" }, { status: 500 });
    }
}
