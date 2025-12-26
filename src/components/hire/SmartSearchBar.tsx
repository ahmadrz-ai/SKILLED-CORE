"use client";

import { Search, Sparkles, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SmartSearchBar() {
    const [query, setQuery] = useState("");
    const [isAiMode, setIsAiMode] = useState(true);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-3">
            <div className="relative group">
                <div className={cn(
                    "absolute -inset-1 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200",
                    isAiMode ? "bg-gradient-to-r from-violet-600 to-cyan-600" : "bg-gradient-to-r from-zinc-600 to-zinc-400"
                )} />
                <div className="relative flex items-center bg-zinc-950 border border-white/10 rounded-xl p-2 shadow-2xl">

                    {/* Search Icon / AI Trigger */}
                    <div className="pl-3 pr-2">
                        {isAiMode ? (
                            <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                        ) : (
                            <Search className="w-5 h-5 text-zinc-500" />
                        )}
                    </div>

                    {/* Input Field */}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isAiMode ? "Describe the ideal candidate (e.g., 'Senior React Dev who knows Python and has startup experience')..." : "Search by keywords, title, or boolean logic..."}
                        className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 h-10 text-sm md:text-base font-medium"
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-1">
                        {query && (
                            <button onClick={() => setQuery("")} className="p-1 hover:bg-white/10 rounded-full text-zinc-500">
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAiMode(!isAiMode)}
                            className={cn(
                                "flex items-center gap-2 text-xs font-mono border",
                                isAiMode ? "bg-violet-500/10 border-violet-500/20 text-violet-300" : "bg-zinc-800 border-transparent text-zinc-400"
                            )}
                        >
                            {isAiMode ? "AI ACTIVE" : "KEYWORD"}
                        </Button>

                        <Button size="default" className={cn(
                            "font-bold shadow-lg transition-all",
                            isAiMode ? "bg-white text-black hover:bg-zinc-200 shadow-white/10" : "bg-zinc-800 text-white hover:bg-zinc-700"
                        )}>
                            SEARCH
                        </Button>
                    </div>
                </div>
            </div>

            {/* Helper Text / Save Search */}
            <div className="flex justify-between items-center px-2">
                <p className="text-xs text-zinc-500 italic">
                    {isAiMode
                        ? "✨ AI Semantic Search enabled. Typing naturally works best."
                        : "Boolean logic supported: (React AND Node) OR (Python AND Django)"}
                </p>
                <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                    <Save className="w-3 h-3" />
                    <span>Save Search Alert</span>
                </button>
            </div>
        </div>
    );
}
