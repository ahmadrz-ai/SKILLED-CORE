"use client";

import { useEffect, useState } from "react";
import { getPlan } from "@/app/actions/credits";
import Link from "next/link";
import { Lock, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

export default function SalaryPage() {
    const [plan, setPlan] = useState<string | null>(null);

    useEffect(() => {
        getPlan().then(setPlan);
    }, []);

    if (plan === null) return null; // Loading

    if (plan !== "ULTRA") {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                        <Lock className="w-10 h-10 text-zinc-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-white mb-2">Restricted Access</h1>
                        <p className="text-zinc-400">
                            Salary Insights are exclusive to <span className="text-amber-500 font-bold">ULTRA</span> operatives. Upgrade to view global compensation data and market trends.
                        </p>
                    </div>
                    <Link href="/credits" className="block">
                        <button className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl transition-all">
                            UPGRADE TO ULTRA
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <DollarSign className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-4xl font-heading font-bold text-white">Global Compensation Intelligence</h1>
                    <p className="text-zinc-400">Real-time salary data sourced from 500+ enterprise nodes.</p>
                </div>
            </div>

            {/* MOCK DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Avg. Frontend</h3>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-4xl font-bold text-white">$145,000</div>
                    <p className="text-emerald-500 text-sm font-mono">+12% vs last quarter</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Avg. Backend</h3>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-4xl font-bold text-white">$162,000</div>
                    <p className="text-emerald-500 text-sm font-mono">+8% vs last quarter</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-zinc-400 font-mono text-xs uppercase tracking-widest">AI / ML</h3>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-4xl font-bold text-white">$210,000</div>
                    <p className="text-emerald-500 text-sm font-mono">+24% vs last quarter</p>
                </div>
            </div>

            <div className="h-96 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed Market Graph Construction in Progress...</p>
                </div>
            </div>
        </div>
    );
}
