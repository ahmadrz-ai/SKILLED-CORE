"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, CreditCard, Shield, Star, Coins, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCredits, getPlan } from "@/app/actions/credits";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PaymentModal } from "@/components/credits/PaymentModal";

const PlanCard = ({ plan, currentPlan, onSuccess }: any) => {
    const isPro = plan.name === "PRO";
    const isUltra = plan.name === "ULTRA";
    const isCurrent = currentPlan === plan.name;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 group overflow-hidden bg-white",
                isUltra ? "border-[#C7D2FE] shadow-[0_15px_40px_rgba(99,102,241,0.08)] z-10 scale-[1.02]" :
                    isPro ? "border-[#E5E7EB] shadow-[0_8px_30px_rgba(0,0,0,0.03)]" :
                        "border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.01)]",
                isCurrent && "border-[#10B981]/50 shadow-[0_8px_30px_rgba(16,185,129,0.04)]"
            )}
        >
            {/* Top accent line */}
            {isUltra && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6366F1] via-[#D946EF] to-[#6366F1] shadow-[0_2px_15px_rgba(99,102,241,0.3)] animate-pulse" />
            )}
            {isPro && !isUltra && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6366F1] to-[#818CF8]" />
            )}

            <div className="mb-6 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={cn("text-xs font-black tracking-[0.2em] uppercase font-sans",
                        isUltra ? "text-[#D946EF]" : isPro ? "text-[#6366F1]" : "text-gray-400"
                    )}>
                        {plan.name} TIER
                    </h3>
                    
                    {/* Status & Credits badge */}
                    <div className="flex items-center gap-1.5">
                        {isCurrent && (
                            <div className="bg-[#10B981]/10 text-[#10B981] text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border border-[#10B981]/25 flex items-center gap-1 shadow-sm shadow-[#10B981]/5">
                                <Check className="w-2.5 h-2.5 stroke-[3px]" />
                                ACTIVE
                            </div>
                        )}
                        {plan.credits && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200/50 flex items-center gap-1">
                                <Coins className="w-2.5 h-2.5 text-[#6366F1]" />
                                {plan.credits}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-4xl font-heading font-black text-gray-950">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-xs text-gray-400 font-sans font-medium">/ month</span>}
                </div>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1 relative z-10 border-t border-gray-100 pt-5">
                {plan.features.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-[#4B5563] font-sans font-medium leading-relaxed">
                        <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isUltra ? "text-[#D946EF]" : isPro ? "text-[#6366F1]" : "text-gray-400")} />
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            {isCurrent ? (
                <button
                    disabled
                    className="w-full py-3 rounded-xl font-heading font-black text-xs tracking-wider flex items-center justify-center gap-1.5 relative z-10 bg-[#10B981]/15 text-[#10B981] cursor-default border border-[#10B981]/25 shadow-sm"
                >
                    CURRENT PLAN
                </button>
            ) : (
                <PaymentModal mode="PLAN" planName={plan.name} fixedPrice={plan.name === 'PRO' ? 5 : 10} onSuccess={onSuccess}>
                    <button
                        className={cn(
                            "w-full py-3 rounded-xl font-heading font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 relative z-10 text-white shadow-sm hover:scale-[1.01] active:scale-[0.99]",
                            isUltra
                                ? "bg-gradient-to-r from-[#6366F1] to-[#D946EF] hover:from-[#4F46E5] hover:to-[#C084FC] shadow-lg shadow-[#6366F1]/10"
                                : isPro
                                    ? "bg-[#6366F1] hover:bg-[#4F46E5] shadow-lg shadow-[#6366F1]/10"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200/50"
                        )}
                    >
                        UPGRADE
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>
                </PaymentModal>
            )}

            {/* Glowing bottom backgrounds for premium cards */}
            {isUltra && <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#D946EF]/5 blur-[70px] rounded-full pointer-events-none" />}
            {isPro && <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#6366F1]/5 blur-[70px] rounded-full pointer-events-none" />}
        </motion.div>
    );
};

export default function CreditsPage() {
    const [credits, setCredits] = useState<number | null>(null);
    const [plan, setPlan] = useState<string>("BASIC");
    const [loading, setLoading] = useState(true);

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
        <div className="min-h-screen flex items-center justify-center pt-24 bg-[#F3F4F6]">
            <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen p-6 lg:p-10 pt-24 max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 bg-[#F3F4F6] font-sans">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-heading font-black text-gray-900 mb-1.5 tracking-tight uppercase">
                        CREDIT <span className="text-[#6366F1]">RESERVES</span>
                    </h1>
                    <p className="text-gray-500 font-sans text-xs font-semibold uppercase tracking-wider">
                        Manage your recruitment currency, logs, and subscription plan tier.
                    </p>
                </div>
                <div className="text-left md:text-right bg-white border border-gray-200/80 px-6 py-3 rounded-2xl shadow-sm flex items-center md:flex-col md:items-end justify-between md:justify-center gap-4 md:gap-1.5 min-w-[200px]">
                    <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider leading-none">Current Balance</p>
                    <div className="text-3xl font-heading font-black text-gray-950 flex items-center gap-2 leading-none">
                        {credits} <Coins className="w-7 h-7 text-[#6366F1]" />
                    </div>
                </div>
            </div>

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

            {/* Quick Top-up dark theme accent panel */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#6366F1]/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center border border-gray-700/80 shadow-xl flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white font-heading tracking-wide uppercase">Quick Balance Top-up</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Running low? Add standard simulation packs instantly.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto justify-between md:justify-end border-t border-gray-800/80 md:border-none pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                        <span className="block text-lg font-black text-white font-heading leading-tight">+5 Credits</span>
                        <span className="text-[#10B981] font-mono text-xs font-bold">$1.00 USD</span>
                    </div>
                    <PaymentModal onSuccess={fetchData}>
                        <button className="px-6 py-3 bg-white text-[#111827] hover:bg-gray-100 font-heading font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99]">
                            BUY NOW
                        </button>
                    </PaymentModal>
                </div>
            </div>

        </div>
    );
}
