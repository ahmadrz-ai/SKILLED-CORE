"use client";

import { useState, useMemo, useEffect } from "react";
import { Sparkles, Search, SearchX, Compass, BookOpen, User, UserCheck, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchTalent } from "@/app/actions/talentSearch";
import { TalentSearchResults } from "@/components/hire/TalentSearchResults";
import { QueryIntentBanner } from "@/components/hire/QueryIntentBanner";
import { LeftFilterPanel, SearchFilters } from "@/components/hire/LeftFilterPanel";
import { CandidateCard } from "@/components/hire/CandidateCard";
import type { Candidate } from "@/app/(app)/hire/actions";

interface SearchClientProps {
    initialCandidates: Candidate[];
}

export default function SearchClient({ initialCandidates }: SearchClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchStatus, setSearchStatus] = useState("");
    const [parsedQuery, setParsedQuery] = useState<any | null>(null);
    const [resultRows, setResultRows] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showQueryBanner, setShowQueryBanner] = useState(false);
    const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        experienceLevel: 'any',
        planType: 'all',
        location: '',
        verifiedOnly: false,
    });

    const handleClearAll = () => {
        setSearchQuery("");
        setHasSearched(false);
        setParsedQuery(null);
        setResultRows([]);
        setShowQueryBanner(false);
        setEmptyMessage(null);
        setFilters({
            experienceLevel: 'any',
            planType: 'all',
            location: '',
            verifiedOnly: false,
        });
    };

    // Trigger AI semantic search pipeline
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        console.log('Search query being sent:', searchQuery);
        setIsSearching(true);
        setHasSearched(true);
        setResultRows([]);
        setShowQueryBanner(false);

        // Cycle loading status messages sequential telemetry steps
        const messages = [
            'Reading your search...',
            'Analyzing requirements...',
            'Searching candidates...',
            'Ranking matches...',
        ];
        setSearchStatus(messages[0]);

        const timers: NodeJS.Timeout[] = [];
        messages.forEach((msg, i) => {
            if (i > 0) {
                const t = setTimeout(() => {
                    setSearchStatus(msg);
                }, i * 1000);
                timers.push(t);
            }
        });

        try {
            const res = await searchTalent(searchQuery);
            if (res.error) {
                console.error("AI Search returned error:", res.error);
            } else {
                setParsedQuery(res.parsedQuery);
                setResultRows(res.rows);
                setEmptyMessage(res.message || null);
                setShowQueryBanner(true);
            }
        } catch (err) {
            console.error("AI search failed:", err);
        } finally {
            // Ensure timers are cleared
            timers.forEach(clearTimeout);
            setIsSearching(false);
        }
    };

    // Handle pressing Enter inside search bar
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 3 Clickable Example suggestions
    const exampleSearches = [
        "Senior React developer with TypeScript",
        "Python data scientist who knows machine learning",
        "Full stack developer with 3+ years experience"
    ];

    const handleExampleClick = (query: string) => {
        setSearchQuery(query);
        // Automatically run search after a short delay
        setTimeout(() => {
            // Fills value and triggers search
            const btn = document.getElementById("talent-search-submit");
            if (btn) btn.click();
        }, 50);
    };

    // Client-side filtration derived state
    const filteredRows = useMemo(() => {
        return resultRows.map(row => ({
            ...row,
            candidates: row.candidates.filter((c: any) => {
                // Filter 1: Experience Level
                if (filters.experienceLevel !== 'any') {
                    const exp = c.yearsOfExperience ?? 0;
                    if (filters.experienceLevel === 'junior' && exp >= 2) return false;
                    if (filters.experienceLevel === 'mid' && (exp < 2 || exp > 5)) return false;
                    if (filters.experienceLevel === 'senior' && (exp < 5 || exp > 10)) return false;
                    if (filters.experienceLevel === 'expert' && exp < 10) return false;
                }

                // Filter 2: Member type
                if (filters.planType === 'ultra' && c.plan !== 'ULTRA') return false;
                if (filters.planType === 'pro-ultra' && !['ULTRA', 'PRO'].includes(c.plan)) return false;

                // Filter 3: Verified Only
                if (filters.verifiedOnly && c.verifiedBadges.length === 0) return false;

                // Filter 4: Location
                if (filters.location && !c.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;

                return true;
            })
        })).filter(row => row.candidates.length > 0);
    }, [resultRows, filters]);

    // Client-side filtration on initial candidate grid list
    const filteredInitialCandidates = useMemo(() => {
        return initialCandidates.filter(c => {
            // Filter 1: Experience Level
            if (filters.experienceLevel !== 'any') {
                const exp = c.yearsOfExperience ?? 0;
                if (filters.experienceLevel === 'junior' && exp >= 2) return false;
                if (filters.experienceLevel === 'mid' && (exp < 2 || exp > 5)) return false;
                if (filters.experienceLevel === 'senior' && (exp < 5 || exp > 10)) return false;
                if (filters.experienceLevel === 'expert' && exp < 10) return false;
            }

            // Filter 2: Member type
            const cPlan = (c as any).plan || 'BASIC';
            if (filters.planType === 'ultra' && cPlan !== 'ULTRA') return false;
            if (filters.planType === 'pro-ultra' && !['ULTRA', 'PRO'].includes(cPlan)) return false;

            // Filter 3: Verified Only (badges match verified on CANDIDATE)
            if (filters.verifiedOnly && !c.verified) return false;

            // Filter 4: Location
            if (filters.location && !c.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;

            return true;
        })
        // Verified-badge holders always rank first in browse mode (B7) — then by
        // the computed profile-strength match score.
        .sort((a, b) => {
            if (!!b.verified !== !!a.verified) return b.verified ? 1 : -1;
            return (b.matchScore || 0) - (a.matchScore || 0);
        });
    }, [initialCandidates, filters]);

    // Check if entire results lists return zero candidates
    const hasResults = hasSearched ? filteredRows.length > 0 : filteredInitialCandidates.length > 0;

    // Count of active refinement filters (for the mobile trigger badge)
    const activeFilterCount =
        (filters.experienceLevel !== 'any' ? 1 : 0) +
        (filters.planType !== 'all' ? 1 : 0) +
        (filters.location.trim() !== '' ? 1 : 0) +
        (filters.verifiedOnly ? 1 : 0);

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
            
            {/* Redesigned Premium Prominent Search Input Container */}
            <div className="w-full bg-white border-b border-[#E5E7EB] shadow-sm">
                <div className="w-full max-w-4xl mx-auto px-6 pt-8 pb-5 flex flex-col gap-2 relative">
                    <div className="relative flex items-center bg-white border border-[var(--sc-gray-200)] rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-[var(--sc-purple-400)]/20 focus-within:border-[var(--sc-purple-600)] transition-all h-14">
                        
                        {/* Search Icon */}
                        <Search className="w-6 h-6 text-[var(--sc-purple-500)] absolute left-4" />

                        {/* Input Area */}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe who you're looking for... e.g. 'Experienced React developer with Python skills'"
                            className="w-full bg-transparent border-none text-[var(--sc-gray-900)] placeholder:text-[var(--sc-gray-400)] focus:outline-none focus:ring-0 pl-14 pr-44 text-sm md:text-base font-medium h-full"
                        />

                        {/* Right inline tools */}
                        <div className="absolute right-2 flex items-center gap-3">
                            {/* AI Powered Badge */}
                            <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-[var(--sc-purple-600)] bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                AI Powered
                            </span>

                            {/* Find Talent Submission Trigger */}
                            <Button 
                                id="talent-search-submit"
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-700)] !text-white h-10 px-4 rounded-lg font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Find Talent</span>
                            </Button>
                        </div>
                    </div>

                    {/* Example searches suggestions below search bar */}
                    {!searchQuery && !hasSearched && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 ml-1 text-xs text-[#9CA3AF]">
                            <span>Try:</span>
                            {exampleSearches.map((example, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleExampleClick(example)}
                                    className="bg-[var(--sc-gray-50)] hover:bg-[var(--sc-purple-100)] hover:text-[var(--sc-purple-600)] border border-[var(--sc-gray-200)] hover:border-[var(--sc-purple-200)] px-2.5 py-1 rounded-md text-[var(--sc-gray-600)] font-medium transition-all cursor-pointer"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Query Intent Summary description under search */}
                    {hasSearched && parsedQuery?.queryIntent && !isSearching && (
                        <div className="text-xs text-[var(--sc-gray-500)] mt-1 ml-1 leading-snug">
                            Searching for: <span className="text-[var(--sc-purple-600)] font-semibold">"{parsedQuery.queryIntent}"</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pattern B Page Layout: Left panel w-72 refinement filters + Right matches lists */}
            <div className="flex-1 flex flex-col lg:flex-row max-w-full mx-auto w-full p-4 lg:p-8 gap-4 lg:gap-8">

                {/* Mobile backdrop for the filter drawer */}
                {mobileFiltersOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                        onClick={() => setMobileFiltersOpen(false)}
                        aria-hidden
                    />
                )}

                {/* Filter Panel — inline sidebar on desktop, slide-in drawer on mobile */}
                <div className={cn(
                    "lg:block lg:static lg:w-72 lg:flex-shrink-0 lg:self-start lg:p-0 lg:bg-transparent lg:shadow-none lg:overflow-visible lg:max-w-none",
                    mobileFiltersOpen
                        ? "fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm overflow-y-auto p-3 bg-[var(--sc-gray-100)] shadow-2xl"
                        : "hidden"
                )}>
                    <div className="flex items-center justify-between mb-3 lg:hidden">
                        <span className="text-sm font-bold text-[var(--sc-gray-900)]">Filters</span>
                        <button
                            onClick={() => setMobileFiltersOpen(false)}
                            aria-label="Close filters"
                            className="p-1.5 rounded-full hover:bg-[var(--sc-gray-200)] text-[var(--sc-gray-600)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <LeftFilterPanel
                        filters={filters}
                        onFiltersChange={setFilters}
                        onClearAll={handleClearAll}
                    />
                </div>

                {/* Main Results Listing Container */}
                <main className="flex-1 min-w-0">

                    {/* Mobile-only trigger to open the filter drawer */}
                    <button
                        onClick={() => setMobileFiltersOpen(true)}
                        className="lg:hidden mb-4 inline-flex items-center gap-2 bg-white border border-[var(--sc-gray-200)] rounded-lg px-3.5 py-2 text-sm font-semibold text-[var(--sc-gray-700)] shadow-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-[var(--sc-purple-600)]" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--sc-purple-600)] text-white text-[11px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    
                    {/* Pulsing Sparkles Telemetry Loading State */}
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--sc-purple-100)] flex items-center justify-center mb-4 animate-pulse">
                                <Sparkles className="w-8 h-8 text-[var(--sc-purple-600)]" />
                            </div>
                            <h4 className="text-base font-bold text-[var(--sc-gray-900)] font-sans">
                                {searchStatus}
                            </h4>
                            <p className="text-xs text-[var(--sc-gray-500)] mt-1">
                                This usually takes 3–5 seconds
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Query Understanding sparkles banner */}
                            {showQueryBanner && parsedQuery && (
                                <QueryIntentBanner
                                    queryIntent={parsedQuery.queryIntent}
                requirements={parsedQuery.requirements}
                                    onClose={() => setShowQueryBanner(false)}
                                />
                            )}

                            {/* Renders results based on search active status */}
                            {!hasResults ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[var(--sc-gray-150)] rounded-xl p-8 shadow-sm">
                                    <SearchX className="w-12 h-12 text-[var(--sc-gray-400)] mb-3" />
                                    <h3 className="text-base font-bold text-[var(--sc-gray-900)]">
                                        {emptyMessage || "No candidates found for this search"}
                                    </h3>
                                    <p className="text-xs text-[var(--sc-gray-600)] max-w-xs mt-1 leading-relaxed">
                                        {emptyMessage ? "They may not have a SkilledCore profile yet." : "Try adjusting your refinement filters or using different keywords in your search description."}
                                    </p>
                                    <button 
                                        onClick={handleClearAll}
                                        className="mt-4 text-xs font-bold text-[var(--sc-purple-600)] hover:underline cursor-pointer"
                                    >
                                        Clear Search & Filters
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {hasSearched ? (
                                        // Premium AI scroll rows matched categories
                                        <TalentSearchResults
                                            rows={filteredRows}
                                            hasSearched={true}
                                        />
                                    ) : (
                                        // Standard Fallback initial candidate pool grid display
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center pb-1">
                                                <h2 className="text-lg font-bold text-[#111827]">
                                                    {filters.verifiedOnly ? "Verified Skills" : "Available Candidates"}
                                                    <span className="text-[#6B7280] font-normal text-xs ml-2">
                                                        ({filteredInitialCandidates.length} {filters.verifiedOnly ? "verified-badge holders" : "active profiles"})
                                                    </span>
                                                </h2>
                                                <div className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider">
                                                    Browse mode
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                                {filteredInitialCandidates.map((candidate) => (
                                                    <CandidateCard
                                                        key={candidate.id}
                                                        candidate={candidate}
                                                        hasSearched={false}
                                                        layout="grid"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
