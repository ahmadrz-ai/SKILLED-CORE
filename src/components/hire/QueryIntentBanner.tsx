import { Sparkles, X } from "lucide-react";

interface Requirement {
    priority: number;
    label: string;
    searchTerms: string[];
    type: "primary" | "secondary" | "contextual";
    experienceLevel: "any" | "junior" | "mid" | "senior" | "expert" | null;
    notes: string;
}

interface QueryIntentBannerProps {
    queryIntent: string;
    requirements: Requirement[];
    onClose: () => void;
}

export function QueryIntentBanner({ queryIntent, requirements, onClose }: QueryIntentBannerProps) {
    return (
        <div className="relative bg-[#F5F3FF] border border-[#D4CCF8] rounded-xl px-5 py-4 flex items-start gap-3 mb-6 shadow-sm">
            {/* Sparkles Icon */}
            <Sparkles className="w-5 h-5 text-[#5B35D5] mt-0.5 flex-shrink-0 animate-pulse" />

            {/* Content info */}
            <div className="flex-1 space-y-3 pr-6">
                <div>
                    <h4 className="text-sm font-bold text-[#4A28C9]">
                        AI understood your search
                    </h4>
                    <p className="text-xs text-[#5B35D5] leading-relaxed mt-0.5">
                        "{queryIntent}"
                    </p>
                </div>

                {/* Priority chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {requirements.map((req, i) => {
                        const isP1 = req.priority === 1;
                        return (
                            <span 
                                key={i}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                                    isP1 
                                        ? "bg-[#5B35D5] text-white shadow-sm" 
                                        : "bg-white text-[#5B35D5] border border-[#D4CCF8]"
                                )}
                            >
                                P{req.priority}: {req.label}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Close trigger */}
            <button 
                onClick={onClose}
                className="absolute top-3 right-3 p-1 hover:bg-[#EAE6FD] rounded-full text-[#5B35D5] transition-all"
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Utility to handle class merging without next/package issues
import { cn } from "@/lib/utils";
