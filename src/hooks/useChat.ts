"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as Ably from "ably";
import { getAblyClient } from "@/lib/ablyClient";

/**
 * Global online presence. Enters `presence:global` with the signed-in clientId and
 * tracks the set of currently-present userIds — drives the green "online" dots in
 * the conversation list and chat header. Returns a Set of online userIds.
 */
export function usePresence(selfId?: string | null): Set<string> {
    const [online, setOnline] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!selfId) return;
        const client = getAblyClient();
        if (!client) return;

        const channel = client.channels.get("presence:global");
        let cancelled = false;

        const sync = async () => {
            try {
                const members = await channel.presence.get();
                if (cancelled) return;
                setOnline(new Set(members.map((m) => m.clientId).filter(Boolean) as string[]));
            } catch { /* presence not ready yet */ }
        };

        const onUpdate = () => sync();
        channel.presence.subscribe(["enter", "leave", "present", "update"], onUpdate);
        channel.presence.enter().then(sync).catch(() => { /* retried on connect */ });

        return () => {
            cancelled = true;
            try { channel.presence.unsubscribe(onUpdate); } catch { /* ignore */ }
            try { channel.presence.leave(); } catch { /* ignore */ }
        };
    }, [selfId]);

    return online;
}

export interface TypingUser {
    userId: string;
    name: string;
}

interface ConversationEvents {
    onMessage?: (data: any) => void;
    onReaction?: (data: any) => void;
    onUnsend?: (data: any) => void;
    onRead?: (data: { userId: string; at: number }) => void;
}

interface ConversationChannel {
    /** Other participants currently typing. */
    typingUsers: TypingUser[];
    /** Call on each keystroke; auto-publishes start/stop typing (debounced). */
    sendTyping: () => void;
    /** Tell the other side we've read up to now (read receipts). */
    publishRead: () => void;
    /** Ack that an inbound message was delivered to our client. */
    publishDelivered: (messageId: string) => void;
    /** Subscribe to delivery acks for our own sent messages. */
    connected: boolean;
}

/**
 * Live wiring for a single open conversation thread. Subscribes to message /
 * reaction / unsend / read / typing / delivered events on `conversation:{id}` and
 * exposes typing state plus publishers. The caller owns optimistic UI + the DB
 * writes; this hook only carries the realtime signal.
 */
export function useConversationChannel(
    conversationId: string | null | undefined,
    selfId: string | null | undefined,
    selfName: string,
    events: ConversationEvents & { onDelivered?: (messageId: string) => void },
): ConversationChannel {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [connected, setConnected] = useState(false);
    const channelRef = useRef<Ably.RealtimeChannel | null>(null);

    // Keep latest callbacks without re-subscribing on every render.
    const cbRef = useRef(events);
    cbRef.current = events;
    const nameRef = useRef(selfName);
    nameRef.current = selfName;

    // Per-typist expiry timers so a dropped "stop" still clears the indicator.
    const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!conversationId || !selfId) return;
        const client = getAblyClient();
        if (!client) return;

        const channel = client.channels.get(`conversation:${conversationId}`);
        channelRef.current = channel;
        const timers = typingTimers.current;

        const clearTypist = (userId: string) => {
            const t = timers.get(userId);
            if (t) clearTimeout(t);
            timers.delete(userId);
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        };

        const onMsg = (m: Ably.Message) => {
            const d = m.data || {};
            if (d.userId === selfId) return; // ignore our own echo
            cbRef.current.onMessage?.(d);
        };
        const onReact = (m: Ably.Message) => cbRef.current.onReaction?.(m.data);
        const onUnsend = (m: Ably.Message) => cbRef.current.onUnsend?.(m.data);
        const onRead = (m: Ably.Message) => {
            if (m.data?.userId === selfId) return;
            cbRef.current.onRead?.(m.data);
        };
        const onDelivered = (m: Ably.Message) => {
            if (m.data?.userId === selfId) return;
            cbRef.current.onDelivered?.(m.data?.messageId);
        };
        const onTyping = (m: Ably.Message) => {
            const d = m.data || {};
            if (!d.userId || d.userId === selfId) return;
            if (d.isTyping) {
                setTypingUsers((prev) =>
                    prev.some((u) => u.userId === d.userId) ? prev : [...prev, { userId: d.userId, name: d.name || "Someone" }],
                );
                const existing = timers.get(d.userId);
                if (existing) clearTimeout(existing);
                timers.set(d.userId, setTimeout(() => clearTypist(d.userId), 4000));
            } else {
                clearTypist(d.userId);
            }
        };

        channel.subscribe("message", onMsg);
        channel.subscribe("reaction", onReact);
        channel.subscribe("unsend", onUnsend);
        channel.subscribe("read", onRead);
        channel.subscribe("delivered", onDelivered);
        channel.subscribe("typing", onTyping);

        const onState = () => setConnected(client.connection.state === "connected");
        client.connection.on(onState);
        onState();

        return () => {
            try { channel.unsubscribe(); } catch { /* ignore */ }
            try { client.connection.off(onState); } catch { /* ignore */ }
            timers.forEach((t) => clearTimeout(t));
            timers.clear();
            setTypingUsers([]);
            channelRef.current = null;
        };
    }, [conversationId, selfId]);

    const publish = useCallback((event: string, data: Record<string, unknown>) => {
        try { channelRef.current?.publish(event, { ...data, userId: selfId }); } catch { /* ignore */ }
    }, [selfId]);

    const sendTyping = useCallback(() => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            publish("typing", { isTyping: true, name: nameRef.current });
        }
        if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
        typingStopTimer.current = setTimeout(() => {
            isTypingRef.current = false;
            publish("typing", { isTyping: false, name: nameRef.current });
        }, 2500);
    }, [publish]);

    const publishRead = useCallback(() => {
        publish("read", { at: Date.now() });
    }, [publish]);

    const publishDelivered = useCallback((messageId: string) => {
        publish("delivered", { messageId });
    }, [publish]);

    return { typingUsers, sendTyping, publishRead, publishDelivered, connected };
}
