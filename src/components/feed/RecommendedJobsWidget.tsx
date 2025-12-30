"use client";

import Link from "next/link";
import { Briefcase, Building2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Job {
    id: string;
    title: string;
    company: { name: string };
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
}

interface RecommendedJobsWidgetProps {
    jobs: Job[];
}

export function RecommendedJobsWidget({ jobs }: RecommendedJobsWidgetProps) {
    return (
        <motion.div
            className="bg-zinc-900/40 rounded-xl p-6 border border-white/5 backdrop-blur-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Recommended Jobs</h2>
                <Briefcase className="w-4 h-4 text-zinc-600" />
            </div>
            <ul className="space-y-4">
                {jobs.length === 0 ? (
                    <li className="text-zinc-500 text-xs text-center py-4">
                        No active jobs detected.
                    </li>
                ) : jobs.map((job) => (
                    <Link href={`/jobs/${job.id}`} key={job.id}>
                        <li className="group cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <h3 className="font-bold text-sm text-zinc-200 group-hover:text-violet-400 transition-colors">{job.title}</h3>
                            <div className="flex items-center text-xs text-zinc-500 mt-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {job.company.name}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-zinc-600">{job.location}</span>
                                {(job.salaryMin || 0) > 0 && (
                                    <span className="text-xs text-green-400/80 font-mono">
                                        ${(job.salaryMin || 0) / 1000}k - ${(job.salaryMax || 0) / 1000}k
                                    </span>
                                )}
                            </div>
                        </li>
                    </Link>
                ))}
            </ul>
            <div className="pt-4 mt-2 border-t border-white/5 text-center">
                <Link href="/jobs" className="text-xs text-violet-400 hover:text-violet-300 font-bold tracking-wide flex items-center justify-center">
                    VIEW ALL JOBS <TrendingUp className="w-3 h-3 ml-1" />
                </Link>
            </div>
        </motion.div>
    );
}
