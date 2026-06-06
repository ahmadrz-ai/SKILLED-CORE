"use client";

import Link from "next/link";
import { Briefcase, Building2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function RecommendedJobsWidget({ jobs, isFolded = false, isCollapsed = false }: RecommendedJobsWidgetProps & { isFolded?: boolean; isCollapsed?: boolean }) {
    // Keep header, top job, and the "View all jobs" button visible on scroll; only
    // the extra jobs fold away.
    const foldExtras = isFolded || isCollapsed;

    return (
        <motion.div
            className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* HEADER — always visible */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-widest bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded">
                    Recommended Jobs
                </span>
                <Briefcase className="w-4 h-4 text-[#6366F1]" />
            </div>

            <div className="px-4 pb-4">
                <ul className="space-y-3">
                    {jobs.length === 0 ? (
                        <li className="text-[#9CA3AF] text-xs text-center py-6 italic">
                            No active jobs detected.
                        </li>
                    ) : (
                        <>
                            {/* Top job — always visible */}
                            <Link href={`/jobs/${jobs[0].id}`} className="block">
                                <li className="group cursor-pointer p-3 rounded-xl hover:bg-[#F9FAFB] transition-all border border-transparent hover:border-[#E5E7EB] duration-200">
                                    <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#6366F1] transition-colors leading-snug">
                                        {jobs[0].title}
                                    </h3>
                                    <div className="flex items-center text-xs text-[#6B7280] font-medium mt-1.5">
                                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#9CA3AF]" />
                                        {jobs[0].company.name}
                                    </div>
                                    <div className="flex justify-between items-center mt-2.5">
                                        <span className="text-xs text-[#9CA3AF] font-medium">{jobs[0].location}</span>
                                        {(jobs[0].salaryMin || 0) > 0 && (
                                            <span className="text-[10px] text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full font-extrabold shadow-sm">
                                                ${(jobs[0].salaryMin || 0) / 1000}k - ${(jobs[0].salaryMax || 0) / 1000}k
                                            </span>
                                        )}
                                    </div>
                                </li>
                            </Link>

                            {/* Extra jobs fold when scrolled */}
                            <AnimatePresence initial={false}>
                                {!foldExtras && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden flex flex-col gap-3 pt-1"
                                    >
                                        {jobs.slice(1).map((job) => (
                                            <Link href={`/jobs/${job.id}`} key={job.id} className="block">
                                                <li className="group cursor-pointer p-3 rounded-xl hover:bg-[#F9FAFB] transition-all border border-transparent hover:border-[#E5E7EB] duration-200">
                                                    <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#6366F1] transition-colors leading-snug">
                                                        {job.title}
                                                    </h3>
                                                    <div className="flex items-center text-xs text-[#6B7280] font-medium mt-1.5">
                                                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#9CA3AF]" />
                                                        {job.company.name}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2.5">
                                                        <span className="text-xs text-[#9CA3AF] font-medium">{job.location}</span>
                                                        {(job.salaryMin || 0) > 0 && (
                                                            <span className="text-[10px] text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full font-extrabold shadow-sm">
                                                                ${(job.salaryMin || 0) / 1000}k - ${(job.salaryMax || 0) / 1000}k
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </ul>

                {/* Destination button — always visible */}
                <div className="pt-3.5 mt-2 border-t border-[#E5E7EB] text-center">
                    <Link href="/jobs" className="text-xs text-[#6366F1] hover:text-[#4F46E5] font-bold tracking-wider uppercase flex items-center justify-center gap-1 hover:underline transition-all">
                        View all jobs <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
