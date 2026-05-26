'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
    Search, Home, Settings, User, Briefcase,
    MessageSquare, LogOut, CreditCard, X, Users,
    PlusCircle, Sparkles, DollarSign, BookOpen, BarChart, MessageSquarePlus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { logout } from "@/app/actions/authActions";

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = useState('');

    const { data: session } = useSession();

    // Toggle logic (Cmd+K / Ctrl+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Brand top accent bar */}
                <div className="w-full h-1" style={{ background: "linear-gradient(90deg, #6366F1, #06B6D4)" }} />

                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 z-50 p-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors compact-btn"
                >
                    <X className="w-4 h-4" />
                </button>

                <Command className="w-full bg-transparent">
                    {/* INPUT */}
                    <div className="flex items-center border-b border-zinc-100 px-4 bg-zinc-50/50">
                        <Search className="mr-2.5 h-5 w-5 shrink-0 text-zinc-400" />
                        <Command.Input
                            placeholder="Search SkilledCore or type a command..."
                            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                            value={query}
                            onValueChange={setQuery}
                        />
                    </div>

                    {/* LIST */}
                    <Command.List className="max-h-[50vh] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                        <Command.Empty className="py-6 text-center text-sm text-zinc-500 font-sans">
                            {query ? (
                                <button
                                    onClick={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(query)}`))}
                                    className="flex items-center justify-center gap-2 w-full p-2 hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                                >
                                    <Search className="w-4 h-4 text-[#6366F1]" />
                                    Search global catalog for "{query}"
                                </button>
                            ) : "No match profiles or signals found."}
                        </Command.Empty>

                        {query && (
                            <Command.Group heading="Global Sourcing" className="text-[10px] font-bold text-zinc-400 px-3 py-1.5 uppercase tracking-wider">
                                <CommandItem icon={Search} onSelect={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(query)}`))}>
                                    Run Global Search for "{query}"
                                </CommandItem>
                            </Command.Group>
                        )}

                        <Command.Group heading="Navigation" className="text-[10px] font-bold text-zinc-400 px-3 py-1.5 uppercase tracking-wider mt-1">
                            <CommandItem icon={Home} onSelect={() => runCommand(() => router.push('/feed'))}>
                                Home
                            </CommandItem>
                            <CommandItem icon={Users} onSelect={() => runCommand(() => router.push('/network'))}>
                                Network
                            </CommandItem>
                            <CommandItem icon={Users} onSelect={() => runCommand(() => router.push('/hire/search'))}>
                                Find Talent (Sourcing)
                            </CommandItem>
                            <CommandItem icon={Briefcase} onSelect={() => runCommand(() => router.push('/jobs'))}>
                                Jobs
                            </CommandItem>
                            <CommandItem icon={PlusCircle} onSelect={() => runCommand(() => router.push('/jobs/create'))}>
                                Post Job
                            </CommandItem>
                            <CommandItem icon={MessageSquarePlus} onSelect={() => runCommand(() => router.push('/interview'))}>
                                AI Interview Sandbox
                            </CommandItem>
                            <CommandItem icon={DollarSign} onSelect={() => runCommand(() => router.push('/salary'))}>
                                Salary Benchmarks
                            </CommandItem>
                            <CommandItem icon={BookOpen} onSelect={() => runCommand(() => router.push('/learning'))}>
                                Learning Dashboard
                            </CommandItem>
                            <CommandItem icon={MessageSquare} onSelect={() => runCommand(() => router.push('/messages'))}>
                                Messages
                            </CommandItem>
                            <CommandItem icon={BarChart} onSelect={() => runCommand(() => router.push('/analytics'))}>
                                Analytics
                            </CommandItem>
                            <CommandItem icon={CreditCard} onSelect={() => runCommand(() => router.push('/credits'))}>
                                Credits & Billing
                            </CommandItem>
                            <CommandItem icon={User} onSelect={() => runCommand(() => router.push('/profile/me'))}>
                                View Profile
                            </CommandItem>
                            <CommandItem icon={Settings} onSelect={() => runCommand(() => router.push('/settings'))}>
                                Settings
                            </CommandItem>
                        </Command.Group>

                        <Command.Group heading="System" className="text-[10px] font-bold text-zinc-400 px-3 py-1.5 uppercase tracking-wider mt-2 border-t border-zinc-100 pt-2">
                            <CommandItem icon={LogOut} onSelect={() => runCommand(handleLogout)}>
                                Disconnect Session
                            </CommandItem>
                        </Command.Group>

                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

// Helper for Items
function CommandItem({ children, icon: Icon, onSelect }: { children: React.ReactNode, icon: any, onSelect: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center px-3.5 py-2.5 rounded-lg text-sm text-zinc-600 hover:bg-[#EEF2FF] hover:text-[#4F46E5] aria-selected:bg-[#EEF2FF] aria-selected:text-[#4F46E5] aria-selected:border-l-2 aria-selected:border-[#6366F1] cursor-pointer transition-all duration-100 border-l-2 border-transparent pl-3"
        >
            <Icon className="mr-3 h-4 w-4 shrink-0" />
            {children}
        </Command.Item>
    );
}
