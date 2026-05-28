"use client";

import { useEffect, useState } from "react";
import { getPlan } from "@/app/actions/credits";
import Link from "next/link";
import { Lock, BookOpen, GraduationCap, PlayCircle } from "lucide-react";

export default function LearningPage() {
    const [plan, setPlan] = useState<string | null>(null);

    useEffect(() => {
        getPlan().then(setPlan);
    }, []);

    if (plan === null) return null;

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
                            The Learning Academy is exclusive to <span className="text-sc-purple-600 font-bold">ULTRA</span> operatives. Upgrade to access premium recruitment courses and certifications.
                        </p>
                    </div>
                    <Link href="/credits" className="block">
                        <button className="w-full py-4 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold rounded-xl transition-all shadow-sc-sm">
                            UPGRADE TO ULTRA
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const COURSES = [
        { title: "Advanced Technical Screening", author: "Dr. A. Vance", duration: "4h 30m" },
        { title: "Negotiation Tactics for Seniors", author: "M. Specter", duration: "2h 15m" },
        { title: "AI-Driven Sourcing Mastery", author: "System AI", duration: "6h 00m" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-bg-sidebar-active flex items-center justify-center border border-border-selected">
                    <GraduationCap className="w-6 h-6 text-sc-purple-600" />
                </div>
                <div>
                    <h1 className="text-4xl font-sans font-bold text-text-heading">Academy</h1>
                    <p className="text-text-secondary">Elite training modules for modern operatives.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COURSES.map((c, i) => (
                    <div key={i} className="group relative rounded-2xl border border-border-card bg-bg-card overflow-hidden hover:border-sc-purple-400 transition-all shadow-sc-card cursor-pointer">
                        <div className="aspect-video bg-bg-secondary-panel flex items-center justify-center relative border-b border-border-subtle">
                            <PlayCircle className="w-12 h-12 text-text-secondary group-hover:text-sc-purple-600 transition-colors" />
                        </div>
                        <div className="p-6 bg-bg-card">
                            <h3 className="font-bold text-text-heading mb-1 group-hover:text-sc-purple-700 transition-colors">{c.title}</h3>
                            <div className="flex justify-between text-xs text-text-secondary font-mono uppercase tracking-wider mt-4">
                                <span>{c.author}</span>
                                <span>{c.duration}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
