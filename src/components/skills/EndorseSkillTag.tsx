"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { endorseSkill } from "@/app/actions/endorsements";
import { cn } from "@/lib/utils";

/**
 * A skill chip with a thumbs-up endorse toggle. Viewers (not the profile owner)
 * can endorse; the owner just sees the count.
 */
export function EndorseSkillTag({
    skill, targetUserId, canEndorse, count: initialCount, mine: initialMine,
}: {
    skill: string;
    targetUserId: string;
    canEndorse: boolean;
    count: number;
    mine: boolean;
}) {
    const [count, setCount] = useState(initialCount);
    const [mine, setMine] = useState(initialMine);
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        if (!canEndorse || busy) return;
        setBusy(true);
        const nextMine = !mine;
        setMine(nextMine);
        setCount((c) => c + (nextMine ? 1 : -1));
        const res = await endorseSkill(targetUserId, skill);
        setBusy(false);
        if (!res.success) {
            setMine(!nextMine);
            setCount((c) => c + (nextMine ? -1 : 1));
            toast.error(res.message || "Couldn't endorse.");
        } else {
            setMine(!!res.endorsed);
            if (typeof res.count === "number") setCount(res.count);
        }
    };

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 border border-slate-200">
            {skill}
            {canEndorse ? (
                <button
                    onClick={toggle}
                    disabled={busy}
                    title={mine ? "Remove endorsement" : "Endorse this skill"}
                    className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 transition-colors border-none cursor-pointer",
                        mine ? "bg-sc-purple-100 text-sc-purple-700" : "bg-transparent hover:bg-slate-200 text-slate-500",
                    )}
                >
                    <ThumbsUp className={cn("w-3 h-3", mine && "fill-current")} />
                    {count > 0 && <span>{count}</span>}
                </button>
            ) : count > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-slate-500">
                    <ThumbsUp className="w-3 h-3" /> {count}
                </span>
            ) : null}
        </span>
    );
}
