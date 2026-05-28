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
        pipelineProgress: 100,
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
        case 'Applied': 
            return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--sc-gray-100)] text-[var(--text-body)] border border-[var(--border-default)]">APPLIED</span>;
        case 'Viewed': 
            return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--sc-blue-105)] bg-blue-50 text-[var(--sc-blue-700)] border border-[var(--sc-blue-100)]">VIEWED</span>;
        case 'Shortlisted': 
            return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)]">SHORTLISTED</span>;
        case 'Interview': 
            return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--sc-purple-100)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] animate-pulse">INTERVIEW</span>;
        case 'Offer': 
            return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--sc-green-100)] text-[var(--sc-green-700)] border border-[var(--sc-green-200)] shadow-sm">OFFER RECEIVED</span>;
        case 'Rejected': 
            return <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--sc-red-100)] text-[var(--text-error)] border border-[var(--sc-red-200)]">ARCHIVED</span>;
        default: 
            return null;
    }
};

const PipelineBar = ({ progress, status }: { progress: number, status: ApplicationStatus }) => {
    const isRejected = status === 'Rejected';
    return (
        <div className="w-full h-1.5 bg-[var(--sc-gray-100)] rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    isRejected ? "bg-[var(--sc-red-500)]" : "bg-gradient-to-r from-[var(--sc-purple-500)] to-[var(--sc-purple-650)]"
                )}
            />
        </div>
    );
};

export default function ApplicationsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<'All' | 'Applied' | 'Reviewing' | 'Interview' | 'Offer' | 'Rejected'>('All');
    const userRole = 'candidate'; // Candidate-only pipeline log

    if (userRole !== 'candidate') {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-6 bg-[var(--bg-page)] text-[var(--text-body)]">
                <div className="max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-8 shadow-sm">
                    <ShieldAlert className="w-12 h-12 text-[var(--text-error)] mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-[var(--text-heading)] mb-2 uppercase font-heading">RESTRICTED ACCESS</h1>
                    <p className="text-[var(--text-secondary)] text-sm mb-6">This application log is for candidates only.</p>
                    <Link href="/feed">
                        <Button className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)]">
                            Return to Command
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const filteredApps = MOCK_APPLICATIONS.filter(app => {
        if (filter === 'All') return true;
        if (filter === 'Applied') return app.status === 'Applied';
        if (filter === 'Reviewing') return app.status === 'Viewed' || app.status === 'Shortlisted';
        if (filter === 'Interview') return app.status === 'Interview';
        if (filter === 'Offer') return app.status === 'Offer';
        if (filter === 'Rejected') return app.status === 'Rejected';
        return true;
    });

    const activeCount = MOCK_APPLICATIONS.filter(a => a.status !== 'Rejected' && a.status !== 'Offer').length;
    const interviewCount = MOCK_APPLICATIONS.filter(a => a.status === 'Interview').length;
    const offerCount = MOCK_APPLICATIONS.filter(a => a.status === 'Offer').length;

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 font-sans text-[var(--text-body)]">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border-strong)] pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading uppercase">
                        APPLICATION LOG
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                        Track the status of your active deployments and objectives.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-4 py-2 text-center min-w-[100px] shadow-sm">
                        <div className="text-lg font-black text-[var(--text-heading)]">{activeCount}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">Active</div>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-4 py-2 text-center min-w-[100px] shadow-sm">
                        <div className="text-lg font-black text-[var(--text-brand)]">{interviewCount}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">Interview</div>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-4 py-2 text-center min-w-[100px] shadow-sm">
                        <div className="text-lg font-black text-[var(--text-success)]">{offerCount}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">Offers</div>
                    </div>
                </div>
            </div>

            {/* Pattern B Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Panel: Status Filters (w-72 fixed) */}
                <div className="w-full lg:w-72 flex-shrink-0 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                            Pipeline Stages
                        </span>
                    </div>

                    <div className="flex flex-col space-y-1">
                        {(['All', 'Applied', 'Reviewing', 'Interview', 'Offer', 'Rejected'] as const).map((stage) => {
                            const count = stage === 'All'
                                ? MOCK_APPLICATIONS.length
                                : stage === 'Reviewing'
                                ? MOCK_APPLICATIONS.filter(a => a.status === 'Viewed' || a.status === 'Shortlisted').length
                                : MOCK_APPLICATIONS.filter(a => a.status === stage).length;

                            return (
                                <button
                                    key={stage}
                                    onClick={() => setFilter(stage)}
                                    className={cn(
                                        "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 flex items-center justify-between border-none cursor-pointer",
                                        filter === stage
                                            ? "bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)]"
                                            : "text-[var(--text-sidebar-inactive)] bg-transparent hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-hover)]"
                                    )}
                                >
                                    <span>{stage}</span>
                                    {count > 0 && (
                                        <span className={cn(
                                            "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
                                            filter === stage
                                                ? "bg-[var(--sc-purple-200)] text-[var(--sc-purple-700)]"
                                                : "bg-[var(--sc-gray-200)] text-[var(--sc-gray-700)]"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Applications List (flex-1) */}
                <div className="flex-1 w-full space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredApps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center min-h-[220px] p-8 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-sm">
                                <Briefcase className="w-12 h-12 text-[var(--sc-gray-300)] mt-4" />
                                <h3 className="text-base font-semibold text-[var(--text-heading)] mt-4">No deployments in this stage</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xs leading-relaxed">
                                    You don't have any job applications in this pipeline state. Let's find some matches!
                                </p>
                                <Link href="/jobs" className="mt-4">
                                    <Button className="bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg border-none shadow-sm">
                                        Browse Jobs
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            filteredApps.map((app) => (
                                <motion.div
                                    key={app.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        
                                        {/* Company logo + Job title info */}
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black flex-shrink-0 shadow-inner",
                                                app.logo
                                            )}>
                                                {app.company.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[var(--text-heading)]">{app.role}</h4>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-[var(--text-secondary)] font-medium">
                                                    <span className="font-semibold text-[var(--text-body-strong)]">{app.company}</span>
                                                    <span>•</span>
                                                    <span>Applied {app.dateApplied}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Options */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                                            <StatusBadge status={app.status} />
                                            <button className="text-[var(--icon-default)] hover:text-[var(--icon-strong)] p-1.5 rounded-lg hover:bg-[var(--bg-sidebar-hover)] transition-colors border-none bg-transparent cursor-pointer">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pipeline status details bar */}
                                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
                                        <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--icon-muted)]" /> {app.lastUpdate}</span>
                                            <span className="font-mono text-[var(--sc-purple-650)] font-bold">{app.pipelineProgress}% Complete</span>
                                        </div>
                                        <PipelineBar progress={app.pipelineProgress} status={app.status} />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
