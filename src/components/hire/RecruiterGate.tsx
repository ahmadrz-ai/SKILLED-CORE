"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, ArrowRight, X, MapPin } from "lucide-react";

interface GateCandidate {
    id: string;
    name: string;
    image?: string | null;
    headline?: string | null;
    location?: string | null;
}

/**
 * Role-based access gate for recruiters.
 *
 * Recruiters can't contact candidates directly or view their resume/socials — those
 * actions open this modal: the page behind blurs, a card shows the candidate, and the
 * only way forward is to Book an Interview. Candidates and admins are never gated.
 */
export function RecruiterGate({
    open,
    onClose,
    candidate,
    action = "do this",
    onBook,
}: {
    open: boolean;
    onClose: () => void;
    candidate: GateCandidate | null;
    action?: string;
    onBook?: () => void;
}) {
    const router = useRouter();
    if (!open || !candidate) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Blurred backdrop over the page */}
            <div
                className="absolute inset-0 bg-bg-overlay backdrop-blur-md"
                onClick={onClose}
                aria-hidden
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-default bg-bg-card shadow-sc-modal p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-text-tertiary hover:text-text-heading transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-sc-purple-50 text-sc-purple-600 mx-auto">
                    <Lock className="w-6 h-6" />
                </span>

                {/* Candidate mini profile card */}
                <div className="mt-4 flex flex-col items-center">
                    {candidate.image ? (
                        <Image src={candidate.image} alt={candidate.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover border border-border-default" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-sc-purple-100 text-sc-purple-700 flex items-center justify-center text-xl font-bold">
                            {candidate.name?.[0] || "?"}
                        </div>
                    )}
                    <h3 className="mt-3 font-bold text-text-heading">{candidate.name}</h3>
                    {candidate.headline && (
                        <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{candidate.headline}</p>
                    )}
                    {candidate.location && (
                        <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {candidate.location}
                        </p>
                    )}
                </div>

                <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                    To {action}, book an interview with this candidate. Direct contact, resume, and
                    social links are unlocked through the interview flow — keeping evaluations fair
                    and on-platform.
                </p>

                <button
                    onClick={() => { onClose(); if (onBook) { onBook(); } else { router.push(`/hire?book=${candidate.id}`); } }}
                    className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors"
                >
                    Book Interview <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    onClick={onClose}
                    className="mt-2 w-full text-xs font-medium text-text-tertiary hover:text-text-secondary"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}
