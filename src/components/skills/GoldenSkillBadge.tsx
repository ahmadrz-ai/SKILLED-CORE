import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoldenSkillBadgeProps {
    /** Skill display name, e.g. "FRONTEND". */
    name: string;
    /** Interview score that earned the badge (0–100). Shown on md size. */
    score?: number;
    /** Link to the verifying interview detail page. */
    interviewId?: string | null;
    size?: "sm" | "md";
    className?: string;
}

/**
 * Golden Skill Badge — the ONE visual for an interview-verified skill (Branding
 * §6.17). Used on the profile AI-Verified block, Skills & Arsenal, and /hire
 * talent cards. Gold tokens only; never reuse this style for unverified chips.
 */
export function GoldenSkillBadge({ name, score, interviewId, size = "md", className }: GoldenSkillBadgeProps) {
    const chip = (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-bold tracking-wide select-none",
                "bg-verified-gold-tint border border-verified-gold-border text-verified-gold",
                "shadow-[0_1px_3px_rgba(184,134,11,0.18)] ring-1 ring-inset ring-white/60",
                "transition-colors hover:border-verified-gold hover:text-verified-gold-strong",
                size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
                className
            )}
            title={score != null ? `Verified via AI interview — ${score}/100` : "Verified via AI interview"}
        >
            <BadgeCheck className={cn("shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} aria-hidden />
            <span className="uppercase">{name}</span>
            {size === "md" && score != null && (
                <span className="font-mono font-black text-[10px] opacity-80">{score}</span>
            )}
        </span>
    );

    if (interviewId) {
        return (
            <Link href={`/interview/${interviewId}`} className="no-underline" aria-label={`${name} — view verifying interview`}>
                {chip}
            </Link>
        );
    }
    return chip;
}
