"use client";

import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Briefcase, Bookmark, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSaveJob } from "@/app/actions/jobs";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

interface Job {
    id: string;
    title: string;
    company: { name: string; logo?: string | null };
    location: string;
    type: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    createdAt: Date;
    description: string;
    workplaceType: string;
    _count?: { applications: number };
}

export default function JobList({ initialJobs, savedJobIds, userId }: { initialJobs: Job[], savedJobIds: string[], userId?: string }) {
    const [saved, setSaved] = useState<Set<string>>(new Set(savedJobIds));

    const handleSave = async (id: string) => {
        // Optimistic update
        const newSaved = new Set(saved);
        if (newSaved.has(id)) newSaved.delete(id);
        else newSaved.add(id);
        setSaved(newSaved);

        await toggleSaveJob(id);
    };

    if (initialJobs.length === 0) {
        return (
            <EmptyState
                icon={Briefcase}
                title="No jobs match your filters"
                description="Try broadening your search query or removing selected filters to locate new active postings."
                ctaText="Clear Filters"
                ctaHref="/jobs"
            />
        );
    }

    return (
        <div className="space-y-4">
            {initialJobs.map((job) => (
                <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-white border border-[#E5E7EB] hover:border-[#6366F1]/40 rounded-2xl p-6 transition-all hover:bg-slate-50/50 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-lg font-bold text-[#6366F1] border border-[#EEF2FF] overflow-hidden flex-shrink-0">
                                {job.company.logo ? (
                                    <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{job.company.name[0]}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[#111827] group-hover:text-[#4F46E5] transition-colors flex flex-wrap items-center gap-2">
                                    {job.title}
                                    <span className="text-xs font-medium text-[#4F46E5] border border-[#EEF2FF] px-2.5 py-0.5 rounded-full bg-[#EEF2FF]">
                                        {job.workplaceType}
                                    </span>
                                </h3>
                                <div className="flex items-center gap-2 text-[#6B7280] text-sm mt-1">
                                    <Briefcase className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                    <span className="font-medium text-[#374151]">{job.company.name}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave(job.id)}
                            className={cn(
                                "p-2 rounded-lg transition-colors border border-transparent flex-shrink-0",
                                saved.has(job.id) ? "text-[#F59E0B] bg-[#FEF3C7] border-[#FDE68A]" : "text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6]"
                            )}
                        >
                            <Bookmark className={cn("w-4 h-4", saved.has(job.id) && "fill-current")} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F3F4F6] gap-1.5 font-normal py-1">
                            <MapPin className="w-3 h-3 text-[#9CA3AF]" /> {job.location}
                        </Badge>
                        <Badge variant="secondary" className="bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F3F4F6] gap-1.5 font-normal py-1">
                            <Briefcase className="w-3 h-3 text-[#9CA3AF]" /> {job.type}
                        </Badge>
                        {job.salaryMin && (
                            <Badge variant="secondary" className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] hover:bg-[#ECFDF5] gap-1.5 font-normal py-1">
                                <DollarSign className="w-3 h-3 text-[#059669]" />
                                ${job.salaryMin.toLocaleString()} - {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : '+'}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F3F4F6] gap-1.5 font-normal py-1">
                            <Clock className="w-3 h-3 text-[#9CA3AF]" /> {formatDistanceToNow(new Date(job.createdAt))} ago
                        </Badge>
                    </div>

                    <p className="text-[#4B5563] text-sm mb-5 leading-relaxed line-clamp-2">
                        {job.description.replace(/(\*\*|__|^#+\s|`)/g, '')}
                    </p>

                    <div className="flex gap-3">
                        <Link href={`/jobs/${job.id}`} className="flex-1">
                            <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold h-10 shadow-sm group/btn transition-colors">
                                View Intelligence
                                <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
