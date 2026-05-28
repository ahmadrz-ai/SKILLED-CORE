'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin, Users, Globe, Building2, Heart, Share2,
    Pencil, CheckCircle2, Briefcase, Plus, Search, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import JobCard, { JobProps } from '@/components/JobCard';

// --- MOCK DATA ---
const MOCK_COMPANY = {
    id: 'trivia-global',
    name: 'Trivia.Global',
    tagline: 'Gamifying the World Knowledge',
    description: "We are on a mission to organize the world's trivia and make it universally playable. From pub quizzes to enterprise gamification, Trivia.Global is building the engine that powers knowledge checks everywhere.",
    logo: 'bg-gradient-to-tr from-violet-600 to-indigo-650',
    banner: 'bg-gradient-to-r from-violet-900 to-fuchsia-900',
    location: 'San Francisco, CA (Remote-First)',
    founded: '2020',
    employees: '50-100',
    website: 'trivia.global',
    techStack: ['Next.js', 'React Native', 'GraphQL', 'Postgres', 'Redis'],
    gallery: [
        { color: 'bg-gradient-to-tr from-violet-500 to-indigo-500', caption: 'Annual Hackathon 2024' },
        { color: 'bg-gradient-to-tr from-indigo-500 to-cyan-500', caption: 'Team Retreat in Tahoe' },
        { color: 'bg-gradient-to-tr from-fuchsia-600 to-pink-500', caption: 'Tokyo Office Launch' },
        { color: 'bg-gradient-to-tr from-pink-500 to-rose-400', caption: 'Community Game Night' },
    ],
    people: [
        { name: 'Sarah Connor', role: 'Head of Recruiting', avatar: 'bg-indigo-500' },
        { name: 'Dr. House', role: 'CTO', avatar: 'bg-emerald-600' },
        { name: 'Sherlock Holmes', role: 'Lead Architect', avatar: 'bg-amber-700' },
    ]
};

const MOCK_JOBS: JobProps[] = [
    {
        id: '1',
        title: 'Senior Frontend Architect',
        company: 'Trivia.Global',
        type: 'Remote',
        postedTime: '2 days ago',
        salary: '$180k - $240k',
        experience: 'Senior',
        tags: ['React', 'Next.js', 'WebGL'],
        logo: 'bg-violet-600',
        contract: 'Full-Time'
    },
    {
        id: '2',
        title: 'User Experience Lead',
        company: 'Trivia.Global',
        type: 'Hybrid',
        postedTime: '1 week ago',
        salary: '$150k - $200k',
        experience: 'Senior',
        tags: ['Figma', 'Prototyping', 'User Research'],
        logo: 'bg-violet-600',
        contract: 'Full-Time'
    }
];

export default function CompanyPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'about' | 'life' | 'jobs' | 'people'>('about');
    const [isFollowing, setIsFollowing] = useState(false);

    const isAdmin = true;

    return (
        <div className="min-h-screen bg-transparent text-[var(--text-body)] pb-20 relative font-sans">

            {/* HERO BANNER */}
            <div className={cn("relative h-60 md:h-72 w-full overflow-hidden rounded-t-2xl", MOCK_COMPANY.banner)}>
                <div className="absolute inset-0 bg-black/30" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 rounded-lg min-h-[36px] flex items-center px-3 gap-1">
                        ← Back
                    </Button>
                </div>

                {/* Cover Actions */}
                <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 relative -mt-24">

                {/* HEADER IDENTITY */}
                <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                    {/* Logo */}
                    <div className={cn(
                        "w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-[var(--bg-card)] shadow-md flex items-center justify-center text-4xl font-black text-white relative z-10 shrink-0",
                        MOCK_COMPANY.logo
                    )}>
                        {MOCK_COMPANY.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pb-1 text-left">
                        <h1 className="text-2xl font-bold font-heading text-[var(--text-heading)] flex items-center gap-2.5 leading-none">
                            {MOCK_COMPANY.name}
                            <CheckCircle2 className="w-5 h-5 text-[var(--sc-blue-700)] fill-[var(--sc-blue-100)]" />
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] mt-1.5 font-medium">{MOCK_COMPANY.tagline}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-tertiary)] mt-3 font-semibold uppercase tracking-wide">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {MOCK_COMPANY.location}</span>
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {MOCK_COMPANY.employees} Employees</span>
                            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {MOCK_COMPANY.website}</span>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-3 pb-1 w-full md:w-auto flex-shrink-0">
                        <Button
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={cn(
                                "flex-1 md:flex-none font-bold text-xs py-2 px-4 rounded-lg tracking-wider transition-all select-none",
                                isFollowing
                                    ? "bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)]"
                                    : "bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] border-none shadow-sm"
                            )}
                        >
                            {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                        </Button>
                        <Button variant="outline" className="border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] font-bold text-xs py-2 px-4 rounded-lg select-none shadow-sm">
                            Visit Site
                        </Button>
                    </div>
                </div>

                {/* TABS FRAME */}
                <div className="space-y-6">
                    
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-6 border-b border-[var(--border-strong)] px-1 overflow-x-auto">
                        {(['about', 'life', 'jobs', 'people'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-3.5 text-xs font-bold tracking-widest transition-all relative uppercase border-none bg-transparent cursor-pointer whitespace-nowrap",
                                    activeTab === tab ? "text-[var(--text-brand)] font-black" : "text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeCompanyTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--sc-purple-600)]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'about' && (
                            <motion.div
                                key="about"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 text-left"
                            >
                                <section className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-6 shadow-sm">
                                    <h2 className="text-sm font-bold text-[var(--text-heading)] font-heading uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-[var(--sc-purple-600)]" />
                                        Our Mission
                                    </h2>
                                    <p className="text-sm text-[var(--text-body)] leading-relaxed font-medium">
                                        {MOCK_COMPANY.description}
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Tech Stack</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {MOCK_COMPANY.techStack.map((tech) => (
                                            <div 
                                                key={tech} 
                                                className="px-3 py-1.5 bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] text-[var(--sc-purple-700)] font-semibold rounded-lg text-xs font-mono shadow-xs"
                                            >
                                                {tech}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'life' && (
                            <motion.div
                                key="life"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left"
                            >
                                {MOCK_COMPANY.gallery.map((item, i) => (
                                    <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                        <div className={cn("h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]", item.color)} />
                                        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
                                            <p className="text-xs font-bold text-[var(--text-heading)]">{item.caption}</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'jobs' && (
                            <motion.div
                                key="jobs"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4 text-left"
                            >
                                {MOCK_JOBS.length > 0 ? (
                                    MOCK_JOBS.map((job, idx) => (
                                        <JobCard key={job.id} job={job} index={idx} />
                                    ))
                                ) : (
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] border-dashed rounded-xl p-8 text-center text-[var(--text-secondary)] shadow-sm">
                                        <Briefcase className="w-8 h-8 text-[var(--icon-muted)] mx-auto mb-3" />
                                        <p className="font-bold text-sm text-[var(--text-heading)]">No Open Roles</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Follow the company to get notified of future deployments.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'people' && (
                            <motion.div
                                key="people"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left"
                            >
                                {MOCK_COMPANY.people.map((person, i) => (
                                    <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4 flex items-center gap-3 shadow-sm hover:border-[var(--border-selected)] transition-all">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-inner", person.avatar)}>
                                            {person.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-[var(--text-heading)] truncate">{person.name}</p>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-semibold truncate mt-0.5 uppercase tracking-wider">{person.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
