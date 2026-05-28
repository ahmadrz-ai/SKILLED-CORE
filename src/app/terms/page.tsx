"use client";

import { AppShell } from "@/components/layout/AppShell";

export default function TermsOfServicePage() {
    return (
        <AppShell>
            <div className="space-y-8 text-text-body">
                {/* 1. Acceptance */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">1. Acceptance of Terms</h2>
                    <p className="text-sm leading-relaxed">
                        By accessing or using the services provided by SkilledCore ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
                    </p>
                </section>

                {/* 2. IP Rights */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">2. Intellectual Property Rights</h2>
                    <p className="text-sm leading-relaxed">
                        The Services, including but not limited to all code, software, designs, text, graphics, logos, and the "SkilledCore" branding, are the exclusive property of the owner of SkilledCore and are protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p className="text-sm leading-relaxed">
                        You constitute that you will not copy, modify, distribute, sell, or lease any part of our Services or included software, nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit those restrictions or you have our written permission.
                    </p>
                </section>

                {/* 3. User Accounts */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">3. User Accounts</h2>
                    <p className="text-sm leading-relaxed">
                        To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                    <p className="bg-sc-red-50 p-4 rounded-xl border border-sc-red-150 text-text-error text-xs font-semibold leading-relaxed">
                        We reserve the right to suspend, ban, or terminate your user account at any time and for any reason, including but not limited to a violation of these Terms, without notice or liability.
                    </p>
                </section>

                {/* 4. Limitation of Liability */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-text-heading border-l-4 border-sc-purple-500 pl-3">4. Limitation of Liability</h2>
                    <p className="text-sm leading-relaxed">
                        In no event shall SkilledCore, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any third party conduct on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions.
                    </p>
                </section>

                <div className="h-px bg-border-subtle my-6" />

                {/* Contact */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-text-heading">Contact Us</h3>
                    <p className="text-xs text-text-secondary">
                        If you have any questions about these Terms, please contact us at:
                    </p>
                    <div className="inline-block px-3 py-1.5 bg-bg-secondary-panel border border-border-default rounded-lg text-text-brand font-mono text-xs font-bold shadow-sc-xs">
                        support@skilledcore.com
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
