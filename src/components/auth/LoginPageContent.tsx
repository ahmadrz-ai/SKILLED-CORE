"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Github, Loader2, Eye, EyeOff, User, Lock, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QodeeLogo } from "@/components/QodeeLogo";

// Custom Google Icon
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
            const res = await signIn("credentials", {
                email: identifier,
                password,
                redirect: false,
                callbackUrl: "/feed"
            });

            if (res?.error) {
                setError("Invalid credentials. Please try again.");
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
        <div className="min-h-screen w-full flex bg-obsidian text-white">

            {/* LEFT SIDE - BRAND & QUOTE */}
            <div className="hidden lg:flex w-1/2 bg-[#020204] relative overflow-hidden flex-col justify-between p-12 border-r border-white/5">
                {/* Background ambient effects */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),transparent_70%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full opacity-20" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <QodeeLogo className="w-12 h-12 object-contain" />
                    <div>
                        <h3 className="font-heading font-black tracking-widest text-lg">SKILLED CORE</h3>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Enterprise Node</p>
                    </div>
                </div>

                {/* Quote */}
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-heading font-bold leading-tight tracking-tight mb-6">
                        "Access the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">network</span>."
                    </h1>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-xs text-zinc-600 font-mono uppercase tracking-widest">
                    Secure Connection • AES-256 Encryption
                </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="max-w-md w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">

                    <div className="text-center space-y-2 mb-8">
                        <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
                        <p className="text-sm text-zinc-400">Enter your credentials to access the system.</p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white h-11"
                            onClick={() => handleSocialLogin('google')}
                        >
                            <span className="mr-2"><GoogleIcon /></span> Google
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white h-11"
                            onClick={() => handleSocialLogin('github')}
                        >
                            <Github className="w-4 h-4 mr-2" /> GitHub
                        </Button>
                    </div>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-obsidian px-2 text-zinc-500">Or sign in with email</span>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier" className="text-zinc-300">Email or Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    id="identifier"
                                    placeholder="username or email"
                                    className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 transition-colors"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 transition-colors"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={!!isLoading}
                            className="w-full h-11 bg-yellow-600 hover:bg-yellow-500 text-white font-bold tracking-wide transition-all shadow-lg shadow-yellow-500/20"
                        >
                            {isLoading === 'credentials' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                        </Button>
                    </form>

                    <div className="text-center text-sm mt-8">
                        <span className="text-zinc-500">New Operative? </span>
                        <Link href="/register" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
                            Initialize Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
