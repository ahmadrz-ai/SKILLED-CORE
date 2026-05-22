import type { Metadata } from "next";
import { Shield, Trash2, Mail, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
    title: "Data Deletion Request | SkilledCore",
    description: "Submit a request for deletion of your SkilledCore account and all associated personal data, per GDPR Article 17 Right to Erasure.",
};

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-transparent text-white">
            <section className="py-20 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-4xl font-heading font-black text-white mb-4">
                            Data Deletion Request
                        </h1>
                        <p className="text-zinc-400 leading-relaxed">
                            Under GDPR Article 17 (Right to Erasure), you have the right to request deletion
                            of your account and all associated personal data from SkilledCore.
                        </p>
                    </div>

                    {/* Info card */}
                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-8 flex gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-zinc-400 space-y-2">
                            <p className="text-amber-300 font-semibold">Before you request deletion:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>You can delete your account directly in <strong className="text-white">Settings → Account → Delete Account</strong> if you are logged in.</li>
                                <li>All your posts, messages, applications, and profile data will be permanently removed.</li>
                                <li>This action cannot be undone.</li>
                                <li>We will process your request within <strong className="text-white">30 days</strong> per GDPR requirements.</li>
                            </ul>
                        </div>
                    </div>

                    {/* What gets deleted */}
                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl mb-8">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-violet-400" />
                            What will be deleted
                        </h2>
                        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400">
                            {[
                                "Profile & bio",
                                "Work experience & education",
                                "Skills & portfolio",
                                "Posts & comments",
                                "Messages & conversations",
                                "Job applications",
                                "Saved jobs",
                                "Interview history",
                                "Assessment results",
                                "Connection data",
                                "Profile views",
                                "Notification history",
                            ].map(item => (
                                <div key={item} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Request method */}
                    <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl mb-6">
                        <h2 className="text-lg font-bold text-white mb-4">How to Submit a Deletion Request</h2>
                        <div className="space-y-4 text-sm text-zinc-400">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xs shrink-0">1</div>
                                <div>
                                    <p className="text-zinc-300 font-medium mb-1">Self-service (fastest)</p>
                                    <p>Log in → Settings → Account → Delete Account. Your account will be deleted immediately.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xs shrink-0">2</div>
                                <div>
                                    <p className="text-zinc-300 font-medium mb-1">Email request</p>
                                    <p>
                                        If you no longer have access to your account, email{" "}
                                        <a href="mailto:privacy@skilledcore.com" className="text-violet-400 hover:underline">
                                            privacy@skilledcore.com
                                        </a>{" "}
                                        with the subject line <strong className="text-white">"Right to Erasure Request"</strong> and include
                                        the email address associated with your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="text-center py-8 border-t border-white/5">
                        <p className="text-zinc-500 text-sm mb-4">
                            Questions about your data rights? Contact our Data Protection team.
                        </p>
                        <a
                            href="mailto:privacy@skilledcore.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600/10 border border-violet-500/30 rounded-xl text-violet-300 hover:text-white hover:bg-violet-600/20 transition-all text-sm"
                        >
                            <Mail className="w-4 h-4" />
                            privacy@skilledcore.com
                        </a>
                        <p className="text-xs text-zinc-600 mt-4">
                            Per GDPR Article 12, we will respond to all data requests within one month.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
