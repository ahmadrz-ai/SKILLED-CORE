'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
    Search, Home, Settings, User, Briefcase,
    MessageSquare, LogOut, CreditCard, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = useState('');

    const { data: session } = useSession();

    // Toggle logic (Cmd+K)
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
        await signOut({ callbackUrl: '/login' });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 z-50 p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                <Command className="w-full bg-transparent">
                    {/* INPUT */}
                    <div className="flex items-center border-b border-white/10 px-4">
                        <Search className="mr-2 h-5 w-5 shrink-0 text-zinc-500" />
                        <Command.Input
                            placeholder="Where to, Commander?"
                            className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                            value={query}
                            onValueChange={setQuery}
                        />
                    </div>

                    {/* LIST */}
                    <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2">
                        <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                            {query ? (
                                <button
                                    onClick={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(query)}`))}
                                    className="flex items-center justify-center gap-2 w-full p-2 hover:text-violet-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                                >
                                    <Search className="w-4 h-4" />
                                    Search Global Network for "{query}"
                                </button>
                            ) : "No signals found."}
                        </Command.Empty>

                        {query && (
                            <Command.Group heading="Global Protocol" className="text-xs font-bold text-zinc-500 px-2 py-2">
                                <CommandItem icon={Search} onSelect={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(query)}`))}>
                                    Search for "{query}"
                                </CommandItem>
                            </Command.Group>
                        )}

                        <Command.Group heading="Navigation" className="text-xs font-bold text-zinc-500 px-2 py-2">
                            <CommandItem icon={Home} onSelect={() => runCommand(() => router.push('/feed'))}>
                                Home
                            </CommandItem>
                            <CommandItem icon={Settings} onSelect={() => runCommand(() => router.push('/settings'))}>
                                Settings
                            </CommandItem>
                            <CommandItem icon={CreditCard} onSelect={() => runCommand(() => toast.info("Billing System Offline"))}>
                                Billing & Capital
                            </CommandItem>
                            <CommandItem icon={MessageSquare} onSelect={() => runCommand(() => router.push('/messages'))}>
                                Messages
                            </CommandItem>
                            <CommandItem icon={Briefcase} onSelect={() => runCommand(() => router.push('/jobs'))}>
                                Jobs
                            </CommandItem>
                            <CommandItem icon={User} onSelect={() => runCommand(() => router.push('/profile'))}>
                                View Profile
                            </CommandItem>
                        </Command.Group>

                        <Command.Group heading="System" className="text-xs font-bold text-zinc-500 px-2 py-2 mt-2 border-t border-white/5 pt-2">
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
            className="flex items-center px-4 py-3 rounded-md text-sm text-zinc-300 aria-selected:bg-violet-600/20 aria-selected:text-violet-200 aria-selected:border-l-2 aria-selected:border-violet-500 cursor-pointer transition-all"
        >
            <Icon className="mr-3 h-4 w-4" />
            {children}
        </Command.Item>
    );
}
