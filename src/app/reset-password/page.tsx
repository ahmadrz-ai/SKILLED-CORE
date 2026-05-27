"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, KeyRound, Check, Shield, Eye, EyeOff } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/app/actions/reset-password";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
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
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                <p>Missing email parameter.</p>
                <button onClick={() => router.push('/forgot-password')} className="text-text-brand hover:underline mt-4 font-semibold hover:text-text-brand-hover">
                    Request new code
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex items-center justify-center p-4 relative z-10">
            <div className="max-w-md w-full bg-bg-card border border-border-card rounded-2xl p-8 shadow-sc-lg relative">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative z-10 flex items-center justify-center gap-3 mb-4">
                        <Image src="/logo.png" alt="Logo" width={48} height={48} className="drop-shadow-sm" />
                        <div className="text-left">
                            <h3 className="font-heading font-black tracking-widest text-lg text-text-heading leading-none">SKILLEDCORE</h3>
                            <p className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest mt-0.5">Enterprise Node</p>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-heading mb-2">Secure Reset</h1>
                    <p className="text-sm text-text-secondary">
                        Enter the code sent to <span className="text-text-body-strong font-bold">{email}</span> and your new password.
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">

                    {/* Verification Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs uppercase tracking-widest text-text-tertiary font-bold">Reset Code</Label>
                        <Input
                            id="code"
                            placeholder="000000"
                            className="bg-bg-input border-border-input text-text-body text-center text-2xl tracking-[0.5em] font-bold h-14 focus:border-border-focus transition-all placeholder:tracking-normal placeholder:text-text-placeholder"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            maxLength={6}
                            required
                        />
                    </div>

                    <div className="h-px bg-border-default my-4" />

                    {/* New Password */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-text-body-strong font-semibold">New Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-text-tertiary" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10 bg-bg-input border-border-input text-text-body"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm" className="text-text-body-strong font-semibold">Confirm Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-text-tertiary" />
                                <Input
                                    id="confirm"
                                    type="password"
                                    className="pl-10 bg-bg-input border-border-input text-text-body"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <div className="absolute left-3 top-2.5 opacity-0">
                                    <Check className={cn("w-4 h-4", confirmPassword && password === confirmPassword ? "text-text-success opacity-100" : "opacity-0")} />
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
        <div className="min-h-screen w-full flex bg-bg-secondary-panel text-text-body relative">
            <Suspense fallback={<div className="text-text-secondary flex items-center justify-center w-full h-full">Loading Secure Environment...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
