"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, Briefcase, Settings, Globe, Home, PlusCircle, ShieldAlert, BookOpen, Activity, MessageSquare, Building2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

const CANDIDATE_MENU = [
    { icon: Home, label: "Home", href: "/feed" },
    { icon: Briefcase, label: "Jobs", href: "/jobs" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Users, label: "Network", href: "/network" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: BookOpen, label: "Support", href: "/support" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

const RECRUITER_MENU = [
    { icon: Home, label: "Home", href: "/feed" },
    { icon: Users, label: "Hire People", href: "/hire" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: PlusCircle, label: "Post a Job", href: "/jobs/create" },
    { icon: Building2, label: "Company", href: "/profile/me" },
    { icon: CreditCard, label: "Capital", href: "/billing" },
];

export function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');

    const menuItems = role === 'candidate' ? CANDIDATE_MENU : RECRUITER_MENU;

    const toggleRole = () => {
        setRole(prev => prev === 'candidate' ? 'recruiter' : 'candidate');
    };

    return (
        <motion.div
            className={cn(
                "fixed left-0 top-0 h-full bg-charcoal/80 backdrop-blur-md border-r border-white/5 flex flex-col items-center py-8 z-40 transition-all duration-300",
                isExpanded ? "w-60" : "w-16"
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="mb-10 w-full flex justify-center">
                <Link href="/feed">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-teal-500 shadow-lg shadow-violet-500/20 flex items-center justify-center cursor-pointer relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                </Link>
            </div>

            <nav className="space-y-2 flex-1 w-full px-3 flex flex-col items-center">
                {menuItems.map((item, i) => (
                    <Link key={i} href={item.href} className="w-full">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "group relative p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center cursor-pointer overflow-hidden",
                                "text-zinc-600 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-6 h-6 min-w-[24px] transition-colors",
                                role === 'recruiter' ? "group-hover:text-teal-400" : "group-hover:text-violet-400"
                            )} />

                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="ml-4 text-sm font-medium whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}

                            {/* Role specialized glow */}
                            <div className={cn(
                                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 blur-xl transition-all pointer-events-none",
                                role === 'recruiter' ? "bg-teal-500" : "bg-violet-500"
                            )} />
                        </motion.div>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto pb-4 w-full px-3 space-y-4 flex flex-col items-center">

                {/* Notification Bell */}
                <NotificationBell />

                {/* Role Switcher (Demo Only) */}
                {isExpanded && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={toggleRole}
                        className={cn(
                            "w-full py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2",
                            role === 'candidate'
                                ? "border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                                : "border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                        )}
                    >
                        <ShieldAlert className="w-3 h-3" />
                        {role === 'candidate' ? "VIEW AS RECRUITER" : "VIEW AS CANDIDATE"}
                    </motion.button>
                )}

                {/* User Avatar */}
                <div className="flex justify-center w-full">
                    <Link href="/profile/me">
                        <div className={cn(
                            "w-10 h-10 rounded-full bg-zinc-800 border-2 cursor-pointer transition-all shadow-lg overflow-hidden relative group",
                            role === 'candidate' ? "border-violet-500/30 hover:border-violet-500" : "border-teal-500/30 hover:border-teal-500"
                        )}>
                            {/* Avatar Image Placeholder */}
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <Users className={cn(
                                    "w-5 h-5 transition-colors",
                                    role === 'candidate' ? "text-violet-400" : "text-teal-400"
                                )} />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
