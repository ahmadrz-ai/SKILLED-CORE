import { CandidateCard } from "./CandidateCard";
import { ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoredCandidate {
    id: string;
    name: string;
    username: string;
    headline: string | null;
    location: string | null;
    avatarUrl: string | null;
    plan: 'ULTRA' | 'PRO' | 'BASIC';
    skills: string[];
    totalScore: number;
    totalBaseScore: number;
    requirementScores: { requirementLabel: string; score: number }[];
    matchedTerms: string[];
    verifiedBadges: string[];
    experienceCount: number;
    projectCount: number;
    role: string;
    company: string;
    yearsOfExperience: number;
}

interface ResultRow {
    id: string;
    label: string;
    type: 'perfect' | 'slight' | 'requirement';
    requirementPriority?: number;
    candidates: ScoredCandidate[];
}

interface TalentSearchResultsProps {
    rows: ResultRow[];
    hasSearched: boolean;
}

export function TalentSearchResults({ rows, hasSearched }: TalentSearchResultsProps) {
    if (!hasSearched || rows.length === 0) return null;

    return (
        <div className="w-full py-6 flex flex-col gap-8 font-sans">
            {rows.map((row) => {
                const isPerfect = row.type === 'perfect';
                const isSlight = row.type === 'slight';
                const count = row.candidates.length;

                return (
                    <div key={row.id} className="w-full">
                        {/* Row Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
                                    isPerfect && "bg-[#EAE6FD] text-[#4A28C9] border-[#D4CCF8]",
                                    isSlight && "bg-blue-50 text-blue-700 border-blue-200",
                                    row.type === 'requirement' && "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]"
                                )}>
                                    {row.label}
                                </span>
                                <span className="text-xs text-[#9CA3AF] font-mono">
                                    ({count})
                                </span>
                            </div>

                            {count > 5 && (
                                <button className="text-xs font-semibold text-[#5B35D5] hover:text-[#4A28C9] hover:underline flex items-center gap-1 transition-all">
                                    <span>See all</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Horizontal Scroll Container */}
                        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-250 scrollbar-track-transparent">
                            <div className="flex flex-row gap-4">
                                {row.candidates.map((candidate) => (
                                    <CandidateCard
                                        key={candidate.id}
                                        candidate={candidate as any}
                                        hasSearched={true}
                                        layout="row"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Mandated Footnote by Correction 7 */}
            <div className="text-xs text-[#9CA3AF] text-center mt-4 pb-4">
                ULTRA members may appear higher in search results
            </div>
        </div>
    );
}
