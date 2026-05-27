"use client";

import React from "react";

export default function CookiePolicyPage() {
    return (
        <div className="text-slate-600 space-y-8 max-w-4xl animate-in fade-in duration-500 font-medium">
            {/* Header */}
            <div className="space-y-4 border-b border-slate-200 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">Cookie Policy</h1>
                <p className="text-slate-500 font-semibold">Last Revised: January 1, 2026</p>
                <p className="text-lg leading-relaxed font-semibold text-slate-700">
                    At SkilledCore, we believe in being clear and open about how we collect and use data related to you. This Cookie Policy applies to any SkilledCore product or service that links to this policy or incorporates it by reference.
                </p>
            </div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">What is a cookie?</h2>
                    <p>
                        A cookie is a small file placed onto your device that enables SkilledCore features and functionality. For example, cookies enable us to identify your device, secure your access to SkilledCore and our sites generally, and even help us know if someone attempts to access your account from a different device.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">How we use cookies</h2>
                    <div className="grid md:grid-cols-2 gap-6 font-semibold">
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Authentication</h3>
                            <p className="text-sm text-slate-500">If you're signed in to SkilledCore, cookies help us show you the right information and personalize your experience.</p>
                        </div>
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Security</h3>
                            <p className="text-sm text-slate-500">We use cookies to enable and support our security features, and to help us detect malicious activity and violations of our User Agreement.</p>
                        </div>
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Preferences</h3>
                            <p className="text-sm text-slate-500">Cookies can tell us which language you prefer and what your communications preferences are.</p>
                        </div>
                        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Performance</h3>
                            <p className="text-sm text-slate-500">We use cookies to analyze how our Services are accessed, used, or performing.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">Managing Cookies</h2>
                    <p>
                        Most browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
                    </p>
                </section>
            </div>
        </div>
    );
}
