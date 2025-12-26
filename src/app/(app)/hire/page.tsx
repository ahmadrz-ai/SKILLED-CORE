'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, User, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterDeck } from '@/components/FilterDeck';
import TalentCard, { TalentProps } from '@/components/TalentCard';
import Link from 'next/link';
import { getPlan } from '@/app/actions/credits';
import { useEffect } from 'react';

// Mock Data for Candidates
const MOCK_TALENT: TalentProps[] = [
    {
        id: '1',
        name: 'Elena Fisher',
        role: 'Senior Frontend Architect',
        matchScore: 98,
        experience: '8 Yrs',
        education: 'Masters',
        salaryExpectation: '$140k',
        location: 'San Francisco',
        skills: ['React', 'TypeScript', 'WebGL', 'Three.js'],
        avatar: '/avatars/talent-1.png'
    },
    {
        id: '2',
        name: 'Marcus Holloway',
        role: 'Full Stack Engineer',
        matchScore: 94,
        experience: '5 Yrs',
        education: 'Bachelors',
        salaryExpectation: '$110k',
        location: 'Remote (Oakland)',
        skills: ['Node.js', 'PostgreSQL', 'Python', 'AWS'],
        avatar: '/avatars/talent-2.png'
    },
    {
        id: '3',
        name: 'Kate Walker',
        role: 'AI / ML Specialist',
        matchScore: 91,
        experience: '6 Yrs',
        education: 'PhD',
        salaryExpectation: '$180k',
        location: 'New York',
        skills: ['PyTorch', 'TensorFlow', 'CUDA', 'Python'],
        avatar: '/avatars/talent-3.png'
    },
    {
        id: '4',
        name: 'Sam Porter',
        role: 'DevOps Engineer',
        matchScore: 88,
        experience: '7 Yrs',
        education: 'Bachelors',
        salaryExpectation: '$130k',
        location: 'Seattle',
        skills: ['Docker', 'Kubernetes', 'Go', 'GCP'],
        avatar: '/avatars/talent-4.png'
    },
    {
        id: '5',
        name: 'Lara Croft',
        role: 'Product Designer',
        matchScore: 85,
        experience: '9 Yrs',
        education: 'Masters',
        salaryExpectation: '$125k',
        location: 'London',
        skills: ['Figma', 'Prototyping', 'UX Research', 'HTML/CSS'],
        avatar: '/avatars/talent-5.png'
    },
    {
        id: '6',
        name: 'Gordon Freeman',
        role: 'Systems Physicist',
        matchScore: 99,
        experience: '12 Yrs',
        education: 'PhD',
        salaryExpectation: '$200k',
        location: 'Black Mesa',
        skills: ['C++', 'Physics Engines', 'Rust', 'Math'],
        avatar: '/avatars/talent-6.png'
    },
];

export default function HirePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<string>("BASIC");

    useEffect(() => {
        getPlan().then(setCurrentPlan);
    }, []);

    // Mock Permission Check could go here. 
    // real app would redirect or show "Access Denied" if user !== Recruiter.

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-bold font-cinzel tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-700"
                    >
                        TALENT SEARCH
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-400 font-mono text-sm tracking-widest uppercase"
                    >
                        Elite Operatives // Verified Credentials
                    </motion.p>
                </div>

                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <div className="flex gap-3">
                        <Link href="/jobs/create">
                            <Button className="bg-zinc-900 border border-teal-500/30 text-teal-400 hover:text-black hover:bg-teal-500 transition-all font-mono">
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                POST NEW JOB
                            </Button>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative w-full md:w-96 flex gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                            <Input
                                placeholder="Search by Role, Skill, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-zinc-900/50 border-white/10 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 backdrop-blur-sm transition-all"
                            />
                        </div>
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                            className={`aspect-square h-11 w-11 p-0 ${showFilters ? 'bg-teal-600 border-teal-500 hover:bg-teal-500' : 'bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-zinc-400'}`}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Advanced Filters */}
            {/* Advanced Filters Modal */}
            <FilterDeck isOpen={showFilters} onClose={() => setShowFilters(false)} />

            {/* Talent Grid */}
            {/* Talent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                {MOCK_TALENT.slice(0, currentPlan === 'BASIC' ? 3 : undefined).map((talent, index) => (
                    <TalentCard key={talent.id} talent={talent} index={index} />
                ))}

                {/* VISUAL PAYWALL FOR BASIC USERS */}
                {currentPlan === 'BASIC' && (
                    <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pb-12 z-20">
                        <div className="bg-zinc-900/90 border border-teal-500/30 p-8 rounded-2xl backdrop-blur-xl max-w-md text-center shadow-2xl shadow-teal-500/10">
                            <ShieldAlert className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Unlock</h3>
                            <p className="text-zinc-400 mb-6">
                                Basic operatives are limited to 3 profile views per session. Access the full database with an Ultra clearance.
                            </p>
                            <Link href="/credits">
                                <Button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-wider">
                                    UPGRADE CLEARANCE
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
