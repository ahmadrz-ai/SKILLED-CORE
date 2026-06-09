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

    // Display label: the stored/legacy plan code (BASIC/PRO/ULTRA) maps to the
    // user-facing plan names. ULTRA is the legacy code for the "Elite" plan.
    const label = plan === "ULTRA" ? "Elite" : plan === "PRO" ? "Pro" : plan === "BASIC" ? "Free" : plan;

    return (
        <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 border",
            plan === "ULTRA" ? "bg-sc-purple-50 text-sc-purple-600 border-sc-purple-200" :
                plan === "PRO" ? "bg-sc-purple-50 text-sc-purple-500 border-sc-purple-200" :
                    "bg-slate-100 text-slate-500 border-slate-200"
        )}>
            {plan === "ULTRA" && <Crown className="w-3 h-3 fill-current" />}
            {plan === "PRO" && <Star className="w-3 h-3 fill-current" />}
            {plan === "BASIC" && <Shield className="w-3 h-3" />}
            {label}
        </div>
    );
}
