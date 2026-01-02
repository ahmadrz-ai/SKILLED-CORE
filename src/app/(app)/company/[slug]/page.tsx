'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin, Users, Globe, Building2, Heart, Share2,
    Pencil, CheckCircle2, Briefcase, Plus, Search
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
    logo: 'bg-violet-600',
    banner: 'bg-gradient-to-r from-violet-900 to-fuchsia-900',
    location: 'San Francisco, CA (Remote-First)',
    founded: '2020',
    employees: '50-100',
    website: 'trivia.global',
    techStack: ['Next.js', 'React Native', 'GraphQL', 'Postgres', 'Redis'],
    gallery: [
        { color: 'bg-violet-500', caption: 'Annual Hackathon 2024' },
        { color: 'bg-indigo-500', caption: 'Team Retreat in Tahoe' },
        { color: 'bg-fuchsia-600', caption: 'Tokyo Office Launch' },
        { color: 'bg-pink-500', caption: 'Community Game Night' },
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

    // Mock Admin Check (Simulating 'Sarah Connor' logged in)
    const isAdmin = true; // In real app: user.companyId === company.id && user.role === 'recruiter'

    return (
        <div className="min-h-screen bg-transparent text-white pb-20 relative">

            {/* HERO BANNER */}
            <div className={cn("relative h-64 md:h-80 w-full overflow-hidden", MOCK_COMPANY.banner)}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian to-transparent" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10">
                        ← Back
                    </Button>
                </div>

                {/* Cover Actions */}
                <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 relative -mt-32">

                {/* HEADER IDENTITY */}
                <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                    {/* Logo */}
                    <div className={cn(
                        "w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-obsidian shadow-2xl flex items-center justify-center text-4xl font-bold bg-zinc-900 relative z-10",
                        MOCK_COMPANY.logo
                    )}>
                        {MOCK_COMPANY.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pb-2">
                        <h1 className="text-3xl md:text-4xl font-bold font-cinzel text-white flex items-center gap-3">
                            {MOCK_COMPANY.name}
                            <CheckCircle2 className="w-6 h-6 text-blue-400 fill-blue-400/10" />
                        </h1>
                        <p className="text-zinc-400 text-lg">{MOCK_COMPANY.tagline}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2 font-mono">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {MOCK_COMPANY.location}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {MOCK_COMPANY.employees} Employees</span>
                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {MOCK_COMPANY.website}</span>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-3 pb-2 w-full md:w-auto">
                        <Button
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={cn(
                                "flex-1 md:flex-none font-bold shadow-lg transition-all",
                                isFollowing
                                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                            )}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Button variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white">
                            Visit Website
                        </Button>
                    </div>
                </div>

                {/* TABS FRAME */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT: MAIN CONTENT */}
                    <div className="flex-1 min-w-0">
                        {/* Tab Navigation */}
                        <div className="flex items-center gap-8 border-b border-white/10 px-2 mb-8 overflow-x-auto">
                            {(['about', 'life', 'jobs', 'people'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "pb-4 text-sm font-bold tracking-wide transition-all relative uppercase whitespace-nowrap",
                                        activeTab === tab ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeCompanyTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
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
                                    className="space-y-8"
                                >
                                    <section className="bg-zinc-950/50 backdrop-blur-md rounded-2xl p-8 border border-white/5">
                                        <h2 className="text-xl font-bold font-cinzel text-white mb-4">OUR MISSION</h2>
                                        <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                                            {MOCK_COMPANY.description}
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Tech Stack</h2>
                                        <div className="flex flex-wrap gap-3">
                                            {MOCK_COMPANY.techStack.map((tech) => (
                                                <div key={tech} className="px-4 py-2 bg-zinc-900 rounded-lg border border-white/5 text-zinc-300 font-mono text-sm">
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
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {MOCK_COMPANY.gallery.map((img, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "rounded-xl overflow-hidden relative group aspect-video cursor-pointer",
                                                img.color
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white font-medium text-sm">{img.caption}</p>
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
                                    className="grid gap-4"
                                >
                                    {MOCK_JOBS.map((job, i) => (
                                        <JobCard key={job.id} job={job} index={i} />
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'people' && (
                                <motion.div
                                    key="people"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                >
                                    {MOCK_COMPANY.people.map((person, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-white/5 hover:border-violet-500/20 transition-all cursor-pointer group">
                                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-white", person.avatar)}>
                                                {person.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors">{person.name}</h4>
                                                <p className="text-xs text-zinc-500">{person.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT: SIDEBAR INFO */}
                    <div className="md:w-80 shrink-0 space-y-6">
                        <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-6 space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Founded</span>
                                    <span className="text-white">{MOCK_COMPANY.founded}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Headquarters</span>
                                    <span className="text-white text-right max-w-[150px]">{MOCK_COMPANY.location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Size</span>
                                    <span className="text-white">{MOCK_COMPANY.employees}</span>
                                </div>
                            </div>
                        </div>

                        {/* ADMIN EDIT FAB */}
                        {isAdmin && (
                            <div className="fixed bottom-6 right-6 lg:static lg:w-full">
                                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-xl shadow-violet-500/20 border border-white/10 group">
                                    <Pencil className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                    EDIT COMPANY PAGE
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
