"use client";

import * as Ably from "ably";

/**
 * One shared Ably Realtime connection for the whole browser tab. Every chat hook
 * (presence, conversation channels) reuses it instead of opening its own socket —
 * Ably bills/limits per connection, and a single client keeps presence stable.
 *
 * Token auth via /api/ably/token, which scopes capabilities to the signed-in user.
 */
let client: Ably.Realtime | null = null;

export function getAblyClient(): Ably.Realtime | null {
    if (typeof window === "undefined") return null;
    if (!client) {
        try {
            client = new Ably.Realtime({
                authUrl: "/api/ably/token",
                authMethod: "GET",
                // Reconnect quietly; chat tolerates brief drops (fallback poll reconciles).
                disconnectedRetryTimeout: 5000,
                suspendedRetryTimeout: 10000,
            });
        } catch (err) {
            console.error("[ably] client init failed:", err);
            return null;
        }
    }
    return client;
}
