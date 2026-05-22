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
            plan === "ULTRA" ? "bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-[0_0_8px_rgba(124,58,237,0.15)]" :
                plan === "PRO" ? "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.15)]" :
                    "bg-slate-100 text-slate-500 border-slate-200"
        )}>
            {plan === "ULTRA" && <Crown className="w-3 h-3 fill-current" />}
            {plan === "PRO" && <Star className="w-3 h-3 fill-current" />}
            {plan === "BASIC" && <Shield className="w-3 h-3" />}
            {plan}
        </div>
    );
}
