import { QodeeLogo } from "@/components/QodeeLogo";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { email } = await searchParams;
    const emailStr = email as string || "your email";

    return (
        <div className="min-h-screen w-full flex bg-transparent text-white items-center justify-center p-6 relative overflow-hidden">
            {/* Background ambient effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),transparent_70%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full opacity-20" />

            <div className="relative z-10 max-w-md w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-violet-500/10 rounded-full flex items-center justify-center border border-violet-500/20">
                        <Mail className="w-8 h-8 text-violet-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-heading font-bold mb-2">Check your email</h1>
                <p className="text-zinc-400 mb-6">
                    We've sent a verification link to <span className="text-white font-medium">{emailStr}</span>. Please click the link to activate your account.
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 text-sm text-zinc-500">
                        <p>Didn't receive the email? Check your spam folder or try again.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button variant="outline" className="w-full bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-white" asChild>
                            <Link href="/login">
                                Return to Login
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
                    <QodeeLogo className="w-6 h-6 grayscale opacity-50" />
                    <span className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Skilled Core Security</span>
                </div>
            </div>
        </div>
    );
}
