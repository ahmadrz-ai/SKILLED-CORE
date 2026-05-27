"use client";

import React from "react";

export default function PrivacyPolicyPage() {
    return (
        <div className="text-slate-600 space-y-8 max-w-4xl animate-in fade-in duration-500 font-medium">
            {/* Header */}
            <div className="space-y-4 border-b border-slate-200 pb-8">
                <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">Privacy Policy</h1>
                <p className="text-slate-500 font-semibold">Effective Date: January 1, 2026</p>
                <p className="text-lg leading-relaxed font-semibold text-slate-700">
                    At SkilledCore, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our professional network ("Platform").
                </p>
            </div>

            {/* Table of Contents */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Table of Contents</h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm font-bold">
                    <a href="#data-collection" className="text-indigo-600 hover:text-indigo-800 hover:underline">1. Data We Collect</a>
                    <a href="#data-usage" className="text-indigo-600 hover:text-indigo-800 hover:underline">2. How We Use Your Data</a>
                    <a href="#data-sharing" className="text-indigo-600 hover:text-indigo-800 hover:underline">3. How We Share Information</a>
                    <a href="#choices" className="text-indigo-600 hover:text-indigo-800 hover:underline">4. Your Choices & Obligations</a>
                    <a href="#security" className="text-indigo-600 hover:text-indigo-800 hover:underline">5. Security & Retention</a>
                    <a href="#contact" className="text-indigo-600 hover:text-indigo-800 hover:underline">6. Contact Us</a>
                </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-12">
                <section id="data-collection" className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">1. Data We Collect</h2>
                    <div className="space-y-4 text-slate-600">
                        <p>
                            <strong>1.1 Registration:</strong> To create an account you need to provide data including your name, email address and/or mobile number, and a password. If you register for a premium Service, you will need to provide payment (e.g., credit card) and billing information.
                        </p>
                        <p>
                            <strong>1.2 Profile:</strong> You have choices about the information on your profile, such as your education, work experience, skills, photo, city or area and endorsements. You don’t have to provide additional information on your profile; however, profile information helps you to get more from our Services, including helping recruiters and business opportunities find you.
                        </p>
                        <p>
                            <strong>1.3 Usage Data:</strong> We log usage data when you visit or otherwise use our Services, including our app and platform technology, such as when you view or click on content (e.g., learning video) or ads (on or off our app and sites), perform a search, install or update one of our mobile apps, share articles or apply for jobs.
                        </p>
                    </div>
                </section>

                <section id="data-usage" className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">2. How We Use Your Data</h2>
                    <div className="space-y-4 text-slate-600">
                        <p>
                            We use your data to authorize access to our Services and honor your settings. We use your data to provide, support, personalize and develop our Services.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 font-semibold">
                            <li><strong>Connect:</strong> Our Services allow you to stay in touch and up to date with colleagues, partners, clients, and other professional contacts.</li>
                            <li><strong>Productivity:</strong> Our Services allow you to collaborate with colleagues, search for potential clients, customers, partners and others to do business with.</li>
                            <li><strong>Career:</strong> We use your data to explore careers, evaluate educational opportunities, and seek out, and be found for, career opportunities.</li>
                            <li><strong>AI Analysis:</strong> We use automated systems and Machine Learning to parse your resume, match you with jobs, and analyze interview performance.</li>
                        </ul>
                    </div>
                </section>

                <section id="data-sharing" className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">3. How We Share Information</h2>
                    <div className="space-y-4 text-slate-600">
                        <p>
                            <strong>3.1 Our Services:</strong> Any data that you include on your profile and any content you post or social action (e.g., likes, follows, comments, shares) you take on our Services will be seen by others.
                        </p>
                        <p>
                            <strong>3.2 Recruiters:</strong> We share your profile data with recruiters and hiring managers who use our Talent Solutions, subject to your privacy settings.
                        </p>
                        <p>
                            <strong>3.3 Legal Disclosures:</strong> It is possible that we will need to disclose information about you when required by law, subpoena, or other legal process or if we have a good faith belief that disclosure is reasonably necessary to prevent illegal activity or protect the safety of any person.
                        </p>
                    </div>
                </section>

                <section id="choices" className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">4. Your Choices & Obligations</h2>
                    <div className="space-y-4 text-slate-600">
                        <p>
                            <strong>4.1 Data Retention:</strong> We retain your personal data as long as you keep your account open or as needed to provide you Services. This includes data you or others provided to us and data generated or inferred from your use of our Services.
                        </p>
                        <p>
                            <strong>4.2 Account Closure:</strong> If you choose to close your SkilledCore account, your personal data will generally stop being visible to others on our Services within 24 hours. We generally delete closed account information within 30 days of account closure, except as noted below.
                        </p>
                    </div>
                </section>

                <section id="security" className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">5. Security & Retention</h2>
                    <p className="text-slate-600">
                        We implement security safeguards designed to protect your data, such as HTTPS. We monitor our systems for possible vulnerabilities and attacks. However, we cannot warrant the security of any information that you send us. There is no guarantee that data may not be accessed, disclosed, altered, or destroyed by breach of any of our physical, technical, or managerial safeguards.
                    </p>
                </section>

                <section id="contact" className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">6. Contact Us</h2>
                    <p className="text-slate-600">
                        If you have questions or complaints regarding this Policy, please contact us online or by physical mail.
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-sm">
                        <p className="text-slate-900 font-extrabold text-sm mb-1">Data Protection Officer</p>
                        <p className="text-indigo-600 font-mono text-xs font-bold">support@skilledcore.com</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
