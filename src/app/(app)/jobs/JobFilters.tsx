"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Briefcase, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming hook exists, if not I'll create custom local debounce

export default function JobFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [query, setQuery] = useState(searchParams.get("query") || "");
    const [type, setType] = useState(searchParams.get("type") || "All");
    const [remote, setRemote] = useState(searchParams.get("remote") === "true");

    // Custom debounce
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedQuery) params.set("query", debouncedQuery);
        else params.delete("query");

        if (type && type !== "All") params.set("type", type);
        else params.delete("type");

        if (remote) params.set("remote", "true");
        else params.delete("remote");

        router.replace(`${pathname}?${params.toString()}`);
    }, [debouncedQuery, type, remote, router, pathname]);

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between text-teal-400 font-bold">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                </div>
                {(query || type !== "All" || remote) && (
                    <button
                        onClick={() => { setQuery(""); setType("All"); setRemote(false); }}
                        className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-500 uppercase">Keywords</label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-teal-500/50 transition-all"
                        placeholder="Role, Tech, Company..."
                    />
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <label className="text-xs font-mono text-zinc-500 uppercase block">Job Type</label>
                <div className="flex flex-wrap gap-2">
                    {["All", "Full-time", "Contract", "Internship"].map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${type === t
                                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                                    : "bg-zinc-800 text-zinc-400 border border-white/5 hover:border-white/20"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-zinc-300">Remote Only</span>
                    <button
                        onClick={() => setRemote(!remote)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors ${remote ? "bg-teal-600" : "bg-zinc-700"}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${remote ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}
