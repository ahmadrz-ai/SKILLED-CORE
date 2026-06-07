"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, CreditCard, Star, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCredits, getPlan } from "@/app/actions/credits";
import { Loader2 } from "lucide-react";
import { PaymentModal } from "@/components/credits/PaymentModal";
import { CancelPlanModal } from "@/components/credits/CancelPlanModal";

const PlanCard = ({ plan, currentPlan, onSuccess }: any) => {
    const isPro = plan.name === "PRO";
    const isUltra = plan.name === "ULTRA";
    const isCurrent = currentPlan === plan.name;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 group overflow-hidden bg-bg-card",
                isUltra ? "border-border-brand shadow-sc-md z-10 scale-[1.02]" :
                    isPro ? "border-border-default shadow-sc-card" :
                        "border-border-default shadow-sc-xs",
                isCurrent && "border-border-success shadow-sc-card"
            )}
        >
            {/* Top accent line */}
            {isUltra && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sc-purple-500 via-sc-purple-600 to-sc-purple-700 shadow-sc-xs" />
            )}
            {isPro && !isUltra && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sc-purple-500 to-sc-purple-650" />
            )}

            <div className="mb-6 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={cn("text-xs font-black tracking-[0.2em] uppercase font-sans",
                        isUltra ? "text-text-brand" : isPro ? "text-text-brand" : "text-text-secondary"
                    )}>
                        {plan.name} TIER
                    </h3>
                    
                    {/* Status & Credits badge */}
                    <div className="flex items-center gap-1.5">
                        {isCurrent && (
                            <div className="bg-bg-badge-success text-text-success text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border border-border-success/50 flex items-center gap-1 shadow-sc-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3px]" />
                                ACTIVE
                            </div>
                        )}
                        {plan.credits && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-bg-secondary-panel text-text-secondary border border-border-default flex items-center gap-1">
                                <Coins className="w-2.5 h-2.5 text-text-brand" />
                                {plan.credits}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-4xl font-heading font-black text-text-heading">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-xs text-text-secondary font-sans font-medium">/ month</span>}
                </div>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1 relative z-10 border-t border-border-subtle pt-5">
                {plan.features.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-text-body font-sans font-medium leading-relaxed">
                        <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isUltra ? "text-text-brand" : isPro ? "text-text-brand" : "text-text-secondary")} />
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            {isCurrent ? (
                <button
                    disabled
                    className="w-full py-3 rounded-xl font-heading font-black text-xs tracking-wider flex items-center justify-center gap-1.5 relative z-10 bg-bg-badge-success text-text-success cursor-default border border-border-success/50 shadow-sc-xs"
                >
                    CURRENT PLAN
                </button>
            ) : (
                <PaymentModal mode="PLAN" planName={plan.name} fixedPrice={plan.name === 'PRO' ? 5 : 10} onSuccess={onSuccess}>
                    <button
                        className={cn(
                            "w-full py-3 rounded-xl font-heading font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 relative z-10 text-text-inverse shadow-sm hover:scale-[1.01] active:scale-[0.99] border-none",
                            isUltra
                                ? "bg-sc-purple-600 hover:bg-sc-purple-700 shadow-sc-md"
                                : isPro
                                    ? "bg-sc-purple-600 hover:bg-sc-purple-700 shadow-sc-md"
                                    : "bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body border border-border-default"
                        )}
                    >
                        UPGRADE
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>
                </PaymentModal>
            )}

            {/* Glowing bottom backgrounds for premium cards */}
            {isUltra && <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-sc-purple-100/30 blur-[70px] rounded-full pointer-events-none" />}
            {isPro && <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-sc-purple-100/20 blur-[70px] rounded-full pointer-events-none" />}
        </motion.div>
    );
};

