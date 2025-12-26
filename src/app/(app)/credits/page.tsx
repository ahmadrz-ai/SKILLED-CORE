"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, CreditCard, Shield, Star, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCredits, getPlan } from "@/app/actions/credits";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PaymentModal } from "@/components/credits/PaymentModal";

// --- Components ---

const PlanCard = ({ plan, currentPlan, onSuccess }: any) => {
    const isPro = plan.name === "PRO";
    const isUltra = plan.name === "ULTRA";
    const isCurrent = currentPlan === plan.name;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 group overflow-hidden",
                isUltra ? "bg-zinc-900/80 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] z-10" :
                    isPro ? "bg-zinc-900/60 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]" :
                        "bg-zinc-900/40 border-white/10",
                isCurrent && !isUltra && !isPro && "border-green-500/20 bg-green-900/5", // Only apply green border to Basic if active
                isCurrent && (isUltra || isPro) && "bg-opacity-100" // Just ensure high visibility for active premium 
            )}
        >

            {isUltra && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_20px_#fbbf24]" />
            )}

            <div className="mb-6 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={cn("text-lg font-bold font-heading tracking-widest",
                        isUltra ? "text-amber-400" : isPro ? "text-violet-400" : "text-white"
                    )}>
                        {plan.name}
                    </h3>
                    {/* Right Side: Status & Credits */}
                    <div className="flex flex-col items-end gap-2">
                        {isCurrent && (
                            <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                ACTIVE
                            </div>
                        )}
                        {plan.credits && (
                            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-white/10 text-zinc-300 flex items-center gap-1">
                                <Coins className="w-3 h-3 text-yellow-400" />
                                {plan.credits}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-sm text-zinc-500 font-mono">/ month</span>}
                </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1 relative z-10">
                {plan.features.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isUltra ? "text-amber-400" : isPro ? "text-violet-400" : "text-zinc-600")} />
                        {feat}
                    </li>
                ))}
            </ul>

            {isCurrent ? (
                <button
                    disabled
                    className="w-full py-3 rounded-lg font-heading font-bold text-sm tracking-wider flex items-center justify-center gap-2 relative z-10 bg-green-500/20 text-green-400 cursor-default"
                >
                    CURRENT PLAN
                </button>
            ) : (
                <PaymentModal mode="PLAN" planName={plan.name} fixedPrice={plan.name === 'PRO' ? 5 : 10} onSuccess={onSuccess}>
                    <button
                        className={cn(
                            "w-full py-3 rounded-lg font-heading font-bold text-sm tracking-wider transition-all flex items-center justify-center gap-2 relative z-10",
                            isUltra
                                ? "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black shadow-lg shadow-amber-500/20"
                                : isPro
                                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        )}
                    >
                        UPGRADE
                        <Zap className="w-4 h-4 fill-current" />
                    </button>
                </PaymentModal>
            )}

            {/* Background Effects */}
            {isUltra && <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />}
            {isPro && <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />}
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
                "10 Monthly Credits",
                "Basic Job Search",
                "Standard Application Status"
            ]
        },
        {
            name: "PRO",
            price: "$5",
            credits: 50,
            features: [
                "50 Monthly Credits",
                "Reach More People (Ad Feed)",
                "Who Viewed Your Profile",
                "Featured Applicant Status",
                "Direct Messaging (InMail)"
            ]
        },
        {
            name: "ULTRA",
            price: "$10",
            credits: 100,
            features: [
                "100 Monthly Credits",
                "Everything in PRO",
                "Priority Support",
                "Salary Insights",
                "Learning Courses Access",
                "Unlimited Search"
            ]
        }
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center pt-24">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen p-6 lg:p-10 pt-24 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500">

            {/* Header / Balance */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-white mb-2 tracking-tight">
                        CREDIT <span className="text-amber-500">RESERVES</span>
                    </h1>
                    <p className="text-zinc-400 font-mono text-sm">
                        Manage your recruitment currency and subscription tier.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-1">Current Balance</p>
                    <div className="text-5xl font-bold font-heading text-white flex items-center gap-3">
                        {credits} <Coins className="w-8 h-8 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {PLANS.map((p, i) => (
                    <PlanCard
                        key={i}
                        plan={p}
                        currentPlan={plan}
                        onSuccess={fetchData}
                    />
                ))}
            </div>

            {/* Quick Top-up */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-white/5 mask-image-linear-gradient" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 shadow-xl">
                        <CreditCard className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Quick Top-up</h3>
                        <p className="text-zinc-400 text-sm">Running low? Grab a small pack instantly.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-white">5 Credits</span>
                        <span className="text-emerald-400 font-mono text-xs">$1.00 USD</span>
                    </div>
                    <PaymentModal onSuccess={fetchData}>
                        <button className="px-8 py-3 bg-white text-black font-bold font-heading rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                            BUY NOW
                        </button>
                    </PaymentModal>
                </div>
            </div>

        </div>
    );
}
