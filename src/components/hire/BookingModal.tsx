"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CalendarClock, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createBooking } from "@/app/actions/bookings";
import { useRouter } from "next/navigation";

interface BookingCandidate {
    id: string;
    name: string;
    image?: string | null;
    headline?: string | null;
}

/** Recruiter-facing modal to request an interview with a candidate. */
export function BookingModal({
    open,
    onClose,
    candidate,
}: {
    open: boolean;
    onClose: () => void;
    candidate: BookingCandidate | null;
}) {
    const router = useRouter();
    const [proposedAt, setProposedAt] = useState("");
    const [message, setMessage] = useState("");
    const [expiresInDays, setExpiresInDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    // Portal target: mount only on the client so the modal can render into
    // document.body and escape any ancestor with overflow-hidden or a transform
    // (the candidate card had both, which trapped/clipped the fixed overlay).
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!open || !candidate || !mounted) return null;

    const reset = () => { setProposedAt(""); setMessage(""); setExpiresInDays(7); setDone(false); };
    const close = () => { reset(); onClose(); };

    const submit = async () => {
        if (!proposedAt) { toast.error("Pick a proposed date and time."); return; }
        setLoading(true);
        const res = await createBooking({ candidateId: candidate.id, proposedAt: new Date(proposedAt).toISOString(), message, expiresInDays });
        setLoading(false);
        if (res.success) {
            setDone(true);
        } else {
            toast.error(res.message || "Could not send the request.");
        }
    };

    // Default min = now (local). datetime-local needs "YYYY-MM-DDTHH:mm".
    const minLocal = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-bg-overlay backdrop-blur-sm" onClick={close} aria-hidden />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-border-default bg-bg-card shadow-sc-modal p-6 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={close} className="absolute top-3 right-3 text-text-tertiary hover:text-text-heading" aria-label="Close">
                    <X className="w-4 h-4" />
                </button>

                {done ? (
                    <div className="text-center py-4">
                        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-sc-green-100 text-sc-green-700 mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-text-heading">Request sent</h3>
                        <p className="text-sm text-text-secondary mt-1">
                            {candidate.name} will be notified and can accept or decline. You'll see the status in your bookings.
                        </p>
                        <button
                            onClick={() => { close(); router.push("/bookings"); }}
                            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors"
                        >
                            View my bookings <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-5">
                            {candidate.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={candidate.image} alt={candidate.name} className="w-11 h-11 rounded-full object-cover border border-border-default" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-sc-purple-100 text-sc-purple-700 flex items-center justify-center font-bold">
                                    {candidate.name?.[0] || "?"}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="font-bold text-text-heading leading-tight">Book interview</h3>
                                <p className="text-sm text-text-secondary truncate">with {candidate.name}</p>
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-text-body-strong mb-1.5">Proposed date & time</label>
                        <div className="relative mb-4">
                            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                            <input
                                type="datetime-local"
                                value={proposedAt}
                                min={minLocal}
                                onChange={(e) => setProposedAt(e.target.value)}
                                className="w-full rounded-lg border border-border-input bg-bg-input pl-9 pr-3 py-2.5 text-sm text-text-body focus:border-border-focus focus:outline-none"
                            />
                        </div>

                        <label className="block text-sm font-medium text-text-body-strong mb-1.5">Message <span className="text-text-tertiary font-normal">(optional)</span></label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Share the role, what you'd like to assess, or any context…"
                            className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2 text-sm text-text-body placeholder:text-text-placeholder focus:border-border-focus focus:outline-none resize-none"
                        />

                        <label className="block text-sm font-medium text-text-body-strong mt-4 mb-1.5">Accept window</label>
                        <select
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(Number(e.target.value))}
                            className="w-full rounded-lg border border-border-input bg-bg-input px-3 py-2.5 text-sm text-text-body focus:border-border-focus focus:outline-none cursor-pointer"
                        >
                            <option value={1}>1 day to accept</option>
                            <option value={2}>2 days to accept</option>
                            <option value={3}>3 days to accept</option>
                            <option value={7}>7 days to accept (default)</option>
                            <option value={14}>14 days to accept</option>
                            <option value={30}>30 days to accept</option>
                        </select>

                        <p className="text-xs text-text-tertiary mt-3">The request auto-cancels if not accepted within the window. A video meeting link is added once the candidate accepts.</p>

                        <button
                            onClick={submit}
                            disabled={loading}
                            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send interview request <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
