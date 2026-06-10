import * as Ably from "ably";

/**
 * Server-side Ably REST publisher for real-time nav badges.
 * The ABLY_API_KEY stays on the server; browsers authenticate via /api/ably/token
 * (token auth) and only ever get a subscribe-scoped token for their own channel.
 *
 * Every helper is fire-and-forget and swallows errors, so a realtime hiccup (or a
 * missing key in some environment) can never break the request that triggered it.
 */

let rest: Ably.Rest | null = null;

function getRest(): Ably.Rest | null {
    const key = process.env.ABLY_API_KEY;
    if (!key) return null;
    if (!rest) rest = new Ably.Rest(key);
    return rest;
}

export function userChannelName(userId: string) {
    return `user:${userId}`;
}

export function conversationChannelName(conversationId: string) {
    return `conversation:${conversationId}`;
}

/**
 * Publish a realtime event into a conversation channel so the other participant's
 * open thread updates instantly (no polling). Fire-and-forget — a realtime hiccup
 * never breaks the DB write that triggered it; the slow fallback poll reconciles.
 *
 * Events: "message" | "reaction" | "unsend" | "read".
 */
export async function publishToConversation(
    conversationId: string,
    event: string,
    data: Record<string, unknown>,
) {
    try {
        const client = getRest();
        if (!client) return;
        await client.channels.get(conversationChannelName(conversationId)).publish(event, data);
    } catch (err: any) {
        console.error("[ably] publishToConversation failed:", err?.message || err);
    }
}

/**
 * Nudge a user's client to refresh its nav badge counts. We publish a tiny signal
 * (not the counts themselves) and let the client refetch getBadgeCounts — keeps the
 * server authoritative and avoids drift.
 */
export async function notifyUser(userId: string | null | undefined, data: Record<string, unknown> = {}) {
    if (!userId) return;
    try {
        const client = getRest();
        if (!client) return;
        await client.channels.get(userChannelName(userId)).publish("badge", { ts: Date.now(), ...data });
    } catch (err: any) {
        console.error("[ably] notifyUser failed:", err?.message || err);
    }
}
