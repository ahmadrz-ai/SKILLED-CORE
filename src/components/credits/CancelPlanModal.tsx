"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelSubscription } from "@/app/actions/credits";

const REASONS = [
    "Too expensive",
    "I'm not using it enough",
    "Missing features I need",
    "Found a better alternative",
    "Just exploring for now",
    "Other",
];

export function CancelPlanModal({
    open,
    onClose,
    planName,
    onCancelled,
}: {
    open: boolean;
    onClose: () => void;
    planName: string;
    onCancelled?: () => void;
}) {
    const [reason, setReason] = useState<string | null>(null);
    const [detail, setDetail] = useState("");
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const submit = async () => {
        if (!reason) {
            toast.error("Please tell us why so we can improve.");
            return;
        }
        setLoading(true);
        const res = await cancelSubscription(reason, detail);
        setLoading(false);
        if (res.success) {
            toast.success("Your subscription has been cancelled. You're on the Free plan.");
            onCancelled?.();
            onClose();
        } else {
            toast.error("Could not cancel right now. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-border-default bg-bg-card shadow-sc-modal p-6 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-3 right-3 text-text-tertiary hover:text-text-heading" aria-label="Close">
                    <X className="w-4 h-4" />
                </button>

                <h3 className="text-lg font-bold text-text-heading">Cancel {planName} plan?</h3>
                <p className="text-sm text-text-secondary mt-1">
                    You'll keep access until the end of your billing period, then move to the Free plan.
                    Mind sharing why? It genuinely helps us improve.
                </p>

                <div className="mt-5 space-y-2">
                    {REASONS.map((r) => (
                        <button
                            key={r}
                            onClick={() => setReason(r)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                reason === r
                                    ? "border-sc-purple-400 bg-sc-purple-50 text-sc-purple-800"
                                    : "border-border-default bg-bg-page text-text-body hover:bg-sc-gray-50"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Anything else you'd like us to know? (optional)"
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-text-body placeholder:text-text-placeholder focus:border-border-focus focus:outline-none resize-none"
                />

                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-border-default px-4 py-2.5 text-sm font-semibold text-text-heading hover:bg-sc-gray-50 transition-colors"
                    >
                        Keep my plan
                    </button>
                    <button
                        onClick={submit}
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sc-red-700 transition-colors disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel subscription"}
                    </button>
                </div>
            </div>
        </div>
    );
}
