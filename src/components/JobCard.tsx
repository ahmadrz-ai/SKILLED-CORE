'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, Building2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JobProps {
    id: string;
    title: string;
    company: string;
    type: 'Remote' | 'Hybrid' | 'On-Site';
    postedTime: string;
    salary: string;
    experience: 'Junior' | 'Mid' | 'Mid-Senior' | 'Senior' | 'Lead';
    tags: string[];
    logo?: string;
    contract?: 'Full-Time' | 'Contract' | 'Freelance';
    isApplied?: boolean;
}

interface JobCardProps {
    job: JobProps;
    index: number;
    onApply?: (id: string) => void;
}

export default function JobCard({ job, index, onApply }: JobCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <div className="group relative h-full bg-zinc-900 border border-white/5 hover:border-violet-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)] flex flex-col">

                {/* Header */}
                <div className="p-5 flex justify-between items-start border-b border-white/5 bg-white/[0.02]">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10 group-hover:border-violet-500/30 transition-colors relative overflow-hidden">
                            {job.logo ? (
                                <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-6 h-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white leading-tight group-hover:text-violet-300 transition-colors">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-zinc-400 font-medium">
                                    {job.company}
                                </p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/5 uppercase tracking-wider">
                                    {job.type}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500 font-mono">
                        <Clock className="w-3 h-3 mr-1" />
                        {job.postedTime}
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag, i) => (
                            <div key={i} className="px-2 py-1 rounded-md text-xs font-mono font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 uppercase tracking-wider">Salary Badge</span>
                            <span className="text-teal-400 font-bold font-mono text-sm">{job.salary}</span>
                        </div>
                    </div>

                    <Button
                        onClick={() => onApply && !job.isApplied ? onApply(job.id) : undefined}
                        disabled={job.isApplied}
                        className={cn(
                            "w-full transition-all duration-300 font-bold tracking-wide",
                            job.isApplied
                                ? "bg-green-600/20 text-green-400 border border-green-500/50 cursor-default hover:bg-green-600/20"
                                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.5)]"
                        )}
                    >
                        {job.isApplied ? (
                            <>
                                APPLICATION SENT
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2 fill-current" />
                                EASY APPLY
                            </>
                        )}
                    </Button>
                </div>

            </div>
        </motion.div>
    );
}
