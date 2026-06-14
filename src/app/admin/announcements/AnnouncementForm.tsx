"use client";

import { useState } from "react";
import { Megaphone, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { broadcastAnnouncement } from "../actions";

type Audience = "ALL" | "CANDIDATES" | "RECRUITERS";

export default function AnnouncementForm() {
    const [message, setMessage] = useState("");
    const [audience, setAudience] = useState<Audience>("ALL");
    const [sending, setSending] = useState(false);

    const send = async () => {
        if (message.trim().length < 3) { toast.error("Write a longer message."); return; }
        if (!confirm(`Send this announcement to ${audience.toLowerCase()}? This cannot be undone.`)) return;
        setSending(true);
        const res = await broadcastAnnouncement(message.trim(), audience);
        setSending(false);
        if (res.success) { toast.success(res.message); setMessage(""); }
        else toast.error(res.message || "Failed to send.");
    };

    return (
        <div className="max-w-2xl rounded-2xl border border-border-default bg-bg-card shadow-sc-card p-6 space-y-5">
            <div className="flex items-center gap-2 text-text-heading">
                <Megaphone className="w-5 h-5 text-sc-amber-700" />
                <h2 className="font-bold">New broadcast</h2>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)}
                    className="w-full rounded-xl border border-border-default bg-bg-secondary-panel px-4 py-2.5 text-sm text-text-heading outline-none focus:border-sc-purple-400">
                    <option value="ALL">Everyone</option>
                    <option value="CANDIDATES">Candidates only</option>
                    <option value="RECRUITERS">Recruiters only</option>
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={1000}
                    placeholder="e.g. 🎉 We just launched Live Video Interviews! Try it from the Interview page."
                    className="w-full resize-none rounded-xl border border-border-default bg-bg-secondary-panel px-4 py-3 text-sm text-text-heading outline-none focus:border-sc-purple-400" />
                <p className="text-[11px] text-text-tertiary text-right">{message.length}/1000</p>
            </div>

            <button onClick={send} disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending…" : "Send announcement"}
            </button>
        </div>
    );
}
