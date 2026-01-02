"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, KeyRound, Check } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/actions/reset-password";
import { toast } from "sonner";
import { QodeeLogo } from "@/components/QodeeLogo";
import { ParticleBackground } from "@/components/landing/ParticleBackground";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const res = await resetPassword(email, code, password);
            if (res.success) {
                toast.success("Password reset successfully!");
                router.push("/login");
            } else {
                toast.error(res.error || "Failed to reset password");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <p>Missing email parameter.</p>
                <button onClick={() => router.push('/forgot-password')} className="text-violet-400 hover:underline mt-4">
                    Request new code
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex items-center justify-center p-4 relative z-10">
            <div className="max-w-md w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <QodeeLogo className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Secure Reset</h1>
                    <p className="text-sm text-zinc-500">
                        Enter the code sent to <span className="text-zinc-300 font-bold">{email}</span> and your new password.
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">

                    {/* Verification Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs uppercase tracking-widest text-zinc-500">Reset Code</Label>
                        <Input
                            id="code"
                            placeholder="000000"
                            className="bg-zinc-900 border-zinc-800 text-center text-2xl tracking-[0.5em] font-bold h-14 focus:border-emerald-500/50 transition-all placeholder:tracking-normal placeholder:text-zinc-700"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            maxLength={6}
                            required
                        />
                    </div>

                    <div className="h-px bg-white/10 my-4" />

                    {/* New Password */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10 bg-zinc-900/50 border-zinc-800"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    id="confirm"
                                    type="password"
                                    className="pl-10 bg-zinc-900/50 border-zinc-800"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <div className="absolute left-3 top-2.5 opacity-0">
                                    <Check className={cn("w-4 h-4", confirmPassword && password === confirmPassword ? "text-green-500 opacity-100" : "opacity-0")} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button3D
                        type="submit"
                        disabled={isLoading || code.length !== 6 || password.length < 6}
                        className="w-full mt-6"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set New Password"}
                    </Button3D>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full flex bg-transparent text-white relative">
            <ParticleBackground />
            <Suspense fallback={<div className="text-zinc-500 flex items-center justify-center w-full h-full">Loading Secure Environment...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
