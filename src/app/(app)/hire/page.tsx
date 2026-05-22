'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Search, Sparkles, Users, MapPin, Briefcase, Eye, Mail, Send,
    ChevronDown, ChevronUp, X, CheckSquare, Square, Check, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllCandidates, searchCandidates, CandidateProfile } from './actions';
import { sendMessage } from '@/app/(app)/messages/actions';
import { toast } from 'sonner';

// ─── Filter config ────────────────────────────────────────────────────────────
const TECH_SKILLS = ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Next.js', 'Docker', 'GraphQL'];
const LOCATIONS = ['Global (Remote)', 'United States', 'Europe', 'Pakistan', 'United Kingdom'];
const EXPERIENCE_OPTIONS = ['0–2 years', '3–5 years', '6–10 years', '10+ years'];

// ─── Skeleton ────────────────────────────────────────────────────────────────
function CandidateSkeleton() {
    return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: '#E5E7EB' }} />
                    <div className="space-y-2">
                        <div className="h-4 w-28 rounded" style={{ backgroundColor: '#E5E7EB' }} />
                        <div className="h-3 w-20 rounded" style={{ backgroundColor: '#F3F4F6' }} />
                        <div className="h-3 w-16 rounded" style={{ backgroundColor: '#F3F4F6' }} />
                    </div>
                </div>
            </div>
            <div className="space-y-1.5 mb-3">
                <div className="h-3 rounded" style={{ backgroundColor: '#F3F4F6' }} />
                <div className="h-3 w-4/5 rounded" style={{ backgroundColor: '#F3F4F6' }} />
            </div>
            <div className="flex gap-1.5 mb-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-5 w-14 rounded-full" style={{ backgroundColor: '#F3F4F6' }} />
                ))}
            </div>
            <div className="h-8 rounded-lg" style={{ backgroundColor: '#F3F4F6' }} />
        </div>
    );
}

