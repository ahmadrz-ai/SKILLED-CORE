"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
    LayoutDashboard, Users, Shield, AlertTriangle, Activity, CreditCard,
    LogOut, Lock, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { getPendingReportsCount } from "./actions";

const ADMIN_MENU = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: Users, label: "User Base", href: "/admin/users" },
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
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
                <Lock className="w-12 h-12 text-red-600 animate-pulse" />
                <h2 className="text-red-500 font-mono tracking-widest text-sm">VERIFYING CLEARANCE...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-zinc-300 font-sans flex">

            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col fixed h-full bg-zinc-950/50 backdrop-blur-xl z-50">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-red-600">
                        <Shield className="w-6 h-6" />
                        <span className="font-heading font-black tracking-wider text-white">OVERSEER</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-red-500/50 mt-1 font-mono">
                        Level 5 Clearance
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
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group relative",
                                    isActive
                                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                        : "hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-red-500" : "text-zinc-500 group-hover:text-white")} />
                                <span className="flex-1">{item.label}</span>
                                {item.label === "Reports" && pendingReports > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                        {pendingReports}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => router.push('/feed')}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 w-full transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit Protocol
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 bg-grid-pattern relative">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
                {/* Subtle red background glow */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-900/5 blur-[120px] pointer-events-none" />
            </main>
        </div>
    );
}
