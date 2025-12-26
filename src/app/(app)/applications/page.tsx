'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Calendar, CheckCircle2, ChevronRight, Clock,
    Eye, MoreHorizontal, Search, XCircle, Zap, ShieldAlert,
    FileText, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// --- TYPES ---
type ApplicationStatus = 'Applied' | 'Viewed' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected';

interface Application {
    id: string;
    company: string;
    role: string;
    logo: string; // Tailwind bg class
    dateApplied: string;
    status: ApplicationStatus;
    pipelineProgress: number; // 0 to 100
    lastUpdate: string;
}

// --- MOCK DATA ---
const MOCK_APPLICATIONS: Application[] = [
    {
        id: '1',
        company: 'Trivia.Global',
        role: 'Senior Frontend Architect',
        logo: 'bg-violet-600',
        dateApplied: '2 days ago',
        status: 'Interview',
        pipelineProgress: 60,
        lastUpdate: 'Interview requested 2h ago'
    },
    {
        id: '2',
        company: 'CyberDyne Systems',
        role: 'AI Research Scientist',
        logo: 'bg-zinc-800',
        dateApplied: '1 week ago',
        status: 'Viewed',
        pipelineProgress: 25,
        lastUpdate: 'Recruiter viewed profile'
    },
    {
        id: '3',
        company: 'Nexus Corp',
        role: 'Product Designer',
        logo: 'bg-emerald-600',
        dateApplied: '3 weeks ago',
        status: 'Offer',
        pipelineProgress: 90,
        lastUpdate: 'Contract sent for review'
    },
    {
        id: '4',
        company: 'Tyrell Corp',
        role: 'Bio-Engineer',
        logo: 'bg-amber-600',
        dateApplied: '1 month ago',
        status: 'Rejected',
        pipelineProgress: 100, // Completed logic, failed outcome
        lastUpdate: 'Position filled'
    },
    {
        id: '5',
        company: 'Weyland-Yutani',
        role: 'Safety Officer',
        logo: 'bg-blue-600',
        dateApplied: '5 hours ago',
        status: 'Applied',
        pipelineProgress: 10,
        lastUpdate: 'Application submitted'
    }
];

// --- COMPONENTS ---

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
    switch (status) {
        case 'Applied': return <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">APPLIED</span>;
        case 'Viewed': return <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">VIEWED</span>;
        case 'Shortlisted': return <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">SHORTLISTED</span>;
        case 'Interview': return <span className="px-2 py-0.5 rounded text-[10px] bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 animate-pulse">INTERVIEW</span>;
        case 'Offer': return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">OFFER RECEIVED</span>;
        case 'Rejected': return <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">ARCHIVED</span>;
        default: return null;
    }
};

const PipelineBar = ({ progress, status }: { progress: number, status: ApplicationStatus }) => {
    const isRejected = status === 'Rejected';
    return (
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    isRejected ? "bg-red-900/50" : "bg-gradient-to-r from-violet-600 to-teal-400"
                )}
            />
        </div>
    );
};

export default function ApplicationsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<'All' | 'Active' | 'Archived'>('All');
    // Mock Role Check
    const userRole = 'candidate';

    if (userRole !== 'candidate') {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-6">
                <div>
                    <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">RESTRICTED ACCESS</h1>
                    <p className="text-zinc-500 mb-6">This application log is for candidates only.</p>
                    <Link href="/dashboard"><Button>Return to Command</Button></Link>
                </div>
            </div>
        );
    }

    const filteredApps = MOCK_APPLICATIONS.filter(app => {
        if (filter === 'All') return true;
        if (filter === 'Active') return app.status !== 'Rejected' && app.status !== 'Offer'; // Assuming Offer is still active but specifically tracking "in-progress" vs complete? Or maybe Offer IS active. Let's keep Offer as Active for 'Active' filter. But Rejected is Archived.
        if (filter === 'Archived') return app.status === 'Rejected' || app.status === 'Offer'; // Let's say Offer is "Done"ish for archive? Or maybe keep Offer in Active. Let's just archive Rejected for now.
        // Clarification: Usually Active = In Progress. Archived = Closed (Hired/Rejected).
        // Let's refine:
        if (filter === 'Archived') return app.status === 'Rejected';
        return app.status !== 'Rejected';
    });

    const activeCount = MOCK_APPLICATIONS.filter(a => a.status !== 'Rejected' && a.status !== 'Offer').length;
    const interviewCount = MOCK_APPLICATIONS.filter(a => a.status === 'Interview').length;
    const offerCount = MOCK_APPLICATIONS.filter(a => a.status === 'Offer').length;

    return (
        <div className="min-h-screen bg-obsidian text-white p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold font-cinzel tracking-wider text-white mb-2 flex items-center gap-3">
                            APPLICATION LOG
                            <div className="h-px flex-1 bg-white/10 w-32" />
                        </h1>
                        <p className="text-zinc-500">Track the status of your active deployments and objectives.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-2 text-center min-w-[100px]">
                            <div className="text-xl font-bold text-white">{activeCount}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Active</div>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-2 text-center min-w-[100px]">
                            <div className="text-xl font-bold text-violet-400">{interviewCount}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Interview</div>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-2 text-center min-w-[100px]">
                            <div className="text-xl font-bold text-amber-400">{offerCount}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Offers</div>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5 w-fit">
                    {(['All', 'Active', 'Archived'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                                filter === f ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* LIST */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredApps.map((app) => (
                            <motion.div
                                key={app.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-950/40 backdrop-blur-sm border border-white/5 rounded-xl p-5 hover:border-violet-500/20 transition-all group"
                            >
                                <div className="flex flex-col md:flex-row gap-6 items-center">

                                    {/* COL 1: IDENTITY */}
                                    <div className="flex items-center gap-4 w-full md:w-1/3">
                                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-lg", app.logo)}>
                                            {app.company.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{app.role}</h3>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <Briefcase className="w-3 h-3" />
                                                <span>{app.company}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <span>{app.dateApplied}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COL 2: PIPELINE */}
                                    <div className="flex-1 w-full space-y-2">
                                        <div className="flex justify-between items-end text-xs mb-1">
                                            <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Status Protocol</span>
                                            <StatusBadge status={app.status} />
                                        </div>
                                        <PipelineBar progress={app.pipelineProgress} status={app.status} />
                                        <p className="text-[10px] text-zinc-500 text-right font-mono mt-1">
                                            Update: {app.lastUpdate}
                                        </p>
                                    </div>

                                    {/* COL 3: ACTIONS */}
                                    <div className="flex items-center justify-end gap-3 w-full md:w-auto min-w-[150px]">
                                        {app.status === 'Interview' && (
                                            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white h-9 px-4 font-bold tracking-wide shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse">
                                                <MessageSquare className="w-3 h-3 mr-2" />
                                                RESPOND
                                            </Button>
                                        )}

                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {app.status !== 'Rejected' && (
                                                <Button variant="ghost" size="icon" className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredApps.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
                            <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-zinc-500 font-bold">No active applications found.</h3>
                            <Link href="/jobs">
                                <Button variant="link" className="text-violet-400">Explore the Marketplace</Button>
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
