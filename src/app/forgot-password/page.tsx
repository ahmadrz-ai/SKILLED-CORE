"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendVerificationCode } from "@/app/actions/auth";
import { toast } from "sonner";
import Image from "next/image";

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
        <div className="min-h-screen w-full flex bg-bg-secondary-panel text-text-body relative">
            <div className="w-full h-screen flex items-center justify-center p-4 relative z-10">
                <div className="max-w-md w-full bg-bg-card border border-border-card rounded-2xl p-8 shadow-sc-lg relative">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Image src="/logo.png" alt="Logo" width={48} height={48} className="drop-shadow-sm" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text-heading mb-2">Reset Password</h1>
                        <p className="text-sm text-text-secondary">
                            Enter your email to receive a secure reset code.
                        </p>
                    </div>

                    <form onSubmit={handleSendCode} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-text-body-strong font-semibold">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-text-tertiary" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 bg-bg-input border-border-input text-text-body placeholder:text-text-placeholder"
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
                        <Link href="/login" className="text-sm text-text-secondary hover:text-text-heading flex items-center justify-center gap-2 transition-colors font-medium">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
