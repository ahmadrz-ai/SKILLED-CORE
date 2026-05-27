"use client";

import React from "react";

export default function CopyrightPolicyPage() {
    return (
        <div className="text-slate-600 space-y-8 max-w-4xl animate-in fade-in duration-500 font-medium">
            {/* Header */}
            <div className="space-y-4 border-b border-slate-200 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">Copyright Policy</h1>
                <p className="text-slate-500 font-semibold">Procedure for making claims of copyright infringement.</p>
            </div>

            <div className="space-y-8">
                <p className="text-lg leading-relaxed font-semibold text-slate-700">
                    SkilledCore respects the intellectual property rights of others and expects its users to do the same. It is SkilledCore's policy, in appropriate circumstances and at its discretion, to disable and/or terminate the accounts of users who repeatedly infringe or are repeatedly charged with infringing the copyrights or other intellectual property rights of others.
                </p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">DMCA Notice</h2>
                    <p>
                        If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to SkilledCore's Designated Copyright Agent.
                    </p>

                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                        <p className="font-semibold text-slate-800">Upon receipt of the Notice as described below, SkilledCore will take whatever action, in its sole discretion, it deems appropriate, including removal of the challenged material from the Site.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">Contact Copyright Agent</h2>
                    <p>
                        Notices of alleged infringement should be directed to the following:
                    </p>
                    <div className="pl-4 border-l-2 border-indigo-600 text-slate-500 font-mono text-sm leading-relaxed font-bold">
                        <p>SkilledCore Corporation</p>
                        <p>Attn: Copyright Agent</p>
                        <p>Legal Department</p>
                        <p>Email: <a href="mailto:support@skilledcore.com" className="text-indigo-600 hover:underline">support@skilledcore.com</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
