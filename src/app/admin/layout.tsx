"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard, Users, Shield, AlertTriangle, Activity, CreditCard,
    ArrowLeft, Lock, Loader2, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendingReportsCount } from "./actions";

const ADMIN_MENU = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: Users, label: "User Base", href: "/admin/users" },
    { icon: Brain, label: "AI Interviews", href: "/admin/interviews" },
    { icon: Shield, label: "Verifications", href: "/admin/verifications" },
    { icon: AlertTriangle, label: "Reports", href: "/admin/reports" },
    { icon: Activity, label: "System Health", href: "/admin/health" },
    { icon: CreditCard, label: "Billing Requests", href: "/admin/billing" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pendingReports, setPendingReports] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            router.replace('/login');
            return;
        }

        // @ts-ignore - Role is added in auth.config
        if (session?.user?.role !== 'ADMIN') {
            router.replace('/feed');
            return;
        }

        setIsAuthorized(true);

        const fetchCount = () => {
            getPendingReportsCount().then(res => {
                if (res.success) setPendingReports(res.count);
            });
        };

        fetchCount(); // Initial fetch
        const interval = setInterval(fetchCount, 5000); // Poll every 5s

        return () => clearInterval(interval);

    }, [session, status, router]);

    if (status === 'loading' || !isAuthorized) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <h2 className="text-zinc-400 font-sans tracking-wide text-sm font-medium">Verifying access permissions...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex">

            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-zinc-800/80 flex flex-col fixed h-full bg-zinc-950/40 backdrop-blur-xl z-50">
                <div className="p-6 border-b border-zinc-800/50 flex flex-col gap-1">
                    <div className="flex items-center gap-2.5 text-violet-500">
                        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <Shield className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="font-sans font-black tracking-tight text-white text-base">SKILLEDCORE</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans font-semibold mt-1">
                        Admin Console
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {ADMIN_MENU.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group relative border border-transparent",
                                    isActive
                                        ? "bg-violet-500/10 text-violet-400 border-violet-500/20 font-medium"
                                        : "hover:bg-zinc-900/50 hover:text-white text-zinc-400"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                                <span className="flex-1">{item.label}</span>
                                {item.label === "Reports" && pendingReports > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                                        {pendingReports}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800/50">
                    <button
                        onClick={() => router.push('/feed')}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 w-full transition-all border border-transparent hover:border-zinc-800/80"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Platform
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 relative min-h-screen bg-zinc-950">
                <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                    {children}
                </div>
                {/* Subtle premium violet background glow */}
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-violet-900/5 blur-[130px] pointer-events-none" />
                <div className="fixed bottom-0 left-64 w-[400px] h-[400px] bg-zinc-900/10 blur-[100px] pointer-events-none" />
            </main>
        </div>
    );
}
