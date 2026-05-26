"use client";

import { useState } from "react";
import { SmartSearchBar } from "@/components/hire/SmartSearchBar";
import { FilterSidebar } from "@/components/hire/FilterSidebar";
import { CandidateCard } from "@/components/hire/CandidateCard";
import { useMemo } from "react";
import type { Candidate } from "./actions";

interface SearchClientProps {
    initialCandidates: Candidate[];
}

export default function SearchClient({ initialCandidates }: SearchClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTechFilters, setActiveTechFilters] = useState<string[]>([]);

    const handleClearAll = () => {
        setSearchQuery("");
        setActiveTechFilters([]);
    };

    const filteredCandidates = useMemo(() => {
        let filtered = initialCandidates;

        // Apply Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.role.toLowerCase().includes(q) ||
                c.company.toLowerCase().includes(q) ||
                (c.headline && c.headline.toLowerCase().includes(q)) ||
                (c.bio && c.bio.toLowerCase().includes(q)) ||
                (c.skills && c.skills.some(skill => skill.toLowerCase().includes(q)))
            );
        }

        // Apply Tech Stack Filters
        if (activeTechFilters.length > 0) {
            filtered = filtered.filter(c =>
                c.skills && activeTechFilters.some(tech => 
                    c.skills.some(skill => skill.toLowerCase() === tech.toLowerCase())
                )
            );
        }

        // Apply Sorting by Match Score (Descending)
        const isSearchActive = searchQuery.trim() !== "" || activeTechFilters.length > 0;
        if (isSearchActive) {
            filtered = [...filtered].sort((a, b) => b.matchScore - a.matchScore);
        }

        return filtered;
    }, [initialCandidates, searchQuery, activeTechFilters]);

    const hasSearched = searchQuery.trim() !== "" || activeTechFilters.length > 0;

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] py-6 px-4 lg:px-8 shadow-sm">
                <SmartSearchBar query={searchQuery} onSearchChange={setSearchQuery} />
            </header>

            <div className="flex-1 flex max-w-full mx-auto w-full p-4 lg:p-8 gap-8">
                {/* Main Content */}
                <main className="flex-1 space-y-6">
                    <div className="flex justify-between items-center pb-2">
                        <h2 className="text-xl font-bold text-[#111827]">Top Candidates <span className="text-[#6B7280] font-normal text-sm ml-2">({filteredCandidates.length} found)</span></h2>
                        <div className="flex gap-2 text-sm text-[#6B7280]">
                            <span>Sort by:</span>
                            <span className="text-[#111827] font-medium cursor-pointer hover:text-[#7C3AED] transition-colors">Relevance</span>
                        </div>
                    </div>

                    {filteredCandidates.length === 0 ? (
                        <div className="text-center py-20 text-[#6B7280]">
                            No candidates found matching your criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {filteredCandidates.map(candidate => (
                                <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    hasSearched={hasSearched}
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                <FilterSidebar 
                    activeTechFilters={activeTechFilters}
                    onTechFilterChange={setActiveTechFilters}
                    onClearAll={handleClearAll}
                />
            </div>
        </div>
    );
}
