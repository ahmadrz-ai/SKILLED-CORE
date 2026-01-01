"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { QodeeLogo } from "@/components/QodeeLogo";
import { toast } from "sonner";
import { sendVerificationCode } from "@/app/actions/auth"; // Keep for resend
import { signIn } from "next-auth/react";

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
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Invalid Request. Missing email.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-black text-white items-center justify-center p-6 relative overflow-hidden font-mono">
            {/* Ambient */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />

            <div className="relative z-10 max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="h-12 w-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Verify Identity</h1>
                    <p className="text-sm text-zinc-500">
                        Enter the SECURE CODE sent to <br />
                        <span className="text-zinc-300 font-bold">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs uppercase tracking-widest text-zinc-500">Secure Code</Label>
                        <Input
                            id="code"
                            placeholder="000000"
                            className="bg-zinc-900 border-zinc-800 text-center text-2xl tracking-[0.5em] font-bold h-14 focus:border-emerald-500/50 transition-all placeholder:tracking-normal placeholder:text-zinc-700"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || code.length !== 6}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "AUTHENTICATE"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                    >
                        {isResending ? "SENDING..." : "RESEND CODE"}
                    </button>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full text-center">
                <div className="flex items-center justify-center gap-2 opacity-30">
                    <QodeeLogo className="w-4 h-4 grayscale" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Skilled Core Security</span>
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
