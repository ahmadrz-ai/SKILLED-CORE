"use client";

import { motion } from "framer-motion";

const ITEMS = [
    "🔥 Alex J. hired at Google",
    "💰 $140k Salary Negotiated",
    "🚀 Trivia.Global is hiring",
    "💎 143 New Bounties Posted",
    "🤖 5,200 Interviews Conducted",
    "🌍 12 Countries Active"
];

export function MetricMarquee() {
    return (
        <section className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden relative">
            <div className="flex w-max">
                <motion.div
                    className="flex gap-16 px-8"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30
                    }}
                >
                    {[...ITEMS, ...ITEMS, ...ITEMS].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                            <span className="text-sm font-mono text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                                {item}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-obsidian to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-obsidian to-transparent z-10" />
        </section>
    );
}
