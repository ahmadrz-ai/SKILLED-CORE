"use client";

import React from "react";

export default function CommunityPoliciesPage() {
    return (
        <div className="text-zinc-300 space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-4 border-b border-white/10 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">Professional Community Policies</h1>
                <p className="text-zinc-400">These policies help ensure Skiled Core remains a professional and safe environment.</p>
            </div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">1. Be Professional</h2>
                    <div className="p-6 bg-zinc-900/50 border-l-4 border-violet-500 rounded-r-xl space-y-2">
                        <p className="font-semibold text-white">We require our members to behave professionally by not being dishonest or inappropriate.</p>
                        <p className="text-zinc-400">Do not share content that contains sexually explicit material or language. (Some adult content may be allowed if the intent is clearly educational, medical, scientific, or artistic, and it's not gratuitously graphic).</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">2. Be Safe</h2>
                    <p>
                        We strive to maintain a civil and safe environment. We do not tolerate content that attacks, denigrates, intimidates, dehumanizes, incites or threatens hatred, violence, prejudicial or discriminatory action against individuals or groups because of their actual or perceived race, ethnicity, national origin, caste, gender, gender identity, sexual orientation, religious affiliation, or disability status.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Harassment:</strong> Do not engage in harassment or bullying.</li>
                        <li><strong>Violence:</strong> Do not threaten violence or property damage.</li>
                        <li><strong>Self-Harm:</strong> Do not promote self-harm or suicide.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">3. Respect Intellectual Property</h2>
                    <p>
                        We respect the intellectual property rights of others. We require that information posted by members be accurate and not in violation of the intellectual property rights or other rights of third parties.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">4. No Spam or Scams</h2>
                    <p>
                        We do not allow spam or scams on Skilled Core. We may restrict your account usage if you send too many messages or connection requests in a short time frame, or if your activity suggests generated or automated behavior.
                    </p>
                    <div className="bg-red-950/20 border border-red-500/10 p-4 rounded-lg">
                        <p className="text-red-200 text-sm">VIOLATING THESE POLICIES MAY RESULT IN IMMEDIATE ACCOUNT SUSPENSION.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
