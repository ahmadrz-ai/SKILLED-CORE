"use client";

import { useEffect, useState } from "react";
import { getPlan } from "@/app/actions/credits";
import { cn } from "@/lib/utils";
import { Crown, Star, Shield } from "lucide-react";

export function PlanBadge({ plan: initialPlan }: { plan?: string }) {
    const [plan, setPlan] = useState<string | null>(initialPlan || null);

    useEffect(() => {
        if (!initialPlan) {
            getPlan().then(setPlan);
        } else {
            setPlan(initialPlan);
        }
    }, [initialPlan]);

    if (!plan) return null;

    return (
        <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 border",
            plan === "ULTRA" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]" :
                plan === "PRO" ? "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.2)]" :
                    "bg-zinc-800 text-zinc-500 border-zinc-700"
        )}>
            {plan === "ULTRA" && <Crown className="w-3 h-3 fill-current" />}
            {plan === "PRO" && <Star className="w-3 h-3 fill-current" />}
            {plan === "BASIC" && <Shield className="w-3 h-3" />}
            {plan}
        </div>
    );
}
