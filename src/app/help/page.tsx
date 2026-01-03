"use client";

import Link from "next/link";
import { ArrowLeft, Search, User, Shield, CreditCard, LifeBuoy, FileText } from "lucide-react";
import { ParticleBackground } from "@/components/landing/ParticleBackground";

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
            {/* Ambient Background */}
            {/* Ambient Background */}
            <ParticleBackground />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-900/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-900/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 p-8 lg:p-12 max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                <div className="text-center max-w-2xl mx-auto mb-16 space-y-6">
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tight">
                        How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">help</span> you?
                    </h1>
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900/60 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Account & Profile</h3>
                        <p className="text-sm text-zinc-400">Managing your account settings, profile visibility, and notifications.</p>
                    </div>

                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900/60 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Privacy & Security</h3>
                        <p className="text-sm text-zinc-400">Understanding data protection, password resets, and 2FA.</p>
                    </div>

                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900/60 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Billing & subscriptions</h3>
                        <p className="text-sm text-zinc-400">Managing your premium plan, invoices, and payment methods.</p>
                    </div>

                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900/60 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Legal & policies</h3>
                        <p className="text-sm text-zinc-400">Terms of service, privacy policy, and community guidelines.</p>
                    </div>
                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-900/60 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LifeBuoy className="w-5 h-5 text-pink-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Contact Support</h3>
                        <p className="text-sm text-zinc-400">Get in touch with our customer success team for direct assistance.</p>
                    </div>
                </div>

                <div className="mt-16 text-center border-t border-white/5 pt-12">
                    <p className="text-zinc-500">Still need help?</p>
                    <a href="mailto:support@skilledcore.com" className="text-violet-400 hover:text-violet-300 font-medium hover:underline">Contact Skilled Core Support</a>
                </div>
            </div>
        </div>
    );
}
