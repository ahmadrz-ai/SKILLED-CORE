"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, ChevronDown, RefreshCw, Check, BrainCircuit, Shield, GraduationCap, DollarSign, Clock, Layers, Code, Server } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface FilterDeckProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Custom Components (Omega Standard) ---

const SkillBadge = ({
    label,
    active,
    onClick
}: {
    label: string;
    active: boolean;
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={cn(
            "px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-200 backdrop-blur-sm",
            active
                ? "bg-violet-600 text-white border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white"
        )}
    >
        {label}
    </button>
);

const RadioBadge = ({
    label,
    active,
    onClick
}: {
    label: string;
    active: boolean;
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex-1 px-3 py-2 rounded-md text-xs font-mono border transition-all duration-200 text-center",
            active
                ? "bg-violet-600 text-white border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.5)] font-bold"
                : "bg-zinc-900 text-gray-400 border-zinc-800 hover:bg-zinc-800 hover:text-gray-200"
        )}
    >
        {label}
    </button>
);

const GlassDropdown = ({
    label,
    value,
    options,
    onChange,
    placeholder = "Select Level"
}: {
    label: string;
    value: string | null;
    options: string[];
    onChange: (val: string) => void;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-2" ref={containerRef}>
            <label className="text-xs text-gray-400 font-mono">{label}</label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between bg-zinc-900 border rounded-md py-3 px-4 text-sm font-mono transition-all duration-200",
                        isOpen
                            ? "border-violet-500/50 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                            : "border-zinc-800 text-gray-300 hover:border-violet-500/30"
                    )}
                >
                    <span className={!value ? "text-zinc-500" : ""}>{value || placeholder}</span>
                    <ChevronDown className={cn(
                        "w-4 h-4 text-gray-500 transition-transform duration-300",
                        isOpen && "rotate-180 text-violet-400"
                    )} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 z-[100]"
                        >
                            <div className="bg-zinc-950 border border-violet-500/30 rounded-md shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/50">
                                {options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 text-sm font-mono text-left transition-colors border-b border-zinc-800/50 last:border-0",
                                            value === option
                                                ? "bg-violet-900/40 text-white"
                                                : "text-gray-400 hover:bg-violet-900/20 hover:text-white"
                                        )}
                                    >
                                        <span>{option}</span>
                                        {value === option && <Check className="w-3 h-3 text-violet-400" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon, isOpen, onClick }: { title: string; icon?: any; isOpen: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 text-left group border-b border-zinc-800/50"
    >
        <div className="flex items-center space-x-2">
            {Icon && <Icon className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />}
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-violet-400 transition-colors">
                {title}
            </span>
        </div>
        <ChevronDown
            className={cn(
                "w-4 h-4 text-gray-500 transition-transform duration-300",
                isOpen && "rotate-180 text-violet-400"
            )}
        />
    </button>
);

const SalaryInput = ({
    label,
    value,
    onChange,
    placeholder = "0"
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}) => (
    <div className="space-y-2 flex-1">
        <label className="text-xs text-gray-400 font-mono">{label}</label>
        <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm group-focus-within:text-violet-400 transition-colors">$</span>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black border border-violet-500/30 rounded-md py-2.5 pl-7 pr-3 text-sm font-mono text-white focus:outline-none focus:border-violet-500 focus:shadow-[0_0_15px_rgba(124,58,237,0.2)] transition-all placeholder:text-zinc-700 hover:border-violet-500/50"
            />
        </div>
    </div>
);

// --- Main Component ---

