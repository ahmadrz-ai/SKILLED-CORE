"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, ChevronRight, Lock, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Assessment = {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string | null;
    _count: { questions: number };
};

export default function AssessmentList({ assessments }: { assessments: Assessment[] }) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // Dynamic category collection
    const categories = ["ALL", ...Array.from(new Set(assessments.map(a => a.category)))];

    const filtered = selectedCategory === "ALL"
        ? assessments
        : assessments.filter(a => a.category === selectedCategory);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start font-sans">
            
            {/* Left Sidebar Filters (w-72 fixed) */}
            <div className="w-full lg:w-72 flex-shrink-0 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl p-4 space-y-3 shadow-sm">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 block">
                    Skill Fields
                </span>

                <div className="flex flex-col space-y-1">
                    {categories.map((category) => {
                        const count = category === "ALL" 
                            ? assessments.length 
                            : assessments.filter(a => a.category === category).length;

                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 flex items-center justify-between border-none cursor-pointer uppercase",
                                    selectedCategory === category
                                        ? "bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)]"
                                        : "text-[var(--text-sidebar-inactive)] bg-transparent hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-hover)]"
                                )}
                            >
                                <span>{category === "ALL" ? "All Fields" : category}</span>
                                <span className={cn(
                                    "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
                                    selectedCategory === category
                                        ? "bg-[var(--sc-purple-200)] text-[var(--sc-purple-700)]"
                                        : "bg-[var(--sc-gray-200)] text-[var(--sc-gray-700)]"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Side: Assessments Grid (flex-1) */}
            <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((assessment, i) => (
                            <motion.div
                                key={assessment.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-6 shadow-sm hover:shadow-[var(--shadow-md)] transition-all overflow-hidden flex flex-col justify-between min-h-[220px]"
                            >
                                {/* Subtle purple inner glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--sc-purple-50)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="relative z-10 flex flex-col h-full justify-between flex-1">
                                    
                                    {/* Icon & Badge Row */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-[var(--sc-purple-50)] rounded-xl border border-[var(--sc-purple-25)] group-hover:scale-105 transition-transform duration-300">
                                            <Brain className="w-5 h-5 text-[var(--text-brand)]" />
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] text-[9px] text-[var(--sc-purple-700)] font-black uppercase tracking-wider">
                                            {assessment.category}
                                        </span>
                                    </div>

                                    {/* Info text */}
                                    <div className="flex-1 flex flex-col justify-start">
                                        <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1.5 group-hover:text-[var(--text-brand)] transition-colors">
                                            {assessment.title}
                                        </h3>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5 line-clamp-3 font-medium">
                                            {assessment.description}
                                        </p>
                                    </div>

                                    {/* Bottom action stats row */}
                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono font-bold tracking-wider">
                                            <span>{assessment._count.questions} QUESTIONS</span>
                                            <span>•</span>
                                            <span>15 MIN</span>
                                        </div>

                                        <Link href={`/assessments/${assessment.id}`}>
                                            <Button 
                                                size="sm" 
                                                className="bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] font-bold text-xs px-3.5 py-1.5 rounded-lg group-hover:translate-x-0.5 transition-transform cursor-pointer shadow-sm select-none"
                                            >
                                                Start <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Coming Soon Card */}
                        <motion.div
                            layout
                            className="border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary-panel)] rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[220px]"
                        >
                            <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-full mb-3 shadow-sm">
                                <Lock className="w-5 h-5 text-[var(--icon-muted)]" />
                            </div>
                            <h3 className="text-xs font-bold text-[var(--text-heading)] mb-1 uppercase tracking-wide">More coming soon</h3>
                            <p className="text-[10px] text-[var(--text-secondary)] max-w-[200px] leading-relaxed font-semibold">
                                New skill verification protocols are currently undergoing network compiling.
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
