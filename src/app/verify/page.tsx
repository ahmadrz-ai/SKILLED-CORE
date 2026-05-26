"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { sendVerificationCode } from "@/app/actions/auth"; // Keep for resend
import { signIn } from "next-auth/react";
import { QodeeLogo } from "@/components/QodeeLogo";

function VerifyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const trigger = searchParams.get("trigger");

    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (trigger === "true" && email) {
            handleResend();
            router.replace(`/verify?email=${encodeURIComponent(email)}`);
        }
    }, [trigger, email]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!email) {
            setError("Missing email address.");
            setIsLoading(false);
            return;
        }

        try {
            // Use signIn to verify and log in at the same time
            const result = await signIn("credentials", {
                email,
                otp: code,
                redirect: false
            });

            if (result?.error) {
                if (result.error === "Configuration") {
                    // Sometimes generic error for credentials mismatch
                    setError("Invalid code or server configuration.");
                } else if (result.error === "CredentialsSignin") {
                    setError("Invalid or expired code.");
                } else {
                    setError("Verification failed. Please try again.");
                    console.error("SignIn Error:", result.error);
                }
            } else {
                toast.success("Identity Verified. Redirecting...");
                // Success!
                router.push("/onboarding");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setIsResending(true);
        try {
            const res = await sendVerificationCode(email);
            if (res.success) {
                toast.success("Verification code sent!");
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to resend code");
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen w-full flex bg-transparent text-white items-center justify-center p-6 relative overflow-hidden font-mono">
                <p>Invalid Request. Missing email.</p>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans"
            style={{ background: "linear-gradient(165deg, #FAFAFE 0%, #F1EEFF 40%, #EDE9FE 70%, #FAFAFE 100%)" }}
        >
            {/* Subtle mesh background */}
            <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #6366F1 1px, transparent 1px), radial-gradient(circle at 75% 75%, #6366F1 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Soft gradient orbs */}
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-50px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-tr from-violet-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-white border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden">
                {/* Brand top accent bar */}
                <div className="w-full h-1" style={{ background: "linear-gradient(90deg, #6366F1, #06B6D4)" }} />

                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-14 w-14 bg-indigo-50/50 rounded-full flex items-center justify-center border border-indigo-100 shadow-inner">
                            <ShieldCheck className="w-7 h-7 text-indigo-600" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Verify Identity</h1>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Enter the 6-digit secure code sent to <br />
                            <span className="text-indigo-600 font-bold">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="code" className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Secure Code</Label>
                            <Input
                                id="code"
                                placeholder="000000"
                                className="bg-white border-zinc-200 text-center text-3xl tracking-[0.5em] font-mono font-black h-16 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all rounded-xl shadow-inner text-zinc-800 placeholder:text-zinc-200"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                maxLength={6}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || code.length !== 6}
                            className="w-full h-12 text-white font-bold tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl force-white-text active:scale-95 duration-150 border-none shrink-0"
                            style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "AUTHENTICATE"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-xs font-semibold text-zinc-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        >
                            {isResending ? "SENDING..." : "RESEND CODE"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full text-center">
                <div className="flex items-center justify-center gap-2 opacity-50">
                    <QodeeLogo className="w-3.5 h-3.5 text-zinc-400 grayscale" />
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Skilled Core Security Protocol</span>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading Secure Environment...</div>}>
            <VerifyPageContent />
        </Suspense>
    );
}
