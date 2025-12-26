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
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                        <Lock className="w-10 h-10 text-zinc-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-white mb-2">Restricted Access</h1>
                        <p className="text-zinc-400">
                            The Learning Academy is exclusive to <span className="text-amber-500 font-bold">ULTRA</span> operatives. Upgrade to access premium recruitment courses and certifications.
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

    const COURSES = [
        { title: "Advanced Technical Screening", author: "Dr. A. Vance", duration: "4h 30m" },
        { title: "Negotiation Tactics for Seniors", author: "M. Specter", duration: "2h 15m" },
        { title: "AI-Driven Sourcing Mastery", author: "System AI", duration: "6h 00m" },
    ];

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <GraduationCap className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-4xl font-heading font-bold text-white">Academy</h1>
                    <p className="text-zinc-400">Elite training modules for modern operatives.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COURSES.map((c, i) => (
                    <div key={i} className="group relative rounded-2xl border border-white/5 bg-zinc-900 overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer">
                        <div className="aspect-video bg-zinc-800 flex items-center justify-center relative">
                            <PlayCircle className="w-12 h-12 text-white/50 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{c.title}</h3>
                            <div className="flex justify-between text-xs text-zinc-500 font-mono uppercase tracking-wider mt-4">
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
