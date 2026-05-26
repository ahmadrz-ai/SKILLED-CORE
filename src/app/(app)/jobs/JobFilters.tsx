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
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 sticky top-24 shadow-sm">
            <div className="flex items-center justify-between text-[#111827] font-semibold">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#6366F1]" />
                    Filters
                </div>
                {(query || type !== "All" || remote) && (
                    <button
                        onClick={() => { setQuery(""); setType("All"); setRemote(false); }}
                        className="text-xs text-[#9CA3AF] hover:text-[#374151] flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6B7280] uppercase">Keywords</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-9 pr-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                        placeholder="Role, Tech, Company..."
                    />
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F3F4F6]">
                <label className="text-xs font-semibold text-[#6B7280] uppercase block">Job Type</label>
                <div className="flex flex-wrap gap-1.5">
                    {["All", "Full-time", "Contract", "Internship"].map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${type === t
                                    ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
                                    : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F3F4F6]">
                <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-[#374151] font-medium">Remote Only</span>
                    <button
                        onClick={() => setRemote(!remote)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${remote ? "bg-[#4F46E5]" : "bg-[#D1D5DB]"}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${remote ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}
