"use client";

import { useState } from "react";
import { Github, Loader2, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
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

const FEATURES = [
    "AI-powered candidate matching",
    "Real-time hiring analytics",
    "Built-in skills assessments & LMS",
    "GDPR-compliant data handling",
];

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
            setError(e.message);
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex" style={{ backgroundColor: '#F9FAFB' }}>

            {/* LEFT PANEL — Dark brand panel */}
            <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(165deg, #0B0F19 0%, #111827 50%, #1E1B4B 100%)' }}>
                {/* Subtle high-fidelity grid pattern */}
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                {/* Decorative glowing lines and spheres */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border rounded-full opacity-[0.03]" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border rounded-full opacity-[0.03]" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                
                {/* Ambient violet/indigo glows */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <Image src="/logo.png" alt="SkilledCore" width={38} height={38} className="drop-shadow-lg" />
                    <div>
                        <div className="font-bold text-sm tracking-wide" style={{ color: '#FFFFFF' }}>SkilledCore</div>
                        <div className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Talent Intelligence Platform</div>
                    </div>
                </div>

                {/* Headline */}
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold leading-tight mb-6" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                        Your talent intelligence
                        <br />
                        <span style={{ color: '#818CF8' }}>command center.</span>
                    </h1>
                    <p className="text-base leading-relaxed mb-10" style={{ color: '#9CA3AF' }}>
                        Access your hiring pipeline, candidate profiles, skills analytics, and everything you need to build world-class teams.
                    </p>
                    <div className="space-y-3">
                        {FEATURES.map((item) => (
                            <div key={item} className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#6366F1' }} />
                                <span className="text-sm" style={{ color: '#D1D5DB' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer trust */}
                <div className="relative z-10 flex items-center gap-5">
                    {['SOC 2 Certified', 'GDPR Compliant', '256-bit SSL'].map((t) => (
                        <span key={t} className="text-xs font-medium" style={{ color: '#6B7280' }}>{t}</span>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL — Clean Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="w-full max-w-md">

                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <Image src="/logo.png" alt="SkilledCore" width={32} height={32} className="drop-shadow-lg" />
                        <span className="font-bold text-sm" style={{ color: '#111827' }}>SkilledCore</span>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1.5" style={{ color: '#111827', letterSpacing: '-0.015em' }}>Welcome back</h2>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Sign in to your account to continue.</p>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleSocialLogin("google")}
                            disabled={!!isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#374151' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        >
                            {isLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                            Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin("github")}
                            disabled={!!isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#374151' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        >
                            {isLoading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                            GitHub
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full" style={{ borderTop: '1px solid #E5E7EB' }} />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 text-sm font-medium" style={{ backgroundColor: '#FFFFFF', color: '#9CA3AF' }}>or continue with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        <div>
                            <Label htmlFor="identifier" className="text-sm font-medium mb-1.5 block" style={{ color: '#374151' }}>
                                Email or username
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                                <Input id="identifier" type="text" placeholder="you@company.com"
                                    className="pl-9 h-10 text-sm"
                                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#111827' }}
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#374151' }}>Password</Label>
                                <Link href="/forgot-password" className="text-xs font-medium transition-colors hover:opacity-80" style={{ color: '#6366F1' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Your password"
                                    className="pl-9 pr-10 h-10 text-sm"
                                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#111827' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                                    style={{ color: '#9CA3AF' }}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm flex items-center gap-2"
                                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={!!isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
                            style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
                            onMouseEnter={e => !isLoading && (e.currentTarget.style.backgroundColor = '#4F46E5')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366F1')}>
                            {isLoading === "credentials"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><span>Sign in</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
                        Don't have an account?{" "}
                        <Link href="/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#6366F1' }}>
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
