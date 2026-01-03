"use client";

import React from "react";

export default function CookiePolicyPage() {
    return (
        <div className="text-zinc-300 space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-4 border-b border-white/10 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">Cookie Policy</h1>
                <p className="text-zinc-400">Last Revised: January 1, 2026</p>
                <p className="text-lg leading-relaxed">
                    At Skilled Core, we believe in being clear and open about how we collect and use data related to you. This Cookie Policy applies to any Skilled Core product or service that links to this policy or incorporates it by reference.
                </p>
            </div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">What is a cookie?</h2>
                    <p>
                        A cookie is a small file placed onto your device that enables Skilled Core features and functionality. For example, cookies enable us to identify your device, secure your access to Skilled Core and our sites generally, and even help us know if someone attempts to access your account from a different device.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">How we use cookies</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-2">Authentication</h3>
                            <p className="text-sm text-zinc-400">If you're signed in to Skilled Core, cookies help us show you the right information and personalize your experience.</p>
                        </div>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-2">Security</h3>
                            <p className="text-sm text-zinc-400">We use cookies to enable and support our security features, and to help us detect malicious activity and violations of our User Agreement.</p>
                        </div>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-2">Preferences</h3>
                            <p className="text-sm text-zinc-400">Cookies can tell us which language you prefer and what your communications preferences are.</p>
                        </div>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-2">Performance</h3>
                            <p className="text-sm text-zinc-400">We use cookies to analyze how our Services are accessed, used, or performing.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Managing Cookies</h2>
                    <p>
                        Most browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
                    </p>
                </section>
            </div>
        </div>
    );
}
