"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Briefcase, Plus, User, BrainCircuit, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
    { label: "Home", icon: Home, path: "/feed" },
    { label: "Network", icon: Users, path: "/network" },
    // Center button is handled separately
    { label: "AI Interview", icon: MessageSquarePlus, path: "/interview" },
    { label: "Jobs", icon: Briefcase, path: "/jobs" },
    { label: "Profile", icon: User, path: "/profile/me" },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-6 inset-x-4 h-16 rounded-full bg-zinc-900/90 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md z-50 flex items-center justify-between px-6 lg:hidden">

            {/* Left Items */}
            {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => {
                const isActive = pathname.startsWith(item.path);
                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-colors",
                            isActive ? "text-violet-400" : "text-zinc-500"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5", isActive && "fill-current opacity-50")} />
                        {/* Mobile Badges */}
                        {item.label === "Network" && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-900" />
                        )}
                    </Link>
                );
            })}

            {/* Floating Operations Button (FAB) */}
            <div className="relative -top-6">
                <button className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform border-4 border-zinc-950">
                    <Plus className="w-7 h-7" />
                </button>
            </div>

            {/* Right Items */}
            {MOBILE_NAV_ITEMS.slice(2, 5).map((item) => {
                const isActive = pathname.startsWith(item.path);
                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-colors",
                            isActive ? "text-violet-400" : "text-zinc-500"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5", isActive && "fill-current opacity-50")} />
                        {/* Mobile Badges */}
                        {item.label === "Network" && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-900" />
                        )}
                        {item.label === "Jobs" && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-zinc-900" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
