"use client";

import React from "react";

export default function CopyrightPolicyPage() {
    return (
        <div className="text-zinc-300 space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-4 border-b border-white/10 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">Copyright Policy</h1>
                <p className="text-zinc-400">Procedure for making claims of copyright infringement.</p>
            </div>

            <div className="space-y-8">
                <p className="text-lg leading-relaxed">
                    Skilled Core respects the intellectual property rights of others and expects its users to do the same. It is Skilled Core's policy, in appropriate circumstances and at its discretion, to disable and/or terminate the accounts of users who repeatedly infringe or are repeatedly charged with infringing the copyrights or other intellectual property rights of others.
                </p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">DMCA Notice</h2>
                    <p>
                        If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to Skilled Core's Designated Copyright Agent.
                    </p>

                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                        <p className="font-semibold text-white">Upon receipt of the Notice as described below, Skilled Core will take whatever action, in its sole discretion, it deems appropriate, including removal of the challenged material from the Site.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Contact Copyright Agent</h2>
                    <p>
                        Notices of alleged infringement should be directed to the following:
                    </p>
                    <div className="pl-4 border-l-2 border-violet-500 text-zinc-400 font-mono text-sm leading-relaxed">
                        <p>Skilled Core Corporation</p>
                        <p>Attn: Copyright Agent</p>
                        <p>Legal Department</p>
                        <p>Email: <a href="mailto:support@skilledcore.com" className="text-violet-400 hover:underline">support@skilledcore.com</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
