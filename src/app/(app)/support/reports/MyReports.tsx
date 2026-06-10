'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyReports } from "@/app/actions/reportPipeline";
import { reportStatusLabel, reportStatusClasses } from "@/lib/reportStatus";

export default function MyReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyReports().then(res => {
            if (res.success) setReports(res.reports);
            setLoading(false);
        });
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="border-b border-border-subtle pb-4">
                <h1 className="text-2xl font-bold text-text-heading tracking-tight">My Reports & Tickets</h1>
                <p className="text-sm text-text-secondary mt-1">Track the reports you submitted and chat with the support team.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-sc-purple-600" /></div>
            ) : reports.length === 0 ? (
                <div className="text-center py-16 bg-bg-card border border-border-card rounded-2xl">
                    <MessageSquare className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
                    <h3 className="font-bold text-text-heading">No reports yet</h3>
                    <p className="text-sm text-text-secondary mt-1">When you submit a bug, suggestion, or support ticket, it will appear here.</p>
                    <Link href="/help" className="inline-block mt-4 text-sm font-bold text-sc-purple-600 hover:underline">Go to Help & Support</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map(r => (
                        <Link
                            key={r.id}
                            href={`/support/reports/${r.id}`}
                            className="block bg-bg-card border border-border-card rounded-xl p-4 shadow-sc-xs hover:border-border-selected transition-colors group"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200">{r.category}</span>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                            reportStatusClasses(r.status)
                                        )}>{reportStatusLabel(r.status)}</span>
                                        {r.threadStatus === "CLOSED" && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-text-tertiary"><Lock className="w-3 h-3" /> closed</span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-text-heading text-sm truncate">{r.reason}</h3>
                                    {r.lastMessage && (
                                        <p className="text-xs text-text-secondary truncate mt-0.5">
                                            <span className="font-semibold">{r.lastMessageRole === "ADMIN" ? "Support: " : "You: "}</span>{r.lastMessage}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-brand shrink-0" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
