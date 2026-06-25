'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Search, Trash2, CheckCircle2, Eye, Brain,
    ArrowUp, ArrowDown, ArrowUpDown, Star, StarHalf, Loader2, Award
} from 'lucide-react';
import { deleteInterview } from '@/app/actions/interview';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Utility: Title Case formatting for Role
function formatRoleName(role: string) {
    if (!role) return "AI Interview";
    
    const lowerRole = role.toLowerCase();
    if (lowerRole === "frontend") return "FrontEnd Interview";
    if (lowerRole === "backend") return "BackEnd Interview";
    if (lowerRole === "fullstack") return "FullStack Interview";
    
    return role
        .split(/[-_\s]+/)
        .map(word => {
            if (word.toLowerCase() === "frontend") return "FrontEnd";
            if (word.toLowerCase() === "backend") return "BackEnd";
            if (word.toLowerCase() === "fullstack") return "FullStack";
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ") + " Interview";
}

// Beautiful Star Rating Component
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const roundedFull = rating % 1 >= 0.75 ? fullStars + 1 : fullStars;

    for (let i = 1; i <= 5; i++) {
        if (i <= roundedFull) {
            stars.push(
                <Star key={i} size={size} className="fill-violet-400 text-sc-purple-600 stroke-[#5B35D5]" />
            );
        } else if (i === roundedFull + 1 && hasHalf) {
            stars.push(
                <StarHalf key={i} size={size} className="fill-violet-400 text-sc-purple-600 stroke-[#5B35D5]" />
            );
        } else {
            stars.push(
                <Star key={i} size={size} className="text-text-heading fill-zinc-800/40 stroke-gray-200" />
            );
        }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
}

interface UserInfo {
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
}

interface InterviewWithUser {
    id: string;
    userId: string;
    role: string;
    difficulty: number;
    score: number;
    feedback: string | null;
    radarData: any;
    transcript: any;
    createdAt: Date;
    user: UserInfo;
}

interface InterviewsTableProps {
    interviews: InterviewWithUser[];
}

export default function InterviewsTable({ interviews }: InterviewsTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [sortField, setSortField] = useState<'candidate' | 'role' | 'score' | 'date' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

    const filteredInterviews = interviews.filter(item =>
        item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.feedback?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSort = (field: 'candidate' | 'role' | 'score' | 'date') => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedInterviews = [...filteredInterviews].sort((a, b) => {
        if (!sortField || !sortDirection) return 0;

        let valA: any = '';
        let valB: any = '';

        if (sortField === 'candidate') {
            valA = a.user?.name?.toLowerCase() || '';
            valB = b.user?.name?.toLowerCase() || '';
        } else if (sortField === 'role') {
            valA = a.role.toLowerCase();
            valB = b.role.toLowerCase();
        } else if (sortField === 'score') {
            valA = a.score;
            valB = b.score;
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (sortField === 'date') {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDelete = async (interviewId: string) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this AI Interview Report? This action cannot be undone.')) return;

        setIsLoading(interviewId);
        try {
            const result = await deleteInterview(interviewId);
            if (result.success) {
                toast.success("AI Interview Report successfully deleted.");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete interview report.");
            }
        } catch (err) {
            console.error("Delete interview error:", err);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(null);
        }
    };

    // Calculations for Stats
    const totalCount = interviews.length;
    const averageScore = totalCount > 0 
        ? Math.round(interviews.reduce((acc, curr) => acc + curr.score, 0) / totalCount)
        : 0;
    const excellentCount = interviews.filter(i => i.score >= 80).length;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-center">
                    <span className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">Total Simulations</span>
                    <span className="text-2xl font-bold text-text-heading font-mono mt-1">{totalCount}</span>
                </div>
                <div className="bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-center">
                    <span className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">Average Platform Score</span>
                    <span className="text-2xl font-bold text-sc-purple-600 font-mono mt-1">{averageScore}/100</span>
                </div>
                <div className="bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-center">
                    <span className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">High Performers (80+ Score)</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono mt-1">{excellentCount}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search by candidate, role or feedback..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-bg-input border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-border-focus w-80"
                    />
                </div>
                <div className="text-xs text-text-tertiary font-mono">
                    TOTAL SESSIONS: {interviews.length}
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-secondary-panel border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border-subtle bg-bg-secondary-panel">
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('candidate')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Candidate
                                    {sortField === 'candidate' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'candidate' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('role')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Role Type
                                    {sortField === 'role' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'role' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('score')}
                            >
                                <div className="flex items-center gap-1.5">
                                    AI Score
                                    {sortField === 'score' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'score' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Completed Date
                                    {sortField === 'date' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'date' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th className="p-4 font-medium text-text-secondary text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedInterviews.map((item) => (
                            <tr key={item.id} className="border-b border-border-subtle hover:bg-bg-sidebar-hover transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-8 h-8 rounded-full bg-bg-secondary-panel flex items-center justify-center overflow-hidden border border-border-default">
                                            {item.user?.image ? (
                                                <Image src={item.user.image} alt="" fill sizes="32px" className="object-cover" />
                                            ) : (
                                                item.user?.name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-text-heading flex items-center gap-1.5">
                                                {item.user?.name || "Unknown"}
                                                {item.user?.username && (
                                                    <span className="text-[10px] text-text-tertiary font-mono">@{item.user.username}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-text-tertiary">{item.user?.email || "No email"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-semibold text-text-body">
                                    {formatRoleName(item.role)}
                                </td>
                                <td className="p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={item.score / 20} />
                                            <span className="text-xs font-mono font-bold text-sc-purple-600">
                                                {(item.score / 20).toFixed(1)}/5.0
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center text-[10px] font-mono font-bold text-text-secondary bg-bg-secondary-panel border border-border-default px-2 py-0.5 rounded-md">
                                            SCORE: {item.score}/100
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-xs font-mono text-text-secondary">
                                    {new Date(item.createdAt).toLocaleString(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            className="h-8 w-8 text-text-secondary hover:text-text-heading hover:bg-bg-sidebar-hover rounded-md border border-border-subtle hover:border-border-default transition-all compact-btn"
                                            title="View Details"
                                        >
                                            <Link href={`/interview/${item.id}`}>
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isLoading === item.id}
                                            onClick={() => handleDelete(item.id)}
                                            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md border border-red-500/20 hover:border-red-500/30 transition-all compact-btn"
                                            title="Delete Session Report"
                                        >
                                            {isLoading === item.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedInterviews.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-text-tertiary italic bg-bg-secondary-panel/10 border-t border-border-subtle">
                                    No interview simulation sessions found matching search query.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
