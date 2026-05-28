"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CheckCircle2 } from "lucide-react";

export default function AccessibilityPage() {
    return (
        <AppShell>
            <div className="space-y-8 text-text-body">
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">Our Commitment</h2>
                    <p className="text-sm leading-relaxed">
                        We adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as our benchmark. We regularly test and monitor our platform to ensure it is usable by everyone, including people with visual, hearing, cognitive, and motor impairments.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">Accessibility Features</h2>
                    <div className="grid gap-4 mt-2">
                        <div className="flex gap-4 p-4 bg-bg-card border border-border-default rounded-xl shadow-sc-xs">
                            <CheckCircle2 className="w-5 h-5 text-sc-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-text-heading text-xs">Keyboard Navigation</h3>
                                <p className="text-xs text-text-secondary mt-1">Full keyboard support for all interactive elements.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-bg-card border border-border-default rounded-xl shadow-sc-xs">
                            <CheckCircle2 className="w-5 h-5 text-sc-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-text-heading text-xs">Screen Reader Support</h3>
                                <p className="text-xs text-text-secondary mt-1">Semantic HTML and ARIA labels for screen reader compatibility.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-bg-card border border-border-default rounded-xl shadow-sc-xs">
                            <CheckCircle2 className="w-5 h-5 text-sc-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-text-heading text-xs">Color Contrast</h3>
                                <p className="text-xs text-text-secondary mt-1">High contrast modes and compliant color combinations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">Feedback</h2>
                    <p className="text-sm leading-relaxed">
                        If you encounter any accessibility barriers on SkilledCore, please contact us. We welcome your feedback and will work to address any issues promptly.
                    </p>
                    <div className="inline-block px-3 py-1.5 bg-bg-secondary-panel border border-border-default rounded-lg text-text-brand font-mono text-xs font-bold shadow-sc-xs">
                        support@skilledcore.com
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
