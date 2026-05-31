"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, ChevronRight, Lock, Play, Award, Sparkles, Terminal, Calendar } from "lucide-react";
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

type VerifiedSkill = {
    id: string;
    userId: string;
    skillId: string;
    name: string;
    description: string;
    status: string;
    verifiedAt: Date | string;
    depthScore: number;
};

export default function AssessmentList({ 
    assessments, 
    verifiedSkills = [] 
}: { 
    assessments: Assessment[]; 
    verifiedSkills?: VerifiedSkill[];
}) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // Dynamic category collection
    const categories = ["ALL", ...Array.from(new Set(assessments.map(a => a.category)))];

    const filtered = selectedCategory === "ALL"
        ? assessments
        : assessments.filter(a => a.category === selectedCategory);

    // Render corresponding dynamic icon based on skillId
    const getBadgeIcon = (skillId: string) => {
        const id = skillId.toUpperCase();
        if (id.includes("PROMPT") || id.includes("ENGINEERING")) {
            return <Sparkles className="w-5 h-5 text-[var(--sc-purple-600)]" />;
        }
        if (id.includes("JAVASCRIPT") || id.includes("LOGIC") || id.includes("JS")) {
            return <Terminal className="w-5 h-5 text-[var(--sc-purple-600)]" />;
        }
        return <Award className="w-5 h-5 text-[var(--sc-purple-600)]" />;
    };

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

            {/* Right Side: Grid Wrapper (flex-1) */}
            <div className="flex-1 w-full space-y-8">
                
                {/* 1. Verified Skill Credentials Grid */}
                {verifiedSkills && verifiedSkills.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                            <Award className="w-5 h-5 text-[var(--sc-purple-600)]" />
                            <h2 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                                Your Verified Credentials ({verifiedSkills.length})
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {verifiedSkills.map((badge) => (
                                <div
                                    key={badge.id}
                                    className="group relative bg-gradient-to-br from-[var(--bg-card)] to-[var(--sc-purple-50)]/30 border border-[var(--border-card)] rounded-xl p-5 shadow-sm hover:shadow-[var(--shadow-md)] hover:border-[var(--sc-purple-300)] transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[190px]"
                                >
                                    {/* Accent brand border on left */}
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--sc-purple-600)]" />
                                    
                                    <div className="relative z-10 flex flex-col h-full justify-between flex-1 pl-1">
                                        {/* Icon + Verified Pill Row */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 bg-gradient-to-br from-[var(--sc-purple-100)] to-[var(--sc-purple-50)] rounded-xl border border-[var(--sc-purple-200)] shadow-sm">
                                                {getBadgeIcon(badge.skillId)}
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-700 font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-sm select-none">
                                                <CheckCircle className="w-2.5 h-2.5 text-emerald-600 fill-emerald-100" />
                                                {badge.status}
                                            </span>
                                        </div>

                                        {/* Title + Desc */}
                                        <div className="mb-4">
                                            <h3 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wide group-hover:text-[var(--text-brand)] transition-colors mb-1">
                                                {badge.name || badge.skillId.replace(/_/g, " ")}
                                            </h3>
                                            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium line-clamp-2">
                                                {badge.description}
                                            </p>
                                        </div>

                                        {/* Depth Score Indicator + Verification Date */}
                                        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center text-[9px] font-bold font-mono tracking-wider text-[var(--text-tertiary)]">
                                                    <span>EXPERTISE DEPTH</span>
                                                    <span className="text-[var(--sc-purple-600)]">{badge.depthScore}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-[var(--sc-purple-400)] to-[var(--sc-purple-600)] rounded-full transition-all duration-500"
                                                        style={{ width: `${badge.depthScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)] font-mono font-bold">
                                                <Calendar className="w-3 h-3 text-[var(--icon-muted)]" />
                                                <span>VERIFIED ON: {new Date(badge.verifiedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Available Evaluations Grid */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                        <Brain className="w-5 h-5 text-[var(--text-brand)]" />
                        <h2 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                            Available Skill Evaluations
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((assessment) => (
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
                            
                            {/* Static Info Onboarding Card in Place of Mock Coming Soon */}
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
        </div>
    );
}
