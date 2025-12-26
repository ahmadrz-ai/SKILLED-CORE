"use client";

import { BrainCircuit, Fingerprint, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link"; // Added Link import

export function BentoGrid() {
    return (
        <section className="py-24 px-4 max-w-7xl mx-auto">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-heading font-black text-white tracking-wide mb-4">SYSTEM CAPABILITIES</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                    Advanced protocols designed to accelerate career trajectory and talent acquisition.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">

                {/* DOJO CARD (Large) */}
                <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-8 h-full flex flex-col relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-violet-500/10"><BrainCircuit className="w-6 h-6 text-violet-400" /></div>
                            <h3 className="text-xl font-bold text-white">AI Interview</h3>
                        </div>
                        <p className="text-zinc-400 mb-8 max-w-md">
                            Practice behavioral and technical interviews with our AI Sensei. Get real-time feedback on confidence, clarity, and keyword optimization.
                        </p>

                        {/* Visual Mockup */}
                        <div className="flex-1 rounded-t-xl bg-zinc-950 border-t border-l border-r border-white/10 p-4 shadow-2xl relative translate-y-4 group-hover:translate-y-2 transition-transform">
                            <div className="flex gap-4 mb-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">AI</div>
                                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-300 max-w-[80%]">
                                    Tell me about a time you had to optimize a React component for performance.
                                </div>
                            </div>
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">ME</div>
                                <div className="bg-violet-600/20 border border-violet-500/20 p-3 rounded-2xl rounded-tr-none text-sm text-white max-w-[80%]">
                                    I used React.memo and useCallback to prevent unnecessary re-renders...
                                </div>
                            </div>
                        </div>

                        <Button asChild variant="link" className="absolute top-6 right-6 text-violet-400 group-hover:text-white transition-colors">
                            <Link href="/interview">Try Simulator &rarr;</Link>
                        </Button>
                    </div>
                </div>

                {/* GHOST PROTOCOL (Small) */}
                <div className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm hover:border-zinc-500/30 transition-all">
                    <div className="p-8 h-full flex flex-col justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-zinc-800"><Fingerprint className="w-5 h-5 text-white" /></div>
                                <h3 className="font-bold text-white">Ghost Protocol</h3>
                            </div>
                            <p className="text-xs text-zinc-500">Go invisible to current employers.</p>
                        </div>

                        <div className="mt-6 flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                            <span className="text-sm text-zinc-400">Visibility</span>
                            <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEURAL SEARCH (Tall/Remaining) */}
                <div className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
                    <div className="p-8 h-full flex flex-col relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-cyan-500/10"><Search className="w-5 h-5 text-cyan-400" /></div>
                            <h3 className="font-bold text-white">Neural Search</h3>
                        </div>
                        <p className="text-xs text-zinc-500 mb-6">Find talent by context, not just keywords.</p>

                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                            <div className="relative bg-zinc-950 border border-white/10 rounded-lg p-3 text-xs text-zinc-400 font-mono">
                                <span className="text-cyan-400">query</span>: "Senior Dev with Fintech exp"
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
