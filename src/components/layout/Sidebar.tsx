"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import React from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import {
    Home, Users, Briefcase, MessageSquare, BarChart, CreditCard,
    MoreHorizontal, LogOut, Settings, BrainCircuit, PlusCircle, Sparkles, DollarSign,
    BookOpen, FileText, MessageSquarePlus, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/credits/PlanBadge";
import { QodeeLogo } from "@/components/QodeeLogo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
    { label: "Home", icon: Home, path: "/feed" },
    { label: "Network", icon: Users, path: "/network" },
    { label: "Find Talent", icon: Users, path: "/hire/search", highlightRole: 'RECRUITER' },
    { label: "Jobs", icon: Briefcase, path: "/jobs" },
    { label: "Post Job", icon: PlusCircle, path: "/jobs/create", role: 'RECRUITER' },
    { label: "AI Interview", icon: MessageSquarePlus, path: "/interview", highlight: true },
    { label: "Salary", icon: DollarSign, path: "/salary" },
    { label: "Learning", icon: BookOpen, path: "/learning" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
    { label: "Analytics", icon: BarChart, path: "/analytics" },
    { label: "Credits", icon: CreditCard, path: "/credits" },
];

// Define props interface
interface SidebarProps {
    counts?: {
        network?: number;
        messages?: number;
        notifications?: number;
        jobs?: number;
        learning?: number;
        analytics?: boolean;
        salary?: boolean;
    };
    plan?: string;
}

export function Sidebar({ counts, plan }: SidebarProps) {
    const pathname = usePathname();
    // Role Mock Removed for Production Sync

    // Data
    const { data: session } = useSession();
    const user = session?.user;

    // Guards
    const recruiterGuard = useRoleGuard('RECRUITER');

    const handleProtectedNav = (e: React.MouseEvent, path: string, required: 'RECRUITER') => {
        if (required === 'RECRUITER' && !recruiterGuard.isAuthorized) {
            e.preventDefault();
            recruiterGuard.triggerDenial();
        }
    };

    // State for clearing notifications on click
    const [clearedBadges, setClearedBadges] = React.useState<string[]>([]);

    const handleBadgeClick = (key: string) => {
        if (!clearedBadges.includes(key)) {
            setClearedBadges(prev => [...prev, key]);
        }
    };

    return (
        <aside className="hidden lg:flex w-64 h-screen flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl fixed left-0 top-0 z-50">
            {/* BRAND */}
            <div className="p-6 flex items-center gap-3">
                <QodeeLogo className="w-10 h-10 object-contain" />
                <div className="flex flex-col">
                    <span className="font-heading font-black tracking-wider text-white text-sm">SKILLED CORE</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Enterprise Node</span>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-4 space-y-2 py-6">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    const isProtected = ['/jobs/create', '/hire/search'].includes(item.path);

                    // ROLE VISIBILITY CHECK
                    // @ts-ignore - Check if item has role constraint
                    if (item.role && (user as any)?.role !== item.role && (user as any)?.role !== 'ADMIN') {
                        return null;
                    }

                    // HIGHLIGHT LOGIC
                    // @ts-ignore
                    const showHighlight = item.highlight || (item.highlightRole && (user as any)?.role === item.highlightRole) || (item.highlightRole === 'ULTRA' && plan === 'ULTRA');


                    // REAL NOTIFICATIONS FROM PROPS
                    const badges = {
                        jobs: counts?.jobs || 0,
                        salary: counts?.salary || false,
                        learning: counts?.learning || 0,
                        analytics: counts?.analytics || false,
                        credits: (user as any)?.credits && (user as any).credits < 3 ? 'low' : null,
                        network: counts?.network || 0,
                        messages: counts?.messages || 0,
                        notifications: counts?.notifications || 0
                    };

                    // Filter out cleared badges
                    const badgeKey = item.label.toLowerCase();
                    const badgeValue = !clearedBadges.includes(badgeKey) ? badges[badgeKey as keyof typeof badges] : null;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={(e) => {
                                handleBadgeClick(badgeKey);
                                if (isProtected) handleProtectedNav(e, item.path, 'RECRUITER');
                            }}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-violet-400 bg-violet-500/10"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500 shadow-[0_0_10px_#8b5cf6]" />
                            )}

                            <div className="relative">
                                <item.icon className={cn(
                                    "w-4 h-4 transition-colors",
                                    isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-white"
                                )} />
                                {showHighlight && (
                                    <Sparkles className="absolute -top-2 -right-2 w-3 h-3 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" fill="currentColor" />
                                )}
                            </div>

                            {item.label}

                            {/* BADGES */}
                            {item.label === "Network" && !!badgeValue && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    {badgeValue}
                                </span>
                            )}
                            {item.label === "Notifications" && !!badgeValue && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    {badgeValue}
                                </span>
                            )}
                            {item.label === "Jobs" && !!badgeValue && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                    {badgeValue}
                                </span>
                            )}
                            {item.label === "Salary" && badgeValue && (
                                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            )}
                            {item.label === "Learning" && !!badgeValue && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                    {badgeValue}
                                </span>
                            )}
                            {item.label === "Messages" && !!badgeValue && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    {badgeValue}
                                </span>
                            )}
                            {item.label === "Analytics" && badgeValue && (
                                <span className="ml-auto h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                            )}
                            {item.label === "Credits" && badgeValue === 'low' && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-900 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse">
                                    !
                                </span>
                            )}

                            {isProtected && !recruiterGuard.isAuthorized && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* DEV ROLE SWITCHER REMOVED FOR PROD */}

            {/* USER PROFILE */}
            <div className="p-4 border-t border-white/5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors group">
                            <Avatar className="h-9 w-9 border border-white/10 group-hover:border-violet-500/50 transition-colors">
                                <AvatarImage src={user?.image || "https://github.com/shadcn.png"} alt={user?.name || "User"} />
                                <AvatarFallback>
                                    {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                                    {user?.name || 'User'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {user?.role && (
                                        <div className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                                            {user.role}
                                        </div>
                                    )}
                                    <PlanBadge plan={plan} />
                                </div>
                            </div>
                            <MoreHorizontal className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10 text-zinc-300">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                            <Link href="/profile/me">
                                <Users className="w-4 h-4 mr-2" /> Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                            <Link href="/settings">
                                <Settings className="w-4 h-4 mr-2" /> Settings
                            </Link>
                        </DropdownMenuItem>


                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
