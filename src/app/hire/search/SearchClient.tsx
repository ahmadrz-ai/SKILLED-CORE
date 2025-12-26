"use client";

import { useState } from "react";
import { SmartSearchBar } from "@/components/hire/SmartSearchBar";
import { FilterSidebar } from "@/components/hire/FilterSidebar";
import { CandidateCard } from "@/components/hire/CandidateCard";
import { BulkActionBar } from "@/components/hire/BulkActionBar";
import type { Candidate } from "./actions";

interface SearchClientProps {
    initialCandidates: Candidate[];
}

export default function SearchClient({ initialCandidates }: SearchClientProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-obsidian flex flex-col">

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 py-6 px-4 lg:px-8">
                <SmartSearchBar />
            </header>

            <div className="flex-1 flex max-w-full mx-auto w-full p-4 lg:p-8 gap-8">

                {/* Sidebar */}
                <FilterSidebar />

                {/* Main Content */}
                <main className="flex-1 space-y-6">
                    <div className="flex justify-between items-center pb-2">
                        <h2 className="text-xl font-bold text-white">Top Candidates <span className="text-zinc-500 font-normal text-sm ml-2">({candidates.length} found)</span></h2>
                        <div className="flex gap-2 text-sm text-zinc-400">
                            <span>Sort by:</span>
                            <span className="text-white font-medium cursor-pointer">Relevance</span>
                        </div>
                    </div>

                    {candidates.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                            No candidates found matching your criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {candidates.map(candidate => (
                                <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    isSelected={selectedIds.includes(candidate.id)}
                                    onToggle={toggleSelection}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <BulkActionBar
                selectedCount={selectedIds.length}
                onClear={() => setSelectedIds([])}
            />
        </div>
    );
}
