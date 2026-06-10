"use client";

import * as Ably from "ably";

/**
 * One shared Ably Realtime connection for the whole browser tab. Every consumer
 * (badge provider, chat hooks, presence) reuses it instead of opening its own
 * socket — Ably bills/limits per connection, and a single client keeps presence
 * stable and avoids duplicate token requests.
 *
 * Auth is a custom authCallback (not authUrl) so WE own the failure behavior:
 *  - single-flight: concurrent token demands share one in-flight fetch — a failure
 *    can never fan out into parallel XHR bursts (audit bug I1);
 *  - exponential backoff with a cap: after each consecutive failure the next
 *    attempt is delayed 2s → 4s → 8s … capped at 2 min, so a down/misconfigured
 *    endpoint produces a quiet trickle instead of a retry storm;
 *  - errors surface as non-fatal: the app keeps working on its polling fallbacks.
 */
let client: Ably.Realtime | null = null;

let inFlight: Promise<Ably.TokenRequest> | null = null;
let consecutiveFailures = 0;
let nextAllowedAt = 0; // epoch ms gate for the next token attempt after failures

const BACKOFF_BASE_MS = 2_000;
const BACKOFF_CAP_MS = 120_000;

async function fetchTokenRequest(): Promise<Ably.TokenRequest> {
    const res = await fetch("/api/ably/token", { method: "GET", cache: "no-store" });
    if (!res.ok) {
        // The endpoint intentionally returns plain text on error; surface the status.
        throw new Error(`token endpoint ${res.status}`);
    }
    return (await res.json()) as Ably.TokenRequest;
}

async function getTokenRequest(): Promise<Ably.TokenRequest> {
    // Backoff gate: while inside the cooldown window after failures, refuse fast
    // retries instead of hammering the endpoint (ably-js will ask again later).
    const now = Date.now();
    if (now < nextAllowedAt) {
        throw new Error(`token request backing off (${Math.ceil((nextAllowedAt - now) / 1000)}s)`);
    }

    if (!inFlight) {
        inFlight = fetchTokenRequest()
            .then((tr) => {
                consecutiveFailures = 0;
                nextAllowedAt = 0;
                return tr;
            })
            .catch((err) => {
                consecutiveFailures += 1;
                const delay = Math.min(BACKOFF_BASE_MS * 2 ** (consecutiveFailures - 1), BACKOFF_CAP_MS);
                nextAllowedAt = Date.now() + delay;
                console.warn(`[ably] token request failed (attempt ${consecutiveFailures}), next try in ${delay / 1000}s:`, err?.message || err);
                throw err;
            })
            .finally(() => {
                inFlight = null;
            });
    }
    return inFlight;
}

export function getAblyClient(): Ably.Realtime | null {
    if (typeof window === "undefined") return null;
    if (!client) {
        try {
            client = new Ably.Realtime({
                authCallback: (_params, callback) => {
                    getTokenRequest().then(
                        (tokenRequest) => callback(null, tokenRequest),
                        (err) => callback(String(err?.message || err), null),
                    );
                },
                // Reconnect quietly; chat tolerates brief drops (fallback poll reconciles).
                disconnectedRetryTimeout: 5000,
                suspendedRetryTimeout: 15000,
            });
        } catch (err) {
            console.error("[ably] client init failed:", err);
            return null;
        }
    }
    return client;
}

/**
 * Force a token refresh (e.g. right after creating a conversation the current
 * token doesn't yet cover). Respects the same single-flight + backoff.
 */
export function reauthorizeAbly() {
    try { getAblyClient()?.auth.authorize(); } catch { /* refreshes on next connect */ }
}
