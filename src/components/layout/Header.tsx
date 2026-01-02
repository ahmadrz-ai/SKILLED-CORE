"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, ChevronRight, Menu, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "../NotificationBell";

import { PaymentModal } from "@/components/credits/PaymentModal";

interface HeaderProps {
    credits?: number;
}

export function Header({ credits = 0 }: HeaderProps) {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    // Mock Breadcrumb generation
    const breadcrumbs = segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
            <div key={segment} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-zinc-600 mx-2" />}
                <span className={cn(
                    "text-sm capitalize font-medium",
                    isLast ? "text-white" : "text-zinc-500"
                )}>
                    {(() => {
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
                        if (isUUID) {
                            const prev = segments[index - 1];
                            if (prev === 'jobs') return "Job Details";
                            if (prev === 'profile') return "Profile";
                            return "Details";
                        }
                        return segment.replace(/-/g, ' ');
                    })()}
                </span>
            </div>
        );
    });

    return (
        <header className="sticky top-0 z-40 h-16 border-b border-white/5 bg-transparent backdrop-blur-xl flex items-center justify-between px-4 lg:px-8">

            {/* Left: Mobile Menu Trigger & Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden md:flex items-center">
                    <span className="text-sm font-mono text-zinc-600 mr-2">/</span>
                    <span className="text-sm text-zinc-500 font-medium">App</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 mx-2" />
                    {breadcrumbs.length > 0 ? breadcrumbs : <span className="text-sm text-white font-medium">Home</span>}
                </div>

                {/* Mobile Title if crumbs hidden */}
                <div className="md:hidden">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                        {segments[segments.length - 1]?.replace(/-/g, ' ') || 'SHADOW'}
                    </span>
                </div>
            </div>

            {/* Center: Global Search Input */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8 relative z-50">
                <SearchInput />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <a
                    href="/feedback"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors text-xs font-medium border border-white/5"
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Feedback</span>
                </a>

                <NotificationBell />

                {/* Credits / Billing */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10">
                    <span className="text-xs font-bold text-zinc-300">{credits} Credits</span>
                    <PaymentModal />
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 md:hidden" />
            </div>
        </header>
    );
}

// Separate component for complex search logic
import { useState, useRef, useEffect } from "react";
import { getSearchSuggestions } from "@/app/actions/search";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash, Loader2 } from "lucide-react";

function SearchInput() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<{ users: any[], tags: string[] }>({ users: [], tags: [] });
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Simple debounce effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                try {
                    const data = await getSearchSuggestions(query);
                    setSuggestions(data);
                    setIsOpen(true);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions({ users: [], tags: [] });
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (term: string) => {
        setIsOpen(false);
        setQuery(term);
        router.push(`/search?q=${encodeURIComponent(term)}`);
    };

    return (
        <div ref={containerRef} className="w-full relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-focus-within:text-violet-400 transition-colors">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (suggestions.users.length > 0 || suggestions.tags.length > 0) setIsOpen(true); }}
                placeholder="Search users, hashtags, protocols..."
                className="w-full bg-zinc-900/50 border border-white/10 rounded-md py-2.5 pl-10 pr-16 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all hover:bg-zinc-900/80 shadow-sm"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                        handleSearch(query);
                    }
                }}
            />
            <button
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center bg-zinc-800 hover:bg-zinc-700 border border-white/5 px-1.5 py-1 rounded cursor-pointer transition-colors"
            >
                <span className="text-[10px] font-medium text-zinc-500">Ctrl</span>
                <span className="text-[10px] font-medium text-zinc-500">K</span>
            </button>

            {/* Suggestions Dropdown */}
            {isOpen && (suggestions.users.length > 0 || suggestions.tags.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 divide-y divide-white/5">

                    {/* Users Section */}
                    {suggestions.users.length > 0 && (
                        <div className="p-2">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase px-2 mb-1">Operatives</h3>
                            {suggestions.users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        router.push(`/profile/${user.username || user.id}`);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                                >
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">@{user.username}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tags Section */}
                    {suggestions.tags.length > 0 && (
                        <div className="p-2 bg-black/20">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase px-2 mb-1">Hashtags</h3>
                            {suggestions.tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleSearch(`#${tag}`)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                                        <Hash className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm text-zinc-300 group-hover:text-violet-200 transition-colors">#{tag}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
