'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, GraduationCap, DollarSign, Star, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TalentProps {
    id: string;
    name: string;
    role: string;
    matchScore: number;
    experience: string;
    education: string;
    salaryExpectation: string;
    location: string;
    skills: string[];
    avatar?: string;
}

import { useRouter } from 'next/navigation';

export default function TalentCard({ talent, index }: { talent: TalentProps; index: number }) {
    const router = useRouter();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <div className="group relative bg-zinc-900/50 border border-white/5 hover:border-teal-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(45,212,191,0.15)] flex flex-col h-full backdrop-blur-sm">

                {/* Header / Avatar Area */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden relative group-hover:border-teal-500/30 transition-colors">
                            {/* Avatar Fallback */}
                            <User className="w-8 h-8 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                            {/* Status Indicator */}
                            <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-teal-300 transition-colors">{talent.name}</h3>
                            <p className="text-teal-400 font-medium text-sm">{talent.role}</p>
                            <div className="flex items-center text-xs text-zinc-500 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {talent.location}
                            </div>
                        </div>
                    </div>

                    {/* Match Score */}
                    <div className="flex flex-col items-end">
                        <div className="text-2xl font-bold text-white font-mono">{talent.matchScore}%</div>
                        <div className="text-xs text-teal-500 uppercase tracking-wider font-bold">Match</div>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="px-6 py-4 bg-white/5 border-y border-white/5 grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500 uppercase">Exp</span>
                        <span className="text-sm font-bold text-zinc-200">{talent.experience}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-x border-white/5">
                        <span className="text-xs text-zinc-500 uppercase">Edu</span>
                        <span className="text-sm font-bold text-zinc-200">{talent.education}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500 uppercase">Rate</span>
                        <span className="text-sm font-bold text-zinc-200">{talent.salaryExpectation}</span>
                    </div>
                </div>

                {/* Skills */}
                <div className="p-6 flex-1">
                    <div className="flex flex-wrap gap-2">
                        {talent.skills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-teal-400 hover:border-teal-500/30 transition-colors">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 grid grid-cols-4 gap-2">
                    <Button variant="ghost" className="col-span-1 h-10 border border-white/10 hover:bg-zinc-800 hover:text-yellow-400 text-zinc-500">
                        <Star className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" className="col-span-1 h-10 border border-white/10 hover:bg-zinc-800 hover:text-teal-400 text-zinc-500" onClick={() => router.push(`/messages?userId=${talent.id}`)}>
                        <MessageSquare className="w-5 h-5" />
                    </Button>
                    <Button className="col-span-2 h-10 bg-teal-600/10 text-teal-400 border border-teal-500/50 hover:bg-teal-600 hover:text-black font-bold tracking-wide transition-all">
                        VIEW PROFILE
                    </Button>
                </div>

            </div>
        </motion.div>
    );
}
