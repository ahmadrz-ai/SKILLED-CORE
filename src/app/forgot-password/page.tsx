"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendVerificationCode } from "@/app/actions/auth";
import { toast } from "sonner";
import { QodeeLogo } from "@/components/QodeeLogo";
import { ParticleBackground } from "@/components/landing/ParticleBackground";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await sendVerificationCode(email);
            if (res.success) {
                toast.success("Reset code sent to " + email);
                // Redirect to Reset Password page with email pre-filled
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            } else {
                toast.error(res.error || "Failed to send code.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-transparent text-white relative">
            <ParticleBackground />

            {/* Content Container */}
            <div className="w-full h-screen flex items-center justify-center p-4 relative z-10">
                <div className="max-w-md w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <QodeeLogo className="w-12 h-12" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Reset Password</h1>
                        <p className="text-sm text-zinc-400">
                            Enter your email to receive a secure reset code.
                        </p>
                    </div>

                    <form onSubmit={handleSendCode} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 transition-colors"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button3D
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Code"}
                        </Button3D>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-zinc-500 hover:text-white flex items-center justify-center gap-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
