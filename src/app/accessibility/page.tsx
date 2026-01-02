"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 lg:p-12">
            <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-4xl font-heading font-bold text-white mb-4">Accessibility</h1>
                <div className="p-8 rounded-xl bg-zinc-900/50 border border-white/5 space-y-4">
                    <p className="text-zinc-300">
                        Skilled Core is committed to providing a website that is accessible to the widest possible audience, regardless of circumstance and ability. We aim to adhere as closely as possible to the Web Content Accessibility Guidelines (WCAG 2.1, Level AA), published by the World Wide Web Consortium (W3C).
                    </p>
                    <p className="text-zinc-300">
                        These guidelines explain how to make Web content more accessible for people with disabilities. Conformance with these guidelines will help make the web more user friendly to everyone.
                    </p>
                </div>
            </div>
        </div>
    );
}
