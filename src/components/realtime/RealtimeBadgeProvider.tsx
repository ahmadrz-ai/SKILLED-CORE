"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import type * as Ably from "ably";
import { getAblyClient } from "@/lib/ablyClient";
import { getBadgeCounts } from "@/app/actions/notifications";

type Counts = Record<string, number | boolean>;

interface BadgeCtx {
    counts: Counts;
    refresh: () => void;
    /** Optimistically zero a badge when its section is opened (server reconciles on next refresh). */
    clear: (key: string) => void;
}

const BadgeContext = createContext<BadgeCtx>({ counts: {}, refresh: () => {}, clear: () => {} });

export const useBadges = () => useContext(BadgeContext);

/**
 * Single shell-level store for nav badge counts. Seeds from the server-rendered
 * counts, then keeps them live by subscribing to the user's Ably channel (token
 * auth) and refetching getBadgeCounts on each "badge" event — plus a focus refresh
 * and a slow fallback poll so badges stay correct even if realtime drops.
 */
export function RealtimeBadgeProvider({
    userId,
    initial,
    children,
}: {
    userId?: string | null;
    initial?: Counts;
    children: React.ReactNode;
}) {
    const [counts, setCounts] = useState<Counts>(initial || {});
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const refresh = useCallback(async () => {
        try {
            const fresh = await getBadgeCounts();
            setCounts((prev) => ({ ...prev, ...fresh }));
        } catch { /* keep last good counts */ }
    }, []);

    const debouncedRefresh = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(refresh, 400);
    }, [refresh]);

    const clear = useCallback((key: string) => {
        setCounts((prev) => ({ ...prev, [key]: 0 }));
    }, []);

    useEffect(() => {
        refresh(); // authoritative initial fetch

        const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
        document.addEventListener("visibilitychange", onVisible);
        // Lightweight safety net if the realtime channel ever drops.
        const fallback = setInterval(refresh, 45000);

        // Reuse the app-wide shared Ably connection (single socket per tab, single
        // token pipeline with backoff) — never construct a second Realtime client.
        let channel: Ably.RealtimeChannel | null = null;
        if (userId) {
            try {
                const client = getAblyClient();
                channel = client?.channels.get(`user:${userId}`) ?? null;
                channel?.subscribe("badge", () => debouncedRefresh());
            } catch (err) {
                console.error("[ably] badge subscribe failed:", err);
            }
        }

        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            clearInterval(fallback);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            // Unsubscribe our listener only — the shared connection stays alive for
            // the rest of the app (chat presence, typing, etc.).
            try { channel?.unsubscribe(); } catch { /* ignore */ }
        };
    }, [userId, refresh, debouncedRefresh]);

    return <BadgeContext.Provider value={{ counts, refresh, clear }}>{children}</BadgeContext.Provider>;
}

/** Small reusable count badge for nav items + the bell. */
export function NavBadge({ count, className }: { count?: number | boolean; className?: string }) {
    if (!count) return null;
    const label = typeof count === "number" ? (count > 9 ? "9+" : String(count)) : "";
    return (
        <span
            className={
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-badge-danger text-white text-[10px] font-bold leading-none shadow-sm " +
                (className || "")
            }
        >
            {label}
        </span>
    );
}
