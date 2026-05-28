import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";
import { QodeeLogo } from "@/components/QodeeLogo";

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { email } = await searchParams;
    const emailStr = email as string || "your email";

    return (
        <div className="min-h-screen w-full flex bg-[var(--bg-page)] text-[var(--text-body)] items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background ambient effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,var(--sc-purple-100),transparent_70%)] opacity-30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[var(--border-subtle)] rounded-full opacity-30 pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-8 shadow-[var(--shadow-modal)] text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-[var(--sc-purple-50)] rounded-full flex items-center justify-center border border-[var(--sc-purple-200)]">
                        <Mail className="w-8 h-8 text-[var(--text-brand)]" />
                    </div>
                </div>

                <h1 className="text-2xl font-heading font-bold mb-2 text-[var(--text-heading)]">Check your email</h1>
                <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                    We've sent a verification link to <span className="text-[var(--text-heading)] font-semibold">{emailStr}</span>. Please click the link inside that email to activate your account.
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-[var(--bg-secondary-panel)] rounded-xl border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                        <p>Didn't receive the email? Check your spam folder or try again in a few minutes.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            variant="outline" 
                            className="w-full bg-[var(--btn-secondary-bg)] border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] font-bold text-xs py-2 rounded-xl transition-all cursor-pointer shadow-sm select-none" 
                            asChild
                        >
                            <Link href="/login">
                                Return to Login
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-center gap-2">
                    <QodeeLogo className="w-6 h-6 grayscale opacity-50" />
                    <span className="text-xs text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Skilled Core Security</span>
                </div>
            </div>
        </div>
    );
}