export default function CreditsPage() {
    const [credits, setCredits] = useState<number | null>(null);
    const [plan, setPlan] = useState<string>("BASIC");
    const [loading, setLoading] = useState(true);
    const [cancelOpen, setCancelOpen] = useState(false);

    const fetchData = async () => {
        const [bal, p] = await Promise.all([getCredits(), getPlan()]);
        setCredits(bal);
        setPlan(p);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const PLANS = [
        {
            name: "BASIC",
            price: "Free",
            credits: 10,
            features: [
                "10 Monthly Simulation Credits",
                "Basic Platform Job Search",
                "Standard Candidate Application Status"
            ]
        },
        {
            name: "PRO",
            price: "$5",
            credits: 50,
            features: [
                "Official Verified Blue Badge",
                "50 Monthly Simulation Credits",
                "Reach More People (Promoted Ad Feed)",
                "Track Who Viewed Your Profile",
                "Featured Applicant Highlights",
                "Direct Messaging (InMail)"
            ]
        },
        {
            name: "ULTRA",
            price: "$10",
            credits: 100,
            features: [
                "Official Verified Blue Badge",
                "100 Monthly Simulation Credits",
                "Everything Included in PRO plan",
                "24/7 Priority VIP Support Line",
                "Advanced Platform Salary Insights",
                "Premium Recruiter Learning Courses",
                "Unlimited Database Profile Searches"
            ]
        }
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center pt-24 bg-bg-secondary-panel text-text-brand">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen p-6 lg:p-10 pt-24 max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 bg-bg-secondary-panel font-sans">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-border-strong pb-8">
                <div>
                    <h1 className="text-3xl font-heading font-black text-text-heading mb-1.5 tracking-tight uppercase">
                        CREDIT <span className="text-text-brand">RESERVES</span>
                    </h1>
                    <p className="text-text-secondary font-sans text-xs font-semibold uppercase tracking-wider">
                        Manage your recruitment currency, logs, and subscription plan tier.
                    </p>
                </div>
                <div className="text-left md:text-right bg-bg-card border border-border-card px-6 py-3 rounded-2xl shadow-sc-card flex items-center md:flex-col md:items-end justify-between md:justify-center gap-4 md:gap-1.5 min-w-[200px]">
                    <p className="text-[10px] text-text-tertiary font-mono font-bold uppercase tracking-wider leading-none">Current Balance</p>
                    <div className="text-3xl font-heading font-black text-text-heading flex items-center gap-2 leading-none">
                        {credits} <Coins className="w-7 h-7 text-text-brand" />
                    </div>
                </div>
            </div>

            {/* Subscription management (premium, minimal) — only when on a paid plan */}
            {plan !== 'BASIC' && (
                <div className="bg-bg-card border border-border-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sc-card">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Your subscription</p>
                        <p className="text-base font-bold text-text-heading mt-1">
                            {plan} plan · <span className="text-text-success">Active</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">Renews monthly · cancel anytime.</p>
                    </div>
                    <button
                        onClick={() => setCancelOpen(true)}
                        className="text-sm font-semibold text-text-secondary hover:text-sc-red-600 transition-colors"
                    >
                        Cancel subscription
                    </button>
                </div>
            )}

            {/* Plans display grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {PLANS.map((p, i) => (
                    <PlanCard
                        key={i}
                        plan={p}
                        currentPlan={plan}
                        onSuccess={fetchData}
                    />
                ))}
            </div>

            {/* Quick Top-up light theme premium card */}
            <div className="bg-bg-card border border-border-card rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-sc-card transition-all duration-300 hover:shadow-sc-md">
                {/* Premium top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sc-purple-500 via-sc-purple-650 to-sc-purple-700" />
                
                <div className="absolute -right-24 -bottom-24 w-52 h-52 bg-sc-purple-100/10 blur-[70px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-sc-purple-50 flex items-center justify-center border border-sc-purple-200 shadow-sc-xs flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                        <CreditCard className="w-6 h-6 text-text-brand" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-text-heading font-heading tracking-wide uppercase">Quick Balance Top-up</h3>
                        <p className="text-text-secondary text-xs mt-1 font-medium font-sans">Running low? Add standard simulation packs instantly.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto justify-between md:justify-end border-t border-border-subtle md:border-none pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                        <span className="block text-xl font-black text-text-heading font-heading leading-tight">+5 Credits</span>
                        <div className="mt-1 flex items-center gap-1.5 justify-start md:justify-end">
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-bg-badge-success text-text-success border border-border-success/50">
                                $1.00 USD
                            </span>
                        </div>
                    </div>
                    <PaymentModal onSuccess={fetchData}>
                        <button className="px-6 py-3 bg-sc-purple-600 hover:bg-sc-purple-700 text-text-inverse font-heading font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-sc-md hover:shadow-sc-lg hover:scale-[1.01] active:scale-[0.99] border-none">
                            BUY NOW
                        </button>
                    </PaymentModal>
                </div>
            </div>

            <CancelPlanModal
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
                planName={plan}
                onCancelled={fetchData}
            />
        </div>
    );
}
