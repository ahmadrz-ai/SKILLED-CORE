"use client";

import React from "react";

export default function CommunityPoliciesPage() {
    return (
        <div className="text-slate-600 space-y-8 max-w-4xl animate-in fade-in duration-500 font-medium">
            {/* Header */}
            <div className="space-y-4 border-b border-slate-200 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">Professional Community Policies</h1>
                <p className="text-slate-500 font-semibold">These policies help ensure SkilledCore remains a professional and safe environment.</p>
            </div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">1. Be Professional</h2>
                    <div className="p-6 bg-indigo-50/50 border border-indigo-100 border-l-4 border-l-indigo-600 rounded-r-2xl shadow-sm space-y-2">
                        <p className="font-bold text-slate-800">We require our members to behave professionally by not being dishonest or inappropriate.</p>
                        <p className="text-slate-600">Do not share content that contains sexually explicit material or language. (Some adult content may be allowed if the intent is clearly educational, medical, scientific, or artistic, and it's not gratuitously graphic).</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">2. Be Safe</h2>
                    <p>
                        We strive to maintain a civil and safe environment. We do not tolerate content that attacks, denigrates, intimidates, dehumanizes, incites or threatens hatred, violence, prejudicial or discriminatory action against individuals or groups because of their actual or perceived race, ethnicity, national origin, caste, gender, gender identity, sexual orientation, religious affiliation, or disability status.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 font-semibold">
                        <li><strong>Harassment:</strong> Do not engage in harassment or bullying.</li>
                        <li><strong>Violence:</strong> Do not threaten violence or property damage.</li>
                        <li><strong>Self-Harm:</strong> Do not promote self-harm or suicide.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">3. Respect Intellectual Property</h2>
                    <p>
                        We respect the intellectual property rights of others. We require that information posted by members be accurate and not in violation of the intellectual property rights or other rights of third parties.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">4. No Spam or Scams</h2>
                    <p>
                        We do not allow spam or scams on SkilledCore. We may restrict your account usage if you send too many messages or connection requests in a short time frame, or if your activity suggests generated or automated behavior.
                    </p>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm">
                        <p className="text-red-700 text-sm font-bold uppercase tracking-wider">VIOLATING THESE POLICIES MAY RESULT IN IMMEDIATE ACCOUNT SUSPENSION.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
