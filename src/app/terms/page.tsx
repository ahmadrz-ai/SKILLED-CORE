"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ParticleBackground } from "@/components/landing/ParticleBackground";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 lg:p-12 selection:bg-violet-500/30">
            {/* Background Ambient */}
            {/* Background Ambient */}
            <ParticleBackground />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/10 to-transparent" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                <div className="space-y-2 mb-12">
                    <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Legal</p>
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tight">Terms of Service</h1>
                    <p className="text-zinc-400">Last Updated: January 2025</p>
                </div>

                <div className="space-y-12 text-zinc-300 leading-relaxed">
                    {/* 1. Acceptance */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-violet-500 pl-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the services provided by Skilled Core™ ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
                        </p>
                    </section>

                    {/* 2. IP Rights */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-violet-500 pl-4">2. Intellectual Property Rights</h2>
                        <p>
                            The Services, including but not limited to all code, software, designs, text, graphics, logos, and the "Skilled Core" branding (including "Skilled Core™"), are the exclusive property of the owner of Skilled Core and are protected by copyright, trademark, and other intellectual property laws.
                        </p>
                        <p>
                            You constitute that you will not copy, modify, distribute, sell, or lease any part of our Services or included software, nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit those restrictions or you have our written permission.
                        </p>
                    </section>

                    {/* 3. User Accounts */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-violet-500 pl-4">3. User Accounts</h2>
                        <p>
                            To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>
                        <p className="bg-red-950/20 p-4 rounded-lg border border-red-500/10 text-red-200">
                            We reserve the right to suspend, ban, or terminate your user account at any time and for any reason, including but not limited to a violation of these Terms, without notice or liability.
                        </p>
                    </section>

                    {/* 4. Limitation of Liability */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-violet-500 pl-4">4. Limitation of Liability</h2>
                        <p>
                            In no event shall Skilled Core, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                        </p>
                    </section>

                    <div className="h-px bg-white/10 my-8" />

                    {/* Contact */}
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Contact Us</h3>
                        <p>
                            If you have any questions about these Terms, please contact us at:
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
