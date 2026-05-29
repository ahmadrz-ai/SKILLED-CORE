import { cn } from "@/lib/utils";
import { Check, X, ShieldAlert } from "lucide-react";

export interface SearchFilters {
    experienceLevel: 'any' | 'junior' | 'mid' | 'senior' | 'expert';
    planType: 'all' | 'ultra' | 'pro-ultra';
    location: string;
    verifiedOnly: boolean;
}

interface LeftFilterPanelProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    onClearAll: () => void;
}

export function LeftFilterPanel({ filters, onFiltersChange, onClearAll }: LeftFilterPanelProps) {
    const handleExperienceChange = (level: SearchFilters['experienceLevel']) => {
        onFiltersChange({ ...filters, experienceLevel: level });
    };

    const handlePlanChange = (plan: SearchFilters['planType']) => {
        onFiltersChange({ ...filters, planType: plan });
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, location: e.target.value });
    };

    const handleVerifiedToggle = () => {
        onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
    };

    const isAnyFilterActive = 
        filters.experienceLevel !== 'any' || 
        filters.planType !== 'all' || 
        filters.location.trim() !== '' || 
        filters.verifiedOnly;

    return (
        <aside className="w-full lg:w-72 flex-shrink-0 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm space-y-6 self-start font-sans">
            {/* Header info */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111827]">
                    Refine Results
                </h3>
                {isAnyFilterActive && (
                    <button 
                        onClick={onClearAll}
                        className="text-xs font-semibold text-[#5B35D5] hover:text-[#4A28C9] hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                        <span>Clear</span>
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Filter 1: Experience Level */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">
                    Experience Level
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {(['any', 'junior', 'mid', 'senior', 'expert'] as const).map((level) => {
                        const isActive = filters.experienceLevel === level;
                        const labelText = level === 'any' ? 'Any' : level === 'mid' ? 'Mid-Level' : level.charAt(0).toUpperCase() + level.slice(1);
                        return (
                            <button
                                key={level}
                                onClick={() => handleExperienceChange(level)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                                    isActive 
                                        ? "bg-[#EAE6FD] text-[#4A28C9] border-[#B4A3F3]" 
                                        : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                                )}
                            >
                                {labelText}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter 2: Member Type */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">
                    Member Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {(['all', 'ultra', 'pro-ultra'] as const).map((plan) => {
                        const isActive = filters.planType === plan;
                        const labelText = plan === 'all' ? 'All Members' : plan === 'ultra' ? 'ULTRA Only' : 'PRO & ULTRA';
                        return (
                            <button
                                key={plan}
                                onClick={() => handlePlanChange(plan)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                                    isActive 
                                        ? "bg-[#EAE6FD] text-[#4A28C9] border-[#B4A3F3]" 
                                        : "bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                                )}
                            >
                                {labelText}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter 3: Location */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">
                    Location
                </label>
                <input
                    type="text"
                    value={filters.location}
                    onChange={handleLocationChange}
                    placeholder="Search city, country..."
                    className="w-full h-9 bg-white border border-[#D1D5DB] rounded-lg px-3 text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#5B35D5] focus:border-[#5B35D5] transition-all placeholder:text-[#9CA3AF]"
                />
            </div>

            {/* Filter 4: Verified Only Switch */}
            <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-4">
                <div className="space-y-0.5">
                    <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">
                        Verified Skills
                    </label>
                    <span className="text-[10px] text-[#9CA3AF] block leading-snug">
                        Only show candidates with verified assessment badges
                    </span>
                </div>

                {/* Toggle switch */}
                <button
                    onClick={handleVerifiedToggle}
                    className={cn(
                        "w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors cursor-pointer",
                        filters.verifiedOnly ? "bg-[#5B35D5]" : "bg-[#D1D5DB]"
                    )}
                >
                    <div 
                        className={cn(
                            "w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out",
                            filters.verifiedOnly ? "translate-x-5" : "translate-x-0"
                        )}
                    />
                </button>
            </div>
        </aside>
    );
}