// ─── Send Invitation Modal ────────────────────────────────────────────────────
function SendInvitationModal({
    candidate, onClose
}: { candidate: CandidateProfile; onClose: () => void }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!date || !time) { toast.error('Please set a date and time'); return; }
        setSending(true);
        try {
            const inviteMsg = `🏆 GOLDEN CHANCE — INTERVIEW INVITATION\n\nYou have been selected for an interview!\n📅 Date: ${date}\n⏰ Time: ${time}\n\nPlease confirm your availability.`;
            const res = await sendMessage(candidate.id, inviteMsg);
            if (res.success) {
                toast.success(`Invitation sent to ${candidate.name}!`);
                onClose();
            } else {
                toast.error('Failed to send invitation');
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-[#111827]">Send Interview Invitation</h3>
                            <p className="text-xs text-[#6B7280] mt-0.5">Golden Chance card will be sent via message</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                            <X className="w-4 h-4 text-[#6B7280]" />
                        </button>
                    </div>
                </div>

                {/* Candidate preview */}
                <div className="px-5 py-4 flex items-center gap-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <Avatar className="w-10 h-10 border border-[#E5E7EB]">
                        <AvatarImage src={candidate.image || undefined} />
                        <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-bold text-sm">
                            {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold text-sm text-[#111827]">{candidate.name}</div>
                        <div className="text-xs text-[#6B7280]">{candidate.headline || 'Professional'}</div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[#374151] block mb-1.5">Interview Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="w-full h-9 px-3 text-sm rounded-lg border outline-none transition-all"
                            style={{ borderColor: '#E5E7EB', color: '#111827' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                            onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'} />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[#374151] block mb-1.5">Interview Time</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)}
                            className="w-full h-9 px-3 text-sm rounded-lg border outline-none transition-all"
                            style={{ borderColor: '#E5E7EB', color: '#111827' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                            onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'} />
                    </div>
                    <button onClick={handleSend} disabled={sending}
                        className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                        style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}>
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? 'Sending…' : 'Send Golden Chance Invite'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────
function CandidateCard({
    candidate, isSearchMode, onInvite
}: { candidate: CandidateProfile; isSearchMode: boolean; onInvite: (c: CandidateProfile) => void }) {
    const router = useRouter();
    const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const profileUrl = `/profile/${candidate.username || candidate.id}`;

    return (
        <div className="group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:border-[#6366F1] hover:shadow-md transition-all duration-200 flex flex-col relative">

            {/* Match badge — only in search mode */}
            {isSearchMode && candidate.relevanceScore !== undefined && (
                <div className="absolute top-3 right-3 z-10 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>
                    {candidate.relevanceScore}% match
                </div>
            )}

            {/* Hover overlay with action buttons */}
            <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto"
                style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)' }}>
                <Link href={profileUrl}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm"
                    style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}>
                    <Eye className="w-3.5 h-3.5" /> View Profile
                </Link>
                <button onClick={() => router.push(`/messages?userId=${candidate.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm"
                    style={{ backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB' }}>
                    <Mail className="w-3.5 h-3.5" /> Message
                </button>
                <button onClick={() => onInvite(candidate)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm"
                    style={{ backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                    <Send className="w-3.5 h-3.5" /> Invite
                </button>
            </div>

            {/* Card body */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-14 h-14 border border-[#E5E7EB] flex-shrink-0">
                        <AvatarImage src={candidate.image || undefined} />
                        <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-bold text-base">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0" style={{ paddingRight: isSearchMode ? '72px' : '0' }}>
                        <h3 className="font-bold text-[#111827] text-sm truncate">{candidate.name}</h3>
                        {candidate.headline && (
                            <p className="text-xs text-[#6B7280] truncate mt-0.5">{candidate.headline}</p>
                        )}
                        {candidate.location && (
                            <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{candidate.location}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Bio */}
                {candidate.bio && (
                    <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2 mb-3">{candidate.bio}</p>
                )}

                {/* Skills */}
                {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.skills.slice(0, 4).map((skill, i) => (
                            <Badge key={i} variant="outline"
                                className="text-[10px] px-2 py-0 border-[#C7D2FE] bg-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF]">
                                {skill}
                            </Badge>
                        ))}
                        {candidate.skills.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0 border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]">
                                +{candidate.skills.length - 4}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Stats footer */}
                <div className="flex items-center gap-4 mt-auto pt-3 border-t border-[#F3F4F6]">
                    <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                        <Users className="w-3 h-3" />{candidate.connectionCount}
                    </span>
                    {candidate.experienceCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                            <Briefcase className="w-3 h-3" />{candidate.experienceCount} exp
                        </span>
                    )}
                    <Link href={profileUrl} className="ml-auto text-[10px] font-semibold transition-colors"
                        style={{ color: '#6366F1' }}>
                        View →
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Filter section ───────────────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#F3F4F6] pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
            <button onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full mb-3 group">
                <span className="text-xs font-bold text-[#374151] uppercase tracking-wide">{title}</span>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-[#9CA3AF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />}
            </button>
            {open && children}
        </div>
    );
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <button onClick={onChange} className="flex items-center gap-2 w-full py-1 group">
            {checked
                ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                : <Square className="w-3.5 h-3.5 flex-shrink-0 text-[#D1D5DB] group-hover:text-[#9CA3AF]" />}
            <span className="text-xs text-[#6B7280] group-hover:text-[#374151] transition-colors text-left">{label}</span>
        </button>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FindTalentPage() {
    const [query, setQuery] = useState('');
    const [allCandidates, setAllCandidates] = useState<CandidateProfile[]>([]);
    const [results, setResults] = useState<CandidateProfile[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [inviteTarget, setInviteTarget] = useState<CandidateProfile | null>(null);

    // Filters
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
    const [selectedExp, setSelectedExp] = useState<Set<string>>(new Set());

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        getAllCandidates()
            .then(data => { setAllCandidates(data); setResults(data); })
            .finally(() => setInitialLoading(false));
    }, []);

    // Debounced AI search
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        if (!query.trim()) {
            setResults(allCandidates);
            return;
        }
        setSearching(true);
        debounceTimer.current = setTimeout(() => {
            searchCandidates(query).then(setResults).finally(() => setSearching(false));
        }, 400);
        return () => clearTimeout(debounceTimer.current);
    }, [query, allCandidates]);

    // Client-side filter on top of search results
    const filtered = results.filter(c => {
        if (selectedSkills.size > 0) {
            const has = [...selectedSkills].some(s =>
                c.skills.some(skill => skill.toLowerCase().includes(s.toLowerCase()))
            );
            if (!has) return false;
        }
        if (selectedLocations.size > 0) {
            const loc = c.location?.toLowerCase() || '';
            const has = [...selectedLocations].some(l =>
                loc.includes(l.toLowerCase()) || l === 'Global (Remote)' && (!c.location || loc.includes('remote'))
            );
            if (!has) return false;
        }
        return true;
    });

    const isSearchMode = !!query.trim();
    const hasFilters = selectedSkills.size > 0 || selectedLocations.size > 0 || selectedExp.size > 0;

    const clearFilters = () => {
        setSelectedSkills(new Set());
        setSelectedLocations(new Set());
        setSelectedExp(new Set());
    };

    const toggleSet = (set: Set<string>, setFn: (s: Set<string>) => void, val: string) => {
        const next = new Set(set);
        next.has(val) ? next.delete(val) : next.add(val);
        setFn(next);
    };

    return (
        <div className="w-full flex gap-5">

            {/* ── LEFT FILTER PANEL ───────────────────────────────────── */}
            <div className="hidden lg:flex flex-col w-52 flex-shrink-0">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sticky top-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-[#111827] uppercase tracking-wide">Filters</span>
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-[10px] font-medium transition-colors"
                                style={{ color: '#6366F1' }}>
                                Clear all
                            </button>
                        )}
                    </div>

                    <FilterSection title="Tech Stack">
                        {TECH_SKILLS.map(skill => (
                            <CheckboxItem key={skill} label={skill}
                                checked={selectedSkills.has(skill)}
                                onChange={() => toggleSet(selectedSkills, setSelectedSkills, skill)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="Location">
                        {LOCATIONS.map(loc => (
                            <CheckboxItem key={loc} label={loc}
                                checked={selectedLocations.has(loc)}
                                onChange={() => toggleSet(selectedLocations, setSelectedLocations, loc)} />
                        ))}
                    </FilterSection>

                    <FilterSection title="Experience" defaultOpen={false}>
                        {EXPERIENCE_OPTIONS.map(exp => (
                            <CheckboxItem key={exp} label={exp}
                                checked={selectedExp.has(exp)}
                                onChange={() => toggleSet(selectedExp, setSelectedExp, exp)} />
                        ))}
                    </FilterSection>
                </div>
            </div>

            {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

                {/* Search bar */}
                <div className="mb-5">
                    <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Sparkles className="w-4 h-4" style={{ color: '#6366F1' }} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder='AI search — e.g. "Senior React developer who knows Python and has startup experience"'
                            className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border outline-none transition-all"
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderColor: isSearchMode ? '#6366F1' : '#E5E7EB',
                                color: '#111827',
                                boxShadow: isSearchMode ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                            }}
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#F3F4F6] transition-colors">
                                <X className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                            </button>
                        )}
                    </div>
                    {isSearchMode && !searching && (
                        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#6366F1' }}>
                            <Sparkles className="w-3 h-3" />
                            AI Semantic Search active — results ranked by relevance to your query
                        </p>
                    )}
                </div>

                {/* Results header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-[#111827]">
                        {isSearchMode ? 'Top Candidates' : 'All Candidates'}
                        {!initialLoading && !searching && (
                            <span className="ml-2 text-sm font-normal text-[#6B7280]">
                                ({filtered.length} found)
                            </span>
                        )}
                    </h2>
                    {isSearchMode && (
                        <span className="text-xs text-[#6B7280]">Sort by: <span className="font-semibold text-[#374151]">Relevance</span></span>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {initialLoading || searching
                        ? [...Array(9)].map((_, i) => <CandidateSkeleton key={i} />)
                        : filtered.length > 0
                            ? filtered.map(c => (
                                <CandidateCard key={c.id} candidate={c}
                                    isSearchMode={isSearchMode}
                                    onInvite={setInviteTarget} />
                            ))
                            : (
                                <div className="col-span-full text-center py-16">
                                    <Search className="w-8 h-8 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                                    <h3 className="font-semibold text-sm mb-1" style={{ color: '#374151' }}>No profiles found</h3>
                                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                                        Try different keywords or adjust your filters
                                    </p>
                                    {(query || hasFilters) && (
                                        <button onClick={() => { setQuery(''); clearFilters(); }}
                                            className="mt-3 text-xs font-medium" style={{ color: '#6366F1' }}>
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            )
                    }
                </div>
            </div>

            {/* Invitation Modal */}
            {inviteTarget && (
                <SendInvitationModal
                    candidate={inviteTarget}
                    onClose={() => setInviteTarget(null)}
                />
            )}
        </div>
    );
}
