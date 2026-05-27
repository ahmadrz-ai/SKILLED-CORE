"use client";

import Link from "next/link";

export default function UserAgreementPage() {
    return (
        <div className="space-y-12 text-slate-600 leading-relaxed font-medium">
            <div>
                <h1 className="text-4xl font-heading font-black text-slate-900 mb-4">User Agreement</h1>
                <p className="text-slate-500 font-semibold">Effective on January 1, 2026</p>
            </div>

            {/* Table of Contents */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Table of Contents</h3>
                <ul className="text-sm space-y-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 font-semibold">
                    <li><a href="#introduction" className="text-indigo-600 hover:text-indigo-800 hover:underline">1. Introduction</a></li>
                    <li><a href="#obligations" className="text-indigo-600 hover:text-indigo-800 hover:underline">2. Obligations</a></li>
                    <li><a href="#rights" className="text-indigo-600 hover:text-indigo-800 hover:underline">3. Rights and Limits</a></li>
                    <li><a href="#disclaimer" className="text-indigo-600 hover:text-indigo-800 hover:underline">4. Disclaimer and Limit of Liability</a></li>
                    <li><a href="#termination" className="text-indigo-600 hover:text-indigo-800 hover:underline">5. Termination</a></li>
                    <li><a href="#law" className="text-indigo-600 hover:text-indigo-800 hover:underline">6. Governing Law and Dispute Resolution</a></li>
                    <li><a href="#general" className="text-indigo-600 hover:text-indigo-800 hover:underline">7. General Terms</a></li>
                    <li><a href="#dos-donts" className="text-indigo-600 hover:text-indigo-800 hover:underline">8. SkilledCore “Dos and Don’ts”</a></li>
                    <li><a href="#complaints" className="text-indigo-600 hover:text-indigo-800 hover:underline">9. Complaints Regarding Content</a></li>
                    <li><a href="#contact" className="text-indigo-600 hover:text-indigo-800 hover:underline">10. How To Contact Us</a></li>
                </ul>
            </div>

            {/* 1. Introduction */}
            <section id="introduction" className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">1. Introduction</h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">1.1 Contract</h3>
                    <p>
                        When you use our Services you agree to all of these terms. Your use of our Services is also subject to our Cookie Policy and our Privacy Policy, which covers how we collect, use, share, and store your personal information.
                    </p>
                    <p>
                        You agree that by clicking “Join Now”, “Sign Up” or similar, registering, accessing or using our services (described below), you are agreeing to enter into a legally binding contract with SkilledCore Corporation (even if you are using our Services on behalf of a company). If you do not agree to this contract (“Contract” or “User Agreement”), do not access or otherwise use any of our Services. If you wish to terminate this contract, at any time you can do so by closing your account and no longer accessing or using our Services.
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 mt-8">1.2 Members and Visitors</h3>
                    <p>
                        When you register and join the SkilledCore Service, you become a Member. If you have chosen not to register for our Services, you may access certain features as a “Visitor.”
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 mt-8">1.3 Changes</h3>
                    <p>
                        We may make changes to the Contract. We may modify this Contract, our Privacy Policy and our Cookies Policies from time to time. If we make material changes to it, we will provide you notice through our Services, or by other means, to provide you the opportunity to review the changes before they become effective.
                    </p>
                </div>
            </section>

            <div className="h-px bg-slate-200" />

            {/* 2. Obligations */}
            <section id="obligations" className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">2. Obligations</h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">2.1 Service Eligibility</h3>
                    <p>
                        Here are some promises that you make to us in this Contract:
                    </p>
                    <p>
                        You are eligible to enter into this Contract and you are at least our “Minimum Age.” The Services are not for use by anyone under the age of 16.
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 mt-8">2.2 Your Account</h3>
                    <p>
                        You will keep your password a secret. You will not share an account with anyone else and will follow our rules and the law.
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 mt-8">2.3 Payment</h3>
                    <p>
                        If you buy any of our paid Services (\"Premium Services\"), you agree to pay us the applicable fees and taxes and to additional terms specific to the paid Services. Failure to pay these fees will result in the termination of your paid Services.
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 mt-8">2.4 Notices and Messages</h3>
                    <p>
                        You agree that we will provide notices and messages to you in the following ways: (1) within the Service, or (2) sent to the contact information you provided us (e.g., email, mobile number, physical address). You agree to keep your contact information up to date.
                    </p>
                </div>
            </section>

            <div className="h-px bg-slate-200" />

            {/* 8. Dos and Don'ts */}
            <section id="dos-donts" className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">8. SkilledCore “Dos and Don’ts”</h2>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* DOS */}
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                        <h3 className="text-lg font-extrabold text-emerald-700 mb-4">8.1. Dos</h3>
                        <ul className="space-y-3 text-slate-700 text-sm list-disc pl-4 font-semibold">
                            <li>Comply with all applicable laws, including, without limitation, privacy laws, intellectual property laws, anti-spam laws, export control laws, tax laws, and regulatory requirements.</li>
                            <li>Provide accurate information to us and keep it updated.</li>
                            <li>Use your real name on your profile.</li>
                            <li>Use the Services in a professional manner.</li>
                        </ul>
                    </div>

                    {/* DONTS */}
                    <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 shadow-sm">
                        <h3 className="text-lg font-extrabold text-red-700 mb-4">8.2. Don'ts</h3>
                        <ul className="space-y-3 text-slate-700 text-sm list-disc pl-4 font-semibold">
                            <li>Create a false identity on SkilledCore, misrepresent your identity, create a Member profile for anyone other than yourself (a real person), or use or attempt to use another’s account.</li>
                            <li>Develop, support or use software, devices, scripts, robots or any other means or processes to scrape the Services or otherwise copy profiles and other data from the Services.</li>
                            <li>Override any security feature or bypass or circumvent any access controls or use limits of the Service.</li>
                            <li>Disclose information that you do not have the consent to disclose (such as confidential information of others).</li>
                            <li>Violate the intellectual property rights of others, including copyrights, patents, trademarks, trade secrets or other proprietary rights.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <div className="h-px bg-slate-200" />

            {/* 10. Contact */}
            <section id="contact" className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">10. How To Contact Us</h2>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600 mb-4">
                        For general inquiries, you may contact us online. For legal notices or service of process, you may write us at:
                    </p>
                    <address className="not-italic text-sm text-slate-700 font-mono font-bold">
                        SkilledCore Corporation<br />
                        Legal Department<br />
                        123 AI Boulevard<br />
                        Tech City, TC 90210<br />
                        United States
                    </address>
                </div>
            </section>

        </div>
    );
}
