"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, Eye, EyeOff, Check, Shield } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// FIX-003: Turnstile sitekey (public key is safe to expose client-side)
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // test key fallback

// Custom Google Icon
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// FIX-003: Cloudflare Turnstile widget component
function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Load Turnstile script if not already loaded
        if (!document.querySelector('script[src*="turnstile"]')) {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const renderWidget = () => {
            if (containerRef.current && (window as any).turnstile && !widgetIdRef.current) {
                widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    callback: (token: string) => onVerify(token),
                    'expired-callback': () => onVerify(''),
                    theme: 'light',
                    size: 'flexible',
                });
            }
        };

        // Poll for Turnstile to be available
        const interval = setInterval(() => {
            if ((window as any).turnstile) {
                clearInterval(interval);
                renderWidget();
            }
        }, 200);

        return () => {
            clearInterval(interval);
            if (widgetIdRef.current && (window as any).turnstile) {
                try { (window as any).turnstile.remove(widgetIdRef.current); } catch {}
                widgetIdRef.current = null;
            }
        };
    }, [onVerify]);

    return <div ref={containerRef} className="mt-2" />;
}

export default function RegisterPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/onboarding';

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');
    const [showPassword, setShowPassword] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string>('');

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    // Pre-select role from URL param
    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'recruiter') setRole('RECRUITER');
        if (roleParam === 'candidate') setRole('CANDIDATE');
    }, [searchParams]);

    const handleSocialLogin = (provider: "google" | "github") => {
        setIsLoading(provider);
        if (typeof window !== "undefined") {
            if (formData.name) sessionStorage.setItem("skilledcore_pending_name", formData.name.trim());
            if (formData.username) sessionStorage.setItem("skilledcore_pending_username", formData.username.toLowerCase().replace(/[^a-z0-9_]/g, ''));
            sessionStorage.setItem("skilledcore_pending_role", role);
        }
        const callbackUrl = `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}role=${role.toLowerCase()}`;
        signIn(provider, { callbackUrl });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        // FIX-003: Require Turnstile token before submission
        if (!turnstileToken) {
            toast.error("Please complete the security check.");
            return;
        }

        setIsLoading("email");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: role,
                    turnstileToken: turnstileToken, // FIX-003: Pass CAPTCHA token
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Account created! Sending verification code...");
                router.push(`/verify?email=${encodeURIComponent(formData.email)}&trigger=true`);
            } else {
                toast.error(data.error || "Registration failed. Please try again.");
                // Reset Turnstile on failure so user can retry
                setTurnstileToken('');
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden" style={{ background: "#FAFAFE" }}>
            {/* LEFT SIDE - BRAND */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12"
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

                <div className="relative z-10 flex items-center gap-3">
                    <Image src="/logo.png" alt="SkilledCore" width={44} height={44} className="drop-shadow-lg" />
                    <div>
                        <h3 style={{ color: "#F8FAFC", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.01em" }}>SkilledCore</h3>
                        <p style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 500 }}>Talent Intelligence Platform</p>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6" style={{ color: "#F8FAFC", letterSpacing: "-0.03em" }}>
                        &quot;The future belongs to the{" "}
                        <span style={{ background: "linear-gradient(135deg, #C4B5FD, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            builders
                        </span>.&quot;
                    </h1>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                        <Shield className="w-3 h-3" style={{ color: "#10B981" }} />
                        <span>CAPTCHA-protected • AES-256 Encrypted • GDPR Compliant</span>
                    </div>
                </div>

                <div className="relative z-10 text-xs uppercase tracking-widest" style={{ color: "#64748B" }}>
                    Secure Connection • AES-256 Encryption
                </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-md w-full rounded-2xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2.5 mb-6 lg:hidden justify-center">
                        <Image src="/logo.png" alt="SkilledCore" width={32} height={32} className="drop-shadow-lg" />
                        <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>SkilledCore</span>
                    </div>

                    <div className="text-center space-y-2 mb-6">
                        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1B4B" }}>Create Account</h2>
                        <p className="text-sm" style={{ color: "#64748B" }}>Join the professional network of SkilledCore.</p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            id="register-google-btn"
                            variant="outline"
                            className="h-11"
                            style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#475569" }}
                            onClick={() => handleSocialLogin('google')}
                            disabled={!!isLoading}
                        >
                            {isLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span className="mr-2"><GoogleIcon /></span>}
                            Google
                        </Button>
                        <Button
                            id="register-github-btn"
                            variant="outline"
                            className="h-11"
                            style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#475569" }}
                            onClick={() => handleSocialLogin('github')}
                            disabled={!!isLoading}
                        >
                            {isLoading === 'github' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Github className="w-4 h-4 mr-2" />}
                            GitHub
                        </Button>
                    </div>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full" style={{ borderTop: "1px solid #E2E8F0" }} />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 text-xs" style={{ background: "#FFFFFF", color: "#94A3B8" }}>Or register with email</span>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="grid grid-cols-2 p-1 rounded-lg mb-5" style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>
                        <button
                            id="role-candidate-btn"
                            type="button"
                            onClick={() => setRole('CANDIDATE')}
                            className={cn(
                                "py-2 text-sm font-medium rounded-md transition-all",
                                role === 'CANDIDATE'
                                    ? "shadow-sm"
                                    : ""
                            )}
                            style={role === 'CANDIDATE' ? { background: "#FFFFFF", color: "#1E1B4B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#94A3B8" }}
                        >
                            Candidate
                        </button>
                        <button
                            id="role-recruiter-btn"
                            type="button"
                            onClick={() => setRole('RECRUITER')}
                            className={cn(
                                "py-2 text-sm font-medium rounded-md transition-all",
                                role === 'RECRUITER'
                                    ? "shadow-sm"
                                    : ""
                            )}
                            style={role === 'RECRUITER' ? { background: "#FFFFFF", color: "#1E1B4B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#94A3B8" }}
                        >
                            Recruiter
                        </button>
                    </div>

                    {/* Registration Form */}
                    <form id="register-form" onSubmit={handleRegister} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" style={{ color: "#475569", fontSize: "13px" }}>Full Name</Label>
                            <div className="relative">
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="pl-9 h-10"
                                    style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#1E1B4B" }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    minLength={2}
                                />
                                <div className="absolute left-3 top-2.5">
                                    <Check className={cn("w-4 h-4", formData.name.length > 2 ? "text-emerald-500" : "text-slate-300")} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="username" style={{ color: "#475569", fontSize: "13px" }}>Username</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    placeholder="johndoe"
                                    className="pl-9 h-10"
                                    style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#1E1B4B" }}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    required
                                    minLength={3}
                                />
                                <div className="absolute left-3 top-2.5">
                                    <Check className={cn("w-4 h-4", formData.username.length >= 3 ? "text-emerald-500" : "text-slate-300")} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" style={{ color: "#475569", fontSize: "13px" }}>
                                {role === 'RECRUITER' ? 'Work Email' : 'Email'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={role === 'RECRUITER' ? 'name@company.com' : 'you@example.com'}
                                    className="pl-9 h-10"
                                    style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#1E1B4B" }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <div className="absolute left-3 top-2.5">
                                    <Check className={cn("w-4 h-4", formData.email.includes('@') ? "text-emerald-500" : "text-slate-300")} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="password" style={{ color: "#475569", fontSize: "13px" }}>Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 chars"
                                        className="pl-9 pr-9 h-10"
                                        style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#1E1B4B" }}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                    <div className="absolute left-3 top-2.5">
                                        <Check className={cn("w-4 h-4", formData.password.length >= 8 ? "text-emerald-500" : "text-slate-300")} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 min-h-0 min-w-0"
                                        style={{ color: "#94A3B8" }}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" style={{ color: "#475569", fontSize: "13px" }}>Confirm</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Repeat password"
                                        className="pl-9 h-10"
                                        style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#1E1B4B" }}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                    <div className="absolute left-3 top-2.5">
                                        <Check className={cn("w-4 h-4", formData.confirmPassword && formData.password === formData.confirmPassword ? "text-emerald-500" : "text-slate-300")} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FIX-003: Cloudflare Turnstile CAPTCHA */}
                        <div className="space-y-1">
                            <TurnstileWidget onVerify={setTurnstileToken} />
                            {turnstileToken ? (
                                <p className="text-xs flex items-center gap-1" style={{ color: "#059669" }}>
                                    <Check className="w-3 h-3" /> Security check passed
                                </p>
                            ) : (
                                <p className="text-xs" style={{ color: "#94A3B8" }}>Complete the security check above to continue</p>
                            )}
                        </div>

                        <div className="flex items-start gap-3 my-1">
                            <input
                                type="checkbox"
                                id="agreement"
                                required
                                className="mt-1 w-4 h-4 rounded cursor-pointer accent-indigo-600"
                                style={{ borderColor: "#D1D5DB" }}
                            />
                            <Label htmlFor="agreement" className="text-xs font-normal leading-relaxed cursor-pointer" style={{ color: "#64748B" }}>
                                By creating an account, you agree to the Skilled Core{" "}
                                <Link href="/legal/user-agreement" className="hover:underline" style={{ color: "#6366F1" }} target="_blank">User Agreement</Link>,{" "}
                                <Link href="/terms" className="hover:underline" style={{ color: "#6366F1" }} target="_blank">Terms of Service</Link>,{" "}
                                <Link href="/legal/privacy-policy" className="hover:underline" style={{ color: "#6366F1" }} target="_blank">Privacy Policy</Link>, and{" "}
                                <Link href="/legal/cookie-policy" className="hover:underline" style={{ color: "#6366F1" }} target="_blank">Cookie Policy</Link>.
                            </Label>
                        </div>

                        <button
                            id="register-submit-btn"
                            type="submit"
                            disabled={!!isLoading || !turnstileToken}
                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }}
                        >
                            {isLoading === 'email' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Account"}
                        </button>
                    </form>

                    <div className="text-center text-sm mt-5">
                        <span style={{ color: "#94A3B8" }}>Already have an account? </span>
                        <Link href="/login" className="font-bold transition-colors" style={{ color: "#6366F1" }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
