"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { ParticleBackground } from "@/components/landing/ParticleBackground";

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 lg:p-12 mb:p-24 selection:bg-violet-500/30">
            <ParticleBackground />
            <div className="relative z-10 max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                <div className="space-y-4 mb-12 border-b border-white/10 pb-8">
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tight">Accessibility</h1>
                    <p className="text-xl text-zinc-400">Skilled Core is committed to digital inclusion.</p>
                </div>

                <div className="space-y-12 text-zinc-300 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">Our Commitment</h2>
                        <p>
                            We adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as our benchmark. We regularly test and monitor our platform to ensure it is usable by everyone, including people with visual, hearing, cognitive, and motor impairments.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">Accessibility Features</h2>
                        <div className="grid gap-4">
                            <div className="flex gap-4 p-4 bg-zinc-900/50 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-white">Keyboard Navigation</h3>
                                    <p className="text-sm text-zinc-400">Full keyboard support for all interactive elements.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-zinc-900/50 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-white">Screen Reader Support</h3>
                                    <p className="text-sm text-zinc-400">Semantic HTML and ARIA labels for screen reader compatibility.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-zinc-900/50 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-white">Color Contrast</h3>
                                    <p className="text-sm text-zinc-400">High contrast modes and compliant color combinations.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">Feedback</h2>
                        <p>
                            If you encounter any accessibility barriers on Skilled Core, please contact us. We welcome your feedback and will work to address any issues promptly.
                        </p>
                        <div className="inline-block px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-violet-400 font-mono text-sm">
                            support@skilledcore.com
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
