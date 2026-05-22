"use client";

import { motion } from "framer-motion";
import { Brain, ShieldCheck, Globe, Zap, LineChart, Lock } from "lucide-react";

const ITEMS = [
    { text: "AI-POWERED MATCHING", icon: Brain },
    { text: "VERIFIED ENGINEERING SKILLS", icon: ShieldCheck },
    { text: "GLOBAL TALENT NETWORK", icon: Globe },
    { text: "ACCELERATED HIRING CYCLES", icon: Zap },
    { text: "DEEP CANDIDATE ANALYTICS", icon: LineChart },
    { text: "ENTERPRISE-GRADE SECURITY", icon: Lock }
];

export function MetricMarquee() {
    return (
        <section className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden relative">
            <div className="flex w-max">
                <motion.div
                    className="flex gap-12 px-8"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40
                    }}
                >
                    {[...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-mono text-zinc-400 tracking-widest whitespace-nowrap">
                                {item.text}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
        </section>
    );
}
