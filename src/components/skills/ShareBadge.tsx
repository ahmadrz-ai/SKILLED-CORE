"use client";

import { useState } from "react";
import { Share2, Link2, Check, Linkedin } from "lucide-react";
import { toast } from "sonner";

/**
 * Share controls for a verified skill badge: copy the public verification link
 * and open LinkedIn's share dialog. The link is /badge/{id}, a public page that
 * unfurls with the candidate + skill + score.
 */
export function ShareBadge({ badgeId, skillName }: { badgeId: string; skillName: string }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const url = typeof window !== "undefined"
        ? `${window.location.origin}/badge/${badgeId}`
        : `/badge/${badgeId}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Verification link copied");
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Could not copy link");
        }
    };

    const linkedIn = () => {
        const share = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(share, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen((o) => !o)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-verified-gold hover:text-verified-gold-strong"
                aria-label={`Share ${skillName} verified badge`}
            >
                <Share2 className="w-3 h-3" /> Share
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
                    <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border-default bg-bg-card shadow-sc-dropdown p-1">
                        <button onClick={copy} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-body hover:bg-sc-gray-100">
                            {copied ? <Check className="w-3.5 h-3.5 text-text-success" /> : <Link2 className="w-3.5 h-3.5" />} Copy link
                        </button>
                        <button onClick={linkedIn} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-body hover:bg-sc-gray-100">
                            <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" /> Share on LinkedIn
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
