'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Send, Lock, Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReportDetail, sendReportMessage } from "@/app/actions/reportPipeline";

export default function UserReportThread({ reportId }: { reportId: string }) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const res = await getReportDetail(reportId);
        if (res.success) setReport(res.report);
        if (!silent) setLoading(false);
    }, [reportId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const t = setInterval(() => load(true), 10000);
        return () => clearInterval(t);
    }, [load]);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [report?.messages?.length]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;
        setSending(true);
        setInput("");
        const res = await sendReportMessage(reportId, text);
        setSending(false);
        if (res.success) load(true);
        else { toast.error(res.message || "Failed to send"); setInput(text); }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-sc-purple-600" /></div>;
    }
    if (!report) {
        return <div className="py-24 text-center text-text-secondary">Report not found.</div>;
    }

    const closed = report.threadStatus === "CLOSED";

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-5">
            <Link href="/support/reports" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-heading transition-colors">
                <ChevronLeft className="w-4 h-4" /> My Reports
            </Link>

            <div className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-sc-card">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200">{report.category}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{report.status}</span>
                </div>
                <h1 className="text-lg font-bold text-text-heading">{report.reason}</h1>
                {report.body && <p className="text-sm text-text-secondary whitespace-pre-wrap mt-2 border-t border-border-subtle pt-3">{report.body}</p>}
            </div>

            <div className="bg-bg-card border border-border-card rounded-2xl shadow-sc-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-heading">Support Conversation</h2>
                    {closed && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-text-tertiary bg-bg-secondary-panel border border-border-default rounded-full px-2 py-0.5"><Lock className="w-3 h-3" /> Closed</span>}
                </div>

                <div ref={scrollRef} className="max-h-[420px] overflow-y-auto p-5 space-y-4 custom-scrollbar">
                    {report.messages.length === 0 ? (
                        <p className="text-sm text-text-tertiary italic text-center py-6">No messages yet. Our support team will reply here.</p>
                    ) : report.messages.map((m: any) => {
                        const fromAdmin = m.senderRole === "ADMIN";
                        return (
                            <div key={m.id} className={cn("flex gap-3 items-end", fromAdmin ? "" : "flex-row-reverse")}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border", fromAdmin ? "bg-sc-purple-600 border-sc-purple-700" : "bg-bg-secondary-panel border-border-default")}>
                                    {fromAdmin ? <Bot className="w-4 h-4 text-white" /> : <UserIcon className="w-4 h-4 text-text-secondary" />}
                                </div>
                                <div className="max-w-[75%]">
                                    <div className={cn("text-[10px] font-semibold text-text-tertiary mb-0.5", fromAdmin ? "" : "text-right")}>{fromAdmin ? "Support" : "You"} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                    <div className={cn("px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap", fromAdmin ? "bg-bg-secondary-panel text-text-body border border-border-default rounded-bl-sm" : "bg-sc-purple-600 text-white rounded-br-sm")}>{m.body}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-border-subtle">
                    {closed ? (
                        <p className="text-center text-xs text-text-tertiary italic py-2">This conversation has been closed by support. If you still need help, submit a new ticket from the Help page.</p>
                    ) : (
                        <div className="flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Write a reply…"
                                rows={1}
                                className="flex-1 resize-none bg-bg-input border border-border-input rounded-xl px-3.5 py-2.5 text-sm text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-border-focus max-h-32"
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !input.trim()}
                                className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