export function FilterDeck({ isOpen, onClose }: FilterDeckProps) {
    // --- State Management ---
    const [sections, setSections] = useState({
        ai: true,
        education: true,
        stack: true,
        core: true
    });

    // Inputs
    const [aiSkills, setAiSkills] = useState<string[]>([]);
    const [education, setEducation] = useState<string | null>(null);
    const [stack, setStack] = useState<string[]>([]); // Consolidated stack array
    const [security, setSecurity] = useState<string | null>(null);
    const [noticePeriod, setNoticePeriod] = useState<string | null>(null);
    const [minSalary, setMinSalary] = useState<string>("");
    const [maxSalary, setMaxSalary] = useState<string>("");

    // --- Data Constants ---

    const AI_DIRECTORATE = {
        "Roles": ["Prompt Engineer", "AI Architect", "ML Engineer", "Data Scientist"],
        "Generative Tech": ["RAG Implementation", "LLM Fine-Tuning", "Stable Diffusion", "Midjourney"],
        "Frameworks": ["LangChain", "TensorFlow", "PyTorch", "Hugging Face", "Pinecone"]
    };

    const EDUCATION_LEVELS = [
        "Matriculation",
        "Intermediate (FSc/ICS)",
        "Diploma (DAE)",
        "Bachelors (BS)",
        "Masters (MS)",
        "PhD",
        "Post-Doc"
    ];

    const TECH_STACK = {
        "Languages": ["Python", "TypeScript", "Rust", "Go", "C++", "Swift"],
        "Infrastructure": ["Docker", "Kubernetes", "AWS", "Terraform"]
    };

    const SECURITY_OPTIONS = ["None", "Secret", "Top Secret", "Cosmic"];
    const NOTICE_OPTIONS = ["Immediate", "15 Days", "30 Days", "3 Months"];

    // --- Logic ---
    const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleAiSkill = (skill: string) => {
        setAiSkills(prev => prev.includes(skill) ? prev.filter(t => t !== skill) : [...prev, skill]);
    };

    const toggleStack = (tech: string) => {
        setStack(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    };

    const resetFilters = () => {
        setAiSkills([]);
        setEducation(null);
        setStack([]);
        setSecurity(null);
        setNoticePeriod(null);
        setMinSalary("");
        setMaxSalary("");
    };

    const activeCount = useMemo(() => {
        let count = 0;
        if (aiSkills.length) count += aiSkills.length;
        if (education) count++;
        if (stack.length) count += stack.length;
        if (security) count++;
        if (noticePeriod) count++;
        if (minSalary || maxSalary) count++;
        return count;
    }, [aiSkills, education, stack, security, noticePeriod, minSalary, maxSalary]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Glass Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Filter Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-zinc-950/95 backdrop-blur-xl border-l border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-violet-600/10 rounded-xl border border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                                    <Filter className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-heading font-bold text-xl text-white tracking-wider">TACTICAL FILTER</h2>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                        <p className="text-xs text-gray-500 font-mono uppercase">Omega Standard</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                            {/* Reset Bar */}
                            <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-lg mb-6 backdrop-blur-md">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Active:</span>
                                    <span className="text-violet-400 font-mono font-bold">{activeCount}</span>
                                </div>
                                <button onClick={resetFilters} className="flex items-center text-xs text-gray-400 hover:text-white transition-colors hover:underline font-mono group">
                                    <RefreshCw className="w-3 h-3 mr-1.5 group-hover:rotate-180 transition-transform duration-500" /> RESET ALL
                                </button>
                            </div>

                            {/* 1. ARTIFICIAL INTELLIGENCE DIRECTORATE */}
                            <div className="space-y-4">
                                <SectionHeader
                                    title="Artificial Intelligence"
                                    icon={BrainCircuit}
                                    isOpen={sections.ai}
                                    onClick={() => toggleSection('ai')}
                                />
                                <AnimatePresence>
                                    {sections.ai && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-6 pb-2 pl-1">
                                                {Object.entries(AI_DIRECTORATE).map(([category, skills]) => (
                                                    <div key={category} className="space-y-3">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 to-transparent" />
                                                            <h4 className="text-[10px] text-violet-400 font-mono uppercase tracking-widest bg-zinc-900/50 px-2 py-0.5 rounded border border-violet-500/10 shadow-[0_0_10px_rgba(124,58,237,0.1)]">{category}</h4>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {skills.map(skill => (
                                                                <SkillBadge
                                                                    key={skill}
                                                                    label={skill}
                                                                    active={aiSkills.includes(skill)}
                                                                    onClick={() => toggleAiSkill(skill)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 2. Education Level */}
                            <div className="space-y-4">
                                <SectionHeader
                                    title="Education Level"
                                    icon={GraduationCap}
                                    isOpen={sections.education}
                                    onClick={() => toggleSection('education')}
                                />
                                <AnimatePresence>
                                    {sections.education && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pb-2 pt-1">
                                                <GlassDropdown
                                                    label="Highest Qualification"
                                                    value={education}
                                                    onChange={setEducation}
                                                    options={EDUCATION_LEVELS}
                                                    placeholder="Select Qualification..."
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 3. Engineering Stack */}
                            <div className="space-y-4">
                                <SectionHeader
                                    title="Engineering Stack"
                                    icon={Layers}
                                    isOpen={sections.stack}
                                    onClick={() => toggleSection('stack')}
                                />
                                <AnimatePresence>
                                    {sections.stack && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-6 pb-2 pl-1">
                                                <div className="space-y-3">
                                                    <label className="text-xs text-gray-400 font-mono flex items-center">
                                                        <Code className="w-3 h-3 mr-1.5" /> Languages
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TECH_STACK.Languages.map(tech => (
                                                            <SkillBadge
                                                                key={tech}
                                                                label={tech}
                                                                active={stack.includes(tech)}
                                                                onClick={() => toggleStack(tech)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-xs text-gray-400 font-mono flex items-center">
                                                        <Server className="w-3 h-3 mr-1.5" /> Infrastructure
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TECH_STACK.Infrastructure.map(tech => (
                                                            <SkillBadge
                                                                key={tech}
                                                                label={tech}
                                                                active={stack.includes(tech)}
                                                                onClick={() => toggleStack(tech)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 4. Compensation & Status */}
                            <div className="space-y-4">
                                <SectionHeader
                                    title="Compensation & Status"
                                    icon={DollarSign}
                                    isOpen={sections.core}
                                    onClick={() => toggleSection('core')}
                                />
                                <AnimatePresence>
                                    {sections.core && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-6 pb-2 pt-1">
                                                {/* Salary */}
                                                <div className="flex gap-4">
                                                    <SalaryInput label="Min Salary (USD)" value={minSalary} onChange={setMinSalary} placeholder="1000" />
                                                    <SalaryInput label="Max Salary (USD)" value={maxSalary} onChange={setMaxSalary} placeholder="5000" />
                                                </div>

                                                {/* Security */}
                                                <div className="space-y-3">
                                                    <label className="text-xs text-gray-400 font-mono flex items-center">
                                                        <Shield className="w-3 h-3 mr-1.5" /> Security Clearance
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {SECURITY_OPTIONS.map(opt => (
                                                            <RadioBadge
                                                                key={opt}
                                                                label={opt}
                                                                active={security === opt}
                                                                onClick={() => setSecurity(security === opt ? null : opt)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Notice */}
                                                <div className="space-y-3">
                                                    <label className="text-xs text-gray-400 font-mono flex items-center">
                                                        <Clock className="w-3 h-3 mr-1.5" /> Notice Period
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {NOTICE_OPTIONS.map(opt => (
                                                            <RadioBadge
                                                                key={opt}
                                                                label={opt}
                                                                active={noticePeriod === opt}
                                                                onClick={() => setNoticePeriod(noticePeriod === opt ? null : opt)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-zinc-950">
                            <button onClick={onClose} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-heading font-bold rounded-lg shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all uppercase tracking-widest text-sm relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center space-x-2">
                                    <BrainCircuit className="w-4 h-4" />
                                    <span>Execute Filter Protocol</span>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
