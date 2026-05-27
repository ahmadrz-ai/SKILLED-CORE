"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 lg:p-12 selection:bg-indigo-500/30">
            <div className="max-w-3xl mx-auto relative z-10">
                <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors group text-sm font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                <div className="space-y-4 mb-12 border-b border-slate-200 pb-8">
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">Accessibility</h1>
                    <p className="text-xl text-slate-500">SkilledCore is committed to digital inclusion.</p>
                </div>

                <div className="space-y-12 text-slate-600 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Our Commitment</h2>
                        <p>
                            We adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as our benchmark. We regularly test and monitor our platform to ensure it is usable by everyone, including people with visual, hearing, cognitive, and motor impairments.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Accessibility Features</h2>
                        <div className="grid gap-4">
                            <div className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-slate-900">Keyboard Navigation</h3>
                                    <p className="text-sm text-slate-500">Full keyboard support for all interactive elements.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-slate-900">Screen Reader Support</h3>
                                    <p className="text-sm text-slate-500">Semantic HTML and ARIA labels for screen reader compatibility.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-slate-900">Color Contrast</h3>
                                    <p className="text-sm text-slate-500">High contrast modes and compliant color combinations.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Feedback</h2>
                        <p>
                            If you encounter any accessibility barriers on SkilledCore, please contact us. We welcome your feedback and will work to address any issues promptly.
                        </p>
                        <div className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-lg text-indigo-600 font-mono text-sm shadow-sm">
                            support@skilledcore.com
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
