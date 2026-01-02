"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 lg:p-12">
            <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-4xl font-heading font-bold text-white mb-4">Help Center</h1>
                <div className="p-8 rounded-xl bg-zinc-900/50 border border-white/5 space-y-4">
                    <p className="text-zinc-300 transform">
                        How can we assist you? Search our knowledge base or contact support.
                    </p>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for articles..."
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {['Account Settings', 'Privacy & Security', 'Billing & Subscriptions', 'Job Search'].map((topic) => (
                            <div key={topic} className="p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer border border-white/5">
                                <h3 className="font-semibold text-zinc-100">{topic}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
