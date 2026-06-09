"use client";

import { useEffect, useState } from "react";
import { getPlan } from "@/app/actions/credits";
import Link from "next/link";
import { Lock, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

export default function SalaryPage() {
    const [plan, setPlan] = useState<string | null>(null);

    useEffect(() => {
        // Bug 9: a failed getPlan() must not leave plan=null forever (permanent blank).
        // Fall back to the most-restrictive view so the page always renders something.
        getPlan().then(setPlan).catch(() => setPlan("BASIC"));
    }, []);

    if (plan === null) return null; // Loading

    if (plan !== "ULTRA") {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6 bg-bg-card border border-border-card rounded-2xl p-8 shadow-sc-md">
                    <div className="w-20 h-20 bg-bg-secondary-panel rounded-full flex items-center justify-center mx-auto border border-border-default">
                        <Lock className="w-10 h-10 text-text-secondary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-sans font-bold text-text-heading mb-2">Restricted Access</h1>
                        <p className="text-text-secondary">
                            Salary Insights are exclusive to <span className="text-sc-purple-600 font-bold">Elite</span> operatives. Upgrade to view global compensation data and market trends.
                        </p>
                    </div>
                    <Link href="/credits" className="block">
                        <button className="w-full py-4 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold rounded-xl transition-all shadow-sc-sm">
                            UPGRADE TO ELITE
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-bg-sidebar-active flex items-center justify-center border border-border-selected">
                    <DollarSign className="w-6 h-6 text-sc-purple-600" />
                </div>
                <div>
                    <h1 className="text-4xl font-sans font-bold text-text-heading">Salary Insights</h1>
                    <p className="text-text-secondary">Compensation benchmarks by role, level, and location.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-border-card bg-bg-card shadow-sc-card p-12 flex flex-col items-center text-center">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-sc-purple-50 text-sc-purple-400 mb-4">
                    <BarChart3 className="w-7 h-7" />
                </span>
                <h2 className="text-lg font-bold text-text-heading">Salary insights are coming soon</h2>
                <p className="text-sm text-text-secondary mt-1 max-w-md">
                    We&apos;re building real, sourced compensation data with interactive charts and filters by role, seniority, and region. Your Elite plan will include it at launch.
                </p>
            </div>
        </div>
    );
}
