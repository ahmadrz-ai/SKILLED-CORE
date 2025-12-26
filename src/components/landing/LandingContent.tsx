"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { MetricMarquee } from "@/components/landing/MetricMarquee";
import { ArrowRight, ChevronDown, Hexagon } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingContent() {
    return (
        <div className="min-h-screen bg-obsidian text-foreground selection:bg-violet-500/30">
            {/* Global Effects */}
            <div className="fixed inset-0 z-[-1]">
            </div>

            {/* HERO SECTION */}
            <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">

                {/* Brand Emblem */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
                >
                    <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                        <Hexagon className="w-7 h-7 text-white fill-white/20" />
                    </div>
                </motion.div>

                {/* Headlines */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-heading font-black text-white tracking-tight mb-6 max-w-4xl leading-tight"
                >
                    The Future of Work is <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">Not a List.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 font-light"
                >
                    The operating system for your career. AI-powered matching, immersive profiles, and a hiring process that actually works.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center items-center"
                >
                    <Button asChild size="lg" className="h-14 bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all">
                        <Link href="/register?role=recruiter">
                            HIRE TALENT
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-14 border-white/10 bg-black/20 hover:bg-white/10 text-white hover:text-white hover:border-white/30 backdrop-blur-sm">
                        <Link href="/register?role=candidate">
                            FIND WORK
                        </Link>
                    </Button>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 animate-bounce"
                >
                    <ChevronDown className="w-6 h-6 text-zinc-600" />
                </motion.div>
            </section>

            {/* MARQUEE */}
            <MetricMarquee />

            {/* BENTO GRID */}
            <BentoGrid />

            {/* FINAL CTA */}
            <section className="py-32 px-4 text-center">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-heading font-black text-white">
                        Ready to Upgrade?
                    </h2>
                    <p className="text-zinc-500 text-lg">
                        Join 10,000+ engineers, designers, and founders building the future.
                    </p>
                    <Button asChild size="lg" className="h-16 px-12 text-lg rounded-full bg-white text-black hover:bg-zinc-200 font-bold tracking-wider">
                        <Link href="/register">
                            GET STARTED
                        </Link>
                    </Button>
                    <p className="text-xs text-zinc-600 mt-8">
                        System Status: <span className="text-emerald-500">OPERATIONAL</span>
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 text-center text-xs text-zinc-600">
                <p>&copy; 2042 SkilledCore Industries. All rights reserved.</p>
            </footer>
        </div>
    );
}
