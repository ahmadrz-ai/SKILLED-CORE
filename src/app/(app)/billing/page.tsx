"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Check, Zap, Shield, Crown, CreditCard, Download,
    ArrowRight, AlertCircle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const USAGE_STATS = [
    { label: "Active Job Bounties", used: 2, limit: 5, color: "bg-violet-500", icon: Zap },
    { label: "Direct Messages (InMail)", used: 15, limit: 50, color: "bg-teal-500", icon: FileText },
    { label: "Talent Search Views", used: 120, limit: 500, color: "bg-blue-500", icon: Eye },
];

import { Eye } from "lucide-react";

const INVOICES = [
    { id: "INV-2024-001", date: "Oct 01, 2025", desc: "Commander Tier (Monthly)", amount: "$49.00", status: "Paid" },
    { id: "INV-2024-002", date: "Sep 01, 2025", desc: "Commander Tier (Monthly)", amount: "$49.00", status: "Paid" },
    { id: "INV-2024-003", date: "Aug 01, 2025", desc: "Scout Tier (Overage)", amount: "$12.50", status: "Paid" },
];

// --- Components ---

const UsageBar = ({ label, used, limit, color, icon: Icon }: any) => {
    const percent = Math.min((used / limit) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono uppercase tracking-wider">
                    <Icon className="w-4 h-4" />
                    {label}
                </div>
                <div className="text-xs font-bold text-white">
                    <span className={percent > 90 ? "text-red-400" : "text-zinc-300"}>{used}</span>
                    <span className="text-zinc-600"> / {limit}</span>
                </div>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className={cn("h-full rounded-full shadow-[0_0_10px_currentColor]", color)}
                />
            </div>
        </div>
    );
};

const PricingCard = ({ tier, billingCycle }: { tier: any, billingCycle: "monthly" | "yearly" }) => {
    const isPro = tier.title === "COMMANDER";
    const price = billingCycle === "yearly" && tier.price_yearly ? tier.price_yearly : tier.price;
    const period = tier.price === "Free" || tier.price === "Custom" ? "" : (billingCycle === "yearly" ? "/ yr" : "/ mo");

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 group",
                isPro ? "bg-zinc-900/80 border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] z-10 scale-105" : "bg-zinc-900/40 border-white/10 hover:border-white/20"
            )}
        >
            {isPro && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase shadow-lg shadow-violet-500/50">
                    Most Popular
                </div>
            )}

            <div className="mb-6">
                <h3 className={cn("text-lg font-bold font-heading mb-2 tracking-widest", isPro ? "text-violet-400" : "text-white")}>
                    {tier.title}
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{price}</span>
                    <span className="text-sm text-zinc-500 font-mono">{period}</span>
                </div>
                {billingCycle === "yearly" && tier.price !== "Free" && tier.price !== "Custom" && (
                    <span className="text-[10px] text-green-400 font-mono mt-1 block">SAVE 20% WITH YEARLY</span>
                )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isPro ? "text-violet-400" : "text-zinc-600")} />
                        {feat}
                    </li>
                ))}
            </ul>

            <button className={cn(
                "w-full py-3 rounded-lg font-heading font-bold text-sm tracking-wider transition-all flex items-center justify-center gap-2",
                isPro
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
            )}>
                {tier.button}
                {isPro && <ArrowRight className="w-4 h-4" />}
            </button>
        </motion.div>
    );
};

export default function BillingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    const tiers = [
        {
            title: "SCOUT",
            price: "Free",
            features: ["1 Active Job Post", "Basic Search Filtering", "Standard Support", "Community Access"],
            button: "Current Plan"
        },
        {
            title: "COMMANDER",
            price: "$49",
            price_yearly: "$470",
            features: ["5 Active Job Posts", "Unlimited Talent Search", "Verified Company Badge", "Analytics Dashboard", "Priority Support"],
            button: "Upgrade Clearance"
        },
        {
            title: "ENTERPRISE",
            price: "Custom",
            features: ["Unlimited Posts", "API Access", "Dedicated Success Manager", "SSO Security", "Custom Contracts"],
            button: "Contact Sales"
        }
    ];

    return (
        <div className="min-h-screen p-6 lg:p-10 pt-24 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-500">

            {/* Header */}
            <div>
                <h1 className="text-4xl font-heading font-bold text-white mb-2 tracking-tight">
                    CAPITAL <span className="text-teal-500">MANAGEMENT</span>
                </h1>
                <p className="text-zinc-400 font-mono text-sm max-w-lg">
                    Upgrade your clearance level to access elite recruitment tools and neural network features.
                </p>
            </div>

            {/* Usage Monitor */}
            <section className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
                <h2 className="text-lg font-heading font-bold text-white mb-8 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-400" />
                    RESOURCE CONSUMPTION
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {USAGE_STATS.map((stat, i) => (
                        <UsageBar key={i} {...stat} />
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section className="space-y-8">
                <div className="flex flex-col items-center justify-center gap-4">
                    <h2 className="text-2xl font-heading font-bold text-white">SELECT CLEARANCE TIER</h2>
                    {/* Toggle */}
                    <div className="bg-zinc-900 p-1 rounded-lg border border-white/10 flex items-center relative">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={cn(
                                "px-6 py-2 rounded-md text-xs font-bold font-mono transition-all z-10",
                                billingCycle === "monthly" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            MONTHLY
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={cn(
                                "px-6 py-2 rounded-md text-xs font-bold font-mono transition-all z-10",
                                billingCycle === "yearly" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            YEARLY
                        </button>
                        <div className={cn(
                            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded shadow-sm transition-all duration-300",
                            billingCycle === "monthly" ? "left-1" : "left-[calc(50%+4px)]"
                        )} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    {tiers.map((tier, i) => (
                        <PricingCard key={i} tier={tier} billingCycle={billingCycle} />
                    ))}
                </div>
            </section>

            {/* Transaction Log */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-zinc-400" />
                        TRANSACTION LEDGER
                    </h2>
                    <button className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                        EXPORT CSV <Download className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-zinc-400 font-mono text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                            {INVOICES.map((inv) => (
                                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-zinc-500">{inv.date}</td>
                                    <td className="p-4 font-medium text-white">{inv.desc}</td>
                                    <td className="p-4 font-mono">{inv.amount}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold">
                                            <Check className="w-3 h-3" /> {inv.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-zinc-500 hover:text-violet-400 transition-colors">
                                            <Download className="w-4 h-4 inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
}
