"use client";

import { useState } from "react";
import { Github, Loader2, Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

export default function LoginPageContent() {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSocialLogin = (provider: "google" | "github") => {
        setIsLoading(provider);
        signIn(provider, { callbackUrl: "/feed" });
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading("credentials");
        setError("");
        try {
            // Import dynamically to avoid server action bundle issues on initial render
            const { verifyPasswordLogin } = await import("@/app/actions/twoFactor");

            // 1. Audit password credentials first
            const check = await verifyPasswordLogin(identifier, password);

            if (!check.success) {
                setError(check.error || "Invalid email or password. Please try again.");
                setIsLoading(null);
                return;
            }

            // 2. Redirect to verification page if Two-Factor is enabled on this profile
            if (check.twoFactorRequired) {
                window.location.href = "/verify-2fa";
                return;
            }

            // 3. Fall through to standard Credentials auth session creation if no 2FA setup is active
            const res = await signIn("credentials", {
                email: identifier,
                password,
                redirect: false,
                callbackUrl: "/feed",
            });

            if (res?.error) {
                setError("Invalid email or password. Please try again.");
                setIsLoading(null);
            } else {
                window.location.href = "/feed";
            }
        } catch (e: any) {
            setError(e?.message || "Internal server error occurred.");
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-sc-gray-50 px-4 py-12 text-text-body">
            <div className="w-full max-w-md">

                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
                    <Image src="/logo.png" alt="SkilledCore" width={36} height={36} className="group-hover:scale-105 transition-transform" />
                    <span className="font-bold text-lg text-text-heading tracking-tight">SkilledCore</span>
                </Link>

                {/* Card */}
                <div className="bg-bg-card border border-border-default rounded-2xl shadow-sc-card p-8">
                    <div className="mb-7 text-center">
                        <h2 className="text-2xl font-bold text-text-heading tracking-tight">Welcome back</h2>
                        <p className="text-sm text-text-secondary mt-1.5">Sign in to your account to continue.</p>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleSocialLogin("google")}
                            disabled={!!isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-bg-page border border-border-default text-text-body-strong hover:bg-sc-gray-50"
                        >
                            {isLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                            Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin("github")}
                            disabled={!!isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-bg-page border border-border-default text-text-body-strong hover:bg-sc-gray-50"
                        >
                            {isLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                            GitHub
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border-default" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs font-medium bg-bg-card text-text-tertiary">or continue with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        <div>
                            <Label htmlFor="identifier" className="text-sm font-medium mb-1.5 block text-text-body-strong">
                                Email or username
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <Input id="identifier" type="text" placeholder="you@company.com"
                                    className="pl-9 h-10 text-sm bg-bg-input border-border-input text-text-body"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-text-body-strong">Password</Label>
                                <Link href="/forgot-password" className="text-xs font-medium transition-colors text-text-brand hover:text-text-brand-hover">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Your password"
                                    className="pl-9 pr-10 h-10 text-sm bg-bg-input border-border-input text-text-body"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-text-tertiary hover:text-text-secondary">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-bg-error border border-border-error text-text-error">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={!!isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed group bg-sc-purple-600 text-white hover:bg-sc-purple-700">
                            {isLoading === "credentials"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><span>Sign in</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6 text-text-secondary">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-text-brand hover:text-text-brand-hover transition-opacity">
                            Create account
                        </Link>
                    </p>
                </div>

                {/* Trust row */}
                <div className="flex items-center justify-center gap-5 mt-6">
                    {['GDPR Compliant', '256-bit SSL', 'SOC 2'].map((t) => (
                        <span key={t} className="text-[11px] font-medium text-text-tertiary">{t}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
