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
            <div className="text-center py-20 bg-zinc-900/20 rounded-2xl border border-white/5 border-dashed">
                <Briefcase className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Operations Found</h3>
                <p className="text-zinc-500">Adjust your filter parameters to locate new contracts.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {initialJobs.map((job) => (
                <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-zinc-900/40 border border-white/5 hover:border-teal-500/30 rounded-2xl p-6 transition-all hover:bg-zinc-900/60"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold text-white border border-white/10 overflow-hidden">
                                {job.company.logo ? (
                                    <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{job.company.name[0]}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-teal-400 transition-colors flex items-center gap-2">
                                    {job.title}
                                    <span className="text-xs font-normal text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full bg-zinc-900/50">
                                        {job.workplaceType}
                                    </span>
                                </h3>
                                <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                                    <Briefcase className="w-3 h-3" />
                                    {job.company.name}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave(job.id)}
                            className={cn(
                                "p-2 rounded-lg transition-colors border border-transparent",
                                saved.has(job.id) ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Bookmark className={cn("w-5 h-5", saved.has(job.id) && "fill-current")} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-6">
                        <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-400 border border-white/5 gap-1.5 font-normal">
                            <MapPin className="w-3 h-3" /> {job.location}
                        </Badge>
                        <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-400 border border-white/5 gap-1.5 font-normal">
                            <Briefcase className="w-3 h-3" /> {job.type}
                        </Badge>
                        {job.salaryMin && (
                            <Badge variant="secondary" className="bg-zinc-800/50 text-emerald-400/80 border border-emerald-500/20 gap-1.5 font-normal">
                                <DollarSign className="w-3 h-3" />
                                ${job.salaryMin.toLocaleString()} - {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : '+'}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-500 border border-white/5 gap-1.5 font-normal">
                            <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(job.createdAt))} ago
                        </Badge>
                    </div>

                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed line-clamp-2">
                        {job.description.replace(/(\*\*|__|^#+\s|`)/g, '')}
                    </p>

                    <div className="flex gap-3">
                        <Link href={`/jobs/${job.id}`} className="flex-1">
                            <Button className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-11 group/btn">
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
