"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Coins, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getBillingContext } from "@/app/actions/credits";
import { PaymentModal } from "@/components/credits/PaymentModal";
import { CancelPlanModal } from "@/components/credits/CancelPlanModal";
import { plansFor, currentPlanCode, legacyTierFor, type PlanDef, type Audience } from "@/lib/plans";

function PlanCard({ plan, isCurrent, onSuccess }: { plan: PlanDef; isCurrent: boolean; onSuccess: () => void }) {
    const legacy = legacyTierFor(plan.code);
    const isFree = plan.priceMonthly === 0;
    const isCustom = plan.priceMonthly === -1;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={cn(
                "relative p-7 rounded-2xl border flex flex-col h-full bg-bg-card transition-all",
                plan.highlight ? "border-sc-purple-300 shadow-sc-md" : "border-border-default shadow-sc-card",
                isCurrent && "ring-2 ring-sc-purple-400"
            )}
        >
            {plan.tag && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-sc-purple-600 text-white px-3 py-1 rounded-full">
                    {plan.tag}
                </span>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">{plan.name}</h3>
                {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-sc-green-100 text-sc-green-700 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Active
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-text-heading">{plan.price}</span>
                {plan.cadence && <span className="text-sm text-text-secondary">{plan.cadence}</span>}
            </div>

            <ul className="mt-5 space-y-2.5 flex-1 border-t border-border-subtle pt-5">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-body">
                        <Check className="w-4 h-4 text-sc-green-600 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                ))}
            </ul>

            <div className="mt-6">
                {isCurrent ? (
                    <button disabled className="w-full py-2.5 rounded-lg text-sm font-bold bg-sc-green-100 text-sc-green-700 cursor-default">
                        Current plan
                    </button>
                ) : isFree ? (
                    <button disabled className="w-full py-2.5 rounded-lg text-sm font-semibold border border-border-default text-text-tertiary cursor-default">
                        Free tier
                    </button>
                ) : isCustom ? (
                    <Link href={plan.ctaHref} className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold border border-border-default text-text-heading hover:bg-sc-purple-50 hover:text-sc-purple-800 transition-colors">
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <PaymentModal mode="PLAN" planName={plan.name} planCode={legacy} fixedPrice={plan.priceMonthly} onSuccess={onSuccess}>
                        <button className={cn(
                            "w-full py-2.5 rounded-lg text-sm font-bold transition-colors",
                            plan.highlight ? "bg-sc-purple-600 hover:bg-sc-purple-700 text-white" : "border border-border-default text-text-heading hover:bg-sc-purple-50 hover:text-sc-purple-800"
                        )}>
                            {plan.cta}
                        </button>
                    </PaymentModal>
                )}
            </div>
        </motion.div>
    );
}

export default function PlansPage() {
    const [plan, setPlan] = useState("BASIC");
    const [role, setRole] = useState("CANDIDATE");
    const [credits, setCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [cancelOpen, setCancelOpen] = useState(false);

    const fetchData = async () => {
        const ctx = await getBillingContext();
        setPlan(ctx.plan);
        setRole(ctx.role);
        setCredits(ctx.credits);
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24 text-sc-purple-600">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const audience: Audience = role === "RECRUITER" ? "recruiter" : "candidate";
    const plans = plansFor(audience);
    const currentCode = currentPlanCode(plan, audience);
    const onPaidPlan = !!currentCode && currentCode !== "FREE";
    const currentName = plans.find((p) => p.code === currentCode)?.name || plan;

    return (
        <div className="min-h-screen p-6 lg:p-10 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-border-strong pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-heading">Plans &amp; Billing</h1>
                    <p className="text-sm text-text-secondary mt-1.5">
                        {audience === "recruiter" ? "Find and hire verified talent at any scale." : "Start free. Upgrade when you want to stand out."}
                    </p>
                </div>
                <div className="bg-bg-card border border-border-card px-5 py-3 rounded-2xl shadow-sc-card flex items-center gap-4 md:flex-col md:items-end md:gap-1">
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Credit balance</p>
                    <div className="text-2xl font-bold text-text-heading flex items-center gap-2">
                        {credits} <Coins className="w-6 h-6 text-sc-purple-600" />
                    </div>
                </div>
            </div>

            {/* Active subscription strip */}
            {onPaidPlan && (
                <div className="bg-bg-card border border-border-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sc-card">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Your subscription</p>
                        <p className="text-base font-bold text-text-heading mt-1">{currentName} · <span className="text-text-success">Active</span></p>
                        <p className="text-xs text-text-secondary mt-0.5">Renews monthly · cancel anytime.</p>
                    </div>
                    <button onClick={() => setCancelOpen(true)} className="text-sm font-semibold text-text-secondary hover:text-sc-red-600 transition-colors">
                        Cancel subscription
                    </button>
                </div>
            )}

            {/* Plans grid (exact landing plans for this audience) */}
            <div className={cn("grid grid-cols-1 gap-6 items-stretch", plans.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2 max-w-3xl")}>
                {plans.map((p) => (
                    <PlanCard key={p.code} plan={p} isCurrent={p.code === currentCode} onSuccess={fetchData} />
                ))}
            </div>

            {/* Credit top-up (hybrid: top-ups for overage) */}
            <div className="bg-bg-card border border-border-card rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sc-card">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sc-purple-50 flex items-center justify-center border border-sc-purple-200">
                        <CreditCard className="w-6 h-6 text-sc-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-text-heading">Quick credit top-up</h3>
                        <p className="text-text-secondary text-xs mt-0.5">Running low? Add credits for extra usage beyond your plan.</p>
                    </div>
                </div>
                <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-left md:text-right">
                        <span className="block text-lg font-bold text-text-heading">+5 Credits</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sc-green-100 text-sc-green-700">$1.00 USD</span>
                    </div>
                    <PaymentModal onSuccess={fetchData}>
                        <button className="px-6 py-3 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors">
                            Buy now
                        </button>
                    </PaymentModal>
                </div>
            </div>

            <p className="text-center text-xs text-text-tertiary">Plan changes are reviewed and activated by an admin.</p>

            <CancelPlanModal open={cancelOpen} onClose={() => setCancelOpen(false)} planName={currentName} onCancelled={fetchData} />
        </div>
    );
}
