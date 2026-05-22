"use client";

import { Search, Sparkles, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SmartSearchBarProps {
    query: string;
    onSearchChange: (query: string) => void;
}

export function SmartSearchBar({ query, onSearchChange }: SmartSearchBarProps) {
    const [isAiMode, setIsAiMode] = useState(true);

    const handleSearchClick = () => {
        // Now real-time, no longer requires search button to actuate data, but kept for UX
        toast.success("Searching candidates...");
    };

    const handleSaveAlert = () => {
        toast.success("Search alert saved successfully!");
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-3">
            <div className="relative group">
                <div className={cn(
                    "absolute -inset-1 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200",
                    isAiMode ? "bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" : "bg-gradient-to-r from-[#E5E7EB] to-[#9CA3AF]"
                )} />
                <div className="relative flex items-center bg-white border border-[#E5E7EB] rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#7C3AED]/20 focus-within:border-[#7C3AED] transition-all">

                    {/* Search Icon / AI Trigger */}
                    <div className="pl-3 pr-2">
                        {isAiMode ? (
                            <Sparkles className="w-5 h-5 text-[#7C3AED] animate-pulse" />
                        ) : (
                            <Search className="w-5 h-5 text-[#9CA3AF]" />
                        )}
                    </div>

                    {/* Input Field */}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={isAiMode ? "Describe the ideal candidate (e.g., 'Senior React Dev who knows Python and has startup experience')..." : "Search by keywords, title, or boolean logic..."}
                        className="flex-1 bg-transparent border-none text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 h-10 text-sm md:text-base font-medium"
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-1">
                        {query && (
                            <button onClick={() => onSearchChange("")} className="p-1 hover:bg-[#F3F4F6] rounded-full text-[#9CA3AF]">
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        <div className="h-6 w-px bg-[#E5E7EB] mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAiMode(!isAiMode)}
                            className={cn(
                                "flex items-center gap-2 text-xs font-mono border",
                                isAiMode ? "bg-[#7C3AED]/10 border-[#7C3AED]/20 text-[#7C3AED]" : "bg-[#F3F4F6] border-transparent text-[#6B7280] hover:bg-[#E5E7EB]"
                            )}
                        >
                            {isAiMode ? "AI ACTIVE" : "KEYWORD"}
                        </Button>

                        <Button 
                            size="default" 
                            onClick={handleSearchClick}
                            className={cn(
                                "font-bold shadow-md transition-all",
                                isAiMode ? "bg-[#7C3AED] !text-white hover:bg-[#6D28D9]" : "bg-[#6D28D9] !text-white hover:bg-[#5B21B6]"
                            )}
                        >
                            SEARCH
                        </Button>
                    </div>
                </div>
            </div>

            {/* Helper Text / Save Search */}
            <div className="flex justify-between items-center px-2">
                <p className="text-xs text-[#6B7280] italic">
                    {isAiMode
                        ? "✨ AI Semantic Search enabled. Typing naturally works best."
                        : "Boolean logic supported: (React AND Node) OR (Python AND Django)"}
                </p>
                <button onClick={handleSaveAlert} className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#7C3AED] transition-colors">
                    <Save className="w-3 h-3" />
                    <span>Save Search Alert</span>
                </button>
            </div>
        </div>
    );
}
