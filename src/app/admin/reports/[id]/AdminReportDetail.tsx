'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    ChevronLeft, Sparkles, Copy, Check, Loader2, Send, Lock, Unlock,
    ShieldCheck, AlertTriangle, Bot, User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getReportDetail, analyzeReport, sendReportMessage, setReportThreadStatus } from "@/app/actions/reportPipeline";

export default function AdminReportDetail({ reportId }: { reportId: string }) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState("");
    const [copied, setCopied] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const res = await getReportDetail(reportId);
        if (res.success) setReport(res.report);
        if (!silent) setLoading(false);
    }, [reportId]);

    useEffect(() => { load(); }, [load]);
    // Poll the thread so admin sees user replies without reload.
    useEffect(() => {
        const t = setInterval(() => load(true), 10000);
        return () => clearInterval(t);
    }, [load]);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [report?.messages?.length]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        const res = await analyzeReport(reportId);
        setAnalyzing(false);
        if (res.success) { toast.success("AI analysis ready"); load(true); }
        else toast.error(res.message || "Analysis failed");
    };

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

    const toggleThread = async () => {
        const next = report.threadStatus === "CLOSED" ? "OPEN" : "CLOSED";
        const res = await setReportThreadStatus(reportId, next);
        if (res.success) { toast.success(next === "CLOSED" ? "Thread closed" : "Thread reopened"); load(true); }
        else toast.error(res.message || "Failed");
    };

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        toast.success("Copied");
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) {
        return <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-sc-purple-600" /></div>;
    }
    if (!report) {
        return <div className="py-24 text-center text-text-secondary">Report not found.</div>;
    }

    const sevColor = report.severity === "CRITICAL" ? "bg-sc-red-50 text-text-error border-sc-red-200"
        : report.severity === "HIGH" ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-bg-secondary-panel text-text-secondary border-border-default";
    const closed = report.threadStatus === "CLOSED";

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
            <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-heading transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Reports
            </Link>

            {/* Header */}
            <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sc-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", sevColor)}>{report.severity}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200">{report.category}</span>
                            <span className="text-xs text-text-tertiary font-mono">{report.targetType}</span>
                        </div>
                        <h1 className="text-xl font-bold text-text-heading tracking-tight">{report.reason}</h1>
                        <p className="text-xs text-text-tertiary mt-1">
                            By {report.reporter?.name || "Unknown"} • {new Date(report.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={toggleThread}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors shrink-0",
                            closed ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                   : "bg-sc-red-50 text-text-error border-sc-red-200 hover:bg-sc-red-100"
                        )}
                    >
                        {closed ? <><Unlock className="w-3.5 h-3.5" /> Reopen thread</> : <><Lock className="w-3.5 h-3.5" /> Close thread</>}
                    </button>
                </div>
                {report.body && (
                    <p className="mt-4 text-sm text-text-body whitespace-pre-wrap border-t border-border-subtle pt-4">{report.body}</p>
                )}
            </div>

            {/* AI triage */}
            <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sc-card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-text-heading flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sc-purple-600" /> AI Triage
                    </h2>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="inline-flex items-center gap-1.5 bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                        {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {report.aiSummary ? "Re-analyze" : "Analyze with AI"}
                    </button>
                </div>

                {report.aiSummary ? (
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Summary</span>
                                <button onClick={() => copy(report.aiSummary, "sum")} className="text-text-tertiary hover:text-text-heading">{copied === "sum" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}</button>
                            </div>
                            <p className="text-sm text-text-body whitespace-pre-wrap leading-relaxed bg-bg-secondary-panel border border-border-subtle rounded-lg p-3">{report.aiSummary}</p>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Coding-AI Fix Prompt</span>
                                <button onClick={() => copy(report.fixPrompt, "fix")} className="text-text-tertiary hover:text-text-heading">{copied === "fix" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}</button>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap leading-relaxed bg-[#0C0C0E] text-[#F8F8FA] rounded-lg p-3 overflow-x-auto font-mono">{report.fixPrompt}</pre>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary italic">Not analyzed yet. Run AI triage to generate a technical summary and a copy-paste fix prompt.</p>
                )}
            </div>

            {/* Support thread */}
            <div className="bg-bg-card border border-border-card rounded-2xl shadow-sc-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-heading">Conversation with {report.reporter?.name || "user"}</h2>
                    {closed && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-text-error bg-sc-red-50 border border-sc-red-200 rounded-full px-2 py-0.5"><Lock className="w-3 h-3" /> Closed</span>}
                </div>

                <div ref={scrollRef} className="max-h-[420px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {report.messages.length === 0 ? (
                        <p className="text-sm text-text-tertiary italic text-center py-6">No messages yet. Send the first reply to the user.</p>
                    ) : report.messages.map((m: any) => {
                        const fromAdmin = m.senderRole === "ADMIN";
                        return (
                            <div key={m.id} className={cn("flex gap-3 items-end", fromAdmin ? "flex-row-reverse" : "")}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border", fromAdmin ? "bg-sc-purple-600 border-sc-purple-700" : "bg-bg-secondary-panel border-border-default")}>
                                    {fromAdmin ? <Bot className="w-4 h-4 text-white" /> : <UserIcon className="w-4 h-4 text-text-secondary" />}
                                </div>
                                <div className={cn("max-w-[75%]")}>
                                    <div className={cn("text-[10px] font-semibold text-text-tertiary mb-0.5", fromAdmin ? "text-right" : "")}>{m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                    <div className={cn("px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap", fromAdmin ? "bg-sc-purple-600 text-white rounded-br-sm" : "bg-bg-secondary-panel text-text-body border border-border-default rounded-bl-sm")}>{m.body}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-border-subtle">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Reply to the user…"
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
                </div>
            </div>
        </div>
    );
}
