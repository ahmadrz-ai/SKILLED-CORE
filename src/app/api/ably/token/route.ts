import { auth } from "@/auth";
import * as Ably from "ably";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Issues a short-lived Ably token scoped to the caller's own channel (subscribe
// only). The raw ABLY_API_KEY never leaves the server.
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
        const client = new Ably.Rest(key);
        const tokenRequest = await client.auth.createTokenRequest({
            clientId: session.user.id,
            capability: { [`user:${session.user.id}`]: ["subscribe"] },
        });
        return NextResponse.json(tokenRequest);
    } catch (err: any) {
        console.error("[ably] token request failed:", err?.message || err);
        return NextResponse.json({ error: "Token request failed" }, { status: 500 });
    }
}
