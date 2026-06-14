"use client";

import { useState } from "react";
import { Flag, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { submitReport } from "@/app/actions/adminReports";

const REASONS = [
    { value: "spam", label: "Spam or scam" },
    { value: "harassment", label: "Harassment or hate" },
    { value: "fake", label: "Fake or impersonating profile" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "other", label: "Something else" },
];

export function ReportUserModal({
    open, onClose, user,
}: {
    open: boolean;
    onClose: () => void;
    user: { id: string; name?: string | null; username?: string | null };
}) {
    const [reason, setReason] = useState("spam");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const submit = async () => {
        setSubmitting(true);
        const label = REASONS.find((r) => r.value === reason)?.label || reason;
        const handle = user.username || user.id;
        const res: any = await submitReport(
            `User report — @${handle} (${user.id})\nReason: ${label}${details.trim() ? `\nDetails: ${details.trim()}` : ""}`,
            "abuse",
            reason === "harassment" || reason === "fake" ? "high" : "medium",
        );
        setSubmitting(false);
        if (res?.success) {
            toast.success("Report submitted. Our team will review it.");
            setDetails("");
            onClose();
        } else {
            toast.error(res?.error || "Could not submit the report.");
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-bg-overlay backdrop-blur-md p-4" onClick={onClose}>
            <div className="bg-bg-modal border border-border-modal rounded-2xl shadow-sc-modal max-w-md w-full p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sc-red-100 text-sc-red-600"><Flag className="w-5 h-5" /></span>
                        <div>
                            <h3 className="text-base font-bold text-text-heading leading-tight">Report {user.name || "user"}</h3>
                            <p className="text-xs text-text-secondary">This is confidential — they won&apos;t be notified.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-tertiary hover:text-text-heading"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Reason</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)}
                        className="w-full rounded-xl border border-border-default bg-bg-secondary-panel px-4 py-2.5 text-sm text-text-heading outline-none focus:border-sc-purple-400">
                        {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Details <span className="font-normal text-text-tertiary normal-case">(optional)</span></label>
                    <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={600}
                        placeholder="Add any context that will help our team."
                        className="w-full resize-none rounded-xl border border-border-default bg-bg-secondary-panel px-4 py-2.5 text-sm text-text-heading outline-none focus:border-sc-purple-400" />
                </div>

                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border-default bg-bg-card text-text-body font-semibold text-sm hover:bg-bg-sidebar-hover">Cancel</button>
                    <button onClick={submit} disabled={submitting}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-sc-red-600 hover:bg-sc-red-700 disabled:opacity-60 text-white font-semibold text-sm">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                        {submitting ? "Submitting…" : "Submit report"}
                    </button>
                </div>
            </div>
        </div>
    );
}
