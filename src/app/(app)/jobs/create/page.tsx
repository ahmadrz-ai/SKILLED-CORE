'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, DollarSign, Eye, EyeOff, X, PlusCircle, Briefcase, Zap, AlertCircle,
    Bold, Italic, Link2, Quote, List, Heading, Image as ImageIcon,
    Check, ChevronLeft, ChevronRight, Globe, ShieldAlert, Sparkles, Building2
} from 'lucide-react';
import { UploadButton } from "@/lib/uploadthing";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { FloatingInput } from '@/components/ui/floating-input';
import JobCard, { JobProps } from '@/components/JobCard';
import { toast } from 'sonner';
import { createJob, rewriteJobDescription } from '@/app/actions/jobs';
import { getCredits } from '@/app/actions/credits';

// --- MARKDOWN TOOLBAR ---
const MarkdownToolbar = ({ onFormat, onImageUpload }: { onFormat: (tag: string) => void, onImageUpload: (url: string) => void }) => {
    return (
        <div className="flex items-center gap-1 bg-zinc-900 border-b border-white/10 p-2 rounded-t-lg">
            <button onClick={() => onFormat('bold')} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Bold">
                <Bold className="w-4 h-4 text-zinc-400" />
            </button>
            <button onClick={() => onFormat('italic')} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Italic">
                <Italic className="w-4 h-4 text-zinc-400" />
            </button>
            <button onClick={() => onFormat('quote')} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Quote">
                <Quote className="w-4 h-4 text-zinc-400" />
            </button>
            <button onClick={() => onFormat('link')} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Link">
                <Link2 className="w-4 h-4 text-zinc-400" />
            </button>
            <div className="relative group">
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity inset-0 flex items-center justify-center z-10">
                    <UploadButton
                        endpoint="jobImageUploader"
                        onClientUploadComplete={(res) => {
                            if (res && res[0]) onImageUpload(res[0].url);
                            toast.success("Image uploaded!");
                        }}
                        onUploadError={(error: Error) => {
                            toast.error(`Upload failed: ${error.message}`);
                        }}
                        appearance={{
                            button: "w-full h-full opacity-0 cursor-pointer",
                            allowedContent: "hidden"
                        }}
                    />
                </div>
                <button className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Upload Image">
                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                </button>
            </div>
            <button onClick={() => onFormat('list')} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="List">
                <List className="w-4 h-4 text-zinc-400" />
            </button>
            <button onClick={() => onFormat('heading')} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Heading">
                <Heading className="w-4 h-4 text-zinc-400" />
            </button>
        </div>
    );
};

// --- MOCK DATA & TYPES ---
const JOB_TITLES = [
    "Frontend Engineer", "Backend Developer", "Full Stack Architect",
    "Product Designer", "Product Manager", "DevOps Engineer",
    "Data Scientist", "System Administrator", "Security Analyst"
];

const STEPS = [
    { id: 1, title: 'Job Details', subtitle: "Let's start with the basics" },
    { id: 2, title: 'Description', subtitle: "Describe the role" },
    { id: 3, title: 'Screening', subtitle: "Receive the right applicants" },
    { id: 4, title: 'Review', subtitle: "Set compensation & Launch" }
];

export default function JobWizardPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const [showConfirmRewrite, setShowConfirmRewrite] = useState(false);

    // Initial Credit Fetch
    useEffect(() => {
        getCredits().then(setCredits);
    }, []);

    // FORM STATE
    const [formData, setFormData] = useState({
        // Step 1
        title: '',
        company: '',
        companyLogo: '',
        workplaceType: 'On-site',
        location: '',
        jobTypes: [] as string[], // Full-time, etc.
        experienceLevel: 'Mid-Level',

        // Step 2
        skills: [] as string[],
        description: '',

        // Step 3
        applyMethod: 'easy' as 'easy' | 'external',
        externalUrl: '',
        questions: [] as { id: string; text: string; mustHave: boolean }[],

        // Step 4
        currency: 'USD',
        minPay: '',
        maxPay: '',
        payPeriod: 'Yearly'
    });

    const [skillInput, setSkillInput] = useState('');
    const [titleSearch, setTitleSearch] = useState('');
    const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);

    // --- NAVIGATION ---
    const nextStep = () => {
        if (currentStep === 1) {
            // Validate Title & Job Types
            if (!formData.title || formData.jobTypes.length === 0) {
                toast.error("Please fill in Title and Job Type.");
                return;
            }
            // Validate Location (Required unless Remote)
            if (formData.workplaceType !== 'Remote' && !formData.location) {
                toast.error("Please specify a location for non-remote roles.");
                return;
            }
            // Validate Company
            if (!formData.company) {
                toast.error("Please specify the Company Entity.");
                return;
            }
        }
        if (currentStep === 2) {
            const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount > 1000) {
                toast.error("Description exceeds 1000 words limit.");
                return;
            }
        }
        if (currentStep < 4) setCurrentStep(c => c + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    // --- HANDLERS ---

    // Step 1: Title Selection
    const selectTitle = (title: string) => {
        setFormData({ ...formData, title });
        setTitleSearch(title);
        setShowTitleSuggestions(false);
    };

    // Helper to insert markdown at cursor position
    const handleFormat = (type: string) => {
        const textarea = document.getElementById('job-description-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.description;
        let newText = text;
        let cursorOffset = 0;

        switch (type) {
            case 'bold':
                newText = text.substring(0, start) + `**${text.substring(start, end)}**` + text.substring(end);
                cursorOffset = 2;
                break;
            case 'italic':
                newText = text.substring(0, start) + `*${text.substring(start, end)}*` + text.substring(end);
                cursorOffset = 1;
                break;
            case 'quote':
                newText = text.substring(0, start) + `\n> ${text.substring(start, end)}` + text.substring(end);
                cursorOffset = 3;
                break;
            case 'link':
                newText = text.substring(0, start) + `[${text.substring(start, end) || 'text'}](url)` + text.substring(end);
                cursorOffset = 1;
                break;
            case 'list':
                newText = text.substring(0, start) + `\n- ${text.substring(start, end)}` + text.substring(end);
                cursorOffset = 3;
                break;
            case 'heading':
                newText = text.substring(0, start) + `\n### ${text.substring(start, end)}` + text.substring(end);
                cursorOffset = 5;
                break;
        }

        setFormData({ ...formData, description: newText });
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
        }, 0);
    };

    const handleImageInsert = (url: string) => {
        const text = formData.description;
        const newText = text + `\n![Image](${url})\n`;
        setFormData({ ...formData, description: newText });
    };

    const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length;

    // --- AUTH ---
    const { data: session } = useSession();
    const isPremium = session?.user?.role === 'RECRUITER' || session?.user?.role === 'ADMIN';

    // Step 2: AI Rewrite
    const requestAIRewrite = () => {
        if (!isPremium) {
            toast.error("Access Denied: This neural enhancement requires a Premium Recruiter License.");
            return;
        }
        if (!formData.description) return toast.error("Write something first for AI to improve.");
        if (credits !== null && credits < 1) return toast.error("Insufficient Credits (1 Required).");

        setShowConfirmRewrite(true);
    };

    const confirmAIRewrite = async () => {
        setShowConfirmRewrite(false);
        const loadingToast = toast.loading("Neural Networks Optimizing...");

        try {
            const res = await rewriteJobDescription(formData.description);
            toast.dismiss(loadingToast);

            if (res.success && res.description) {
                setFormData(p => ({ ...p, description: res.description! }));
                setCredits(c => (c ? c - 1 : 0));
                toast.success(res.message);
            } else {
                toast.error(res.message || "Enhancement failed.");
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error("Neural Link failed.");
        }
    };

    // Step 3: Questions
    const addQuestion = () => {
        setFormData(p => ({
            ...p,
            questions: [...p.questions, { id: Math.random().toString(), text: '', mustHave: false }]
        }));
    };

    const updateQuestion = (id: string, field: 'text' | 'mustHave', val: any) => {
        setFormData(p => ({
            ...p,
            questions: p.questions.map(q => q.id === id ? { ...q, [field]: val } : q)
        }));
    };



    // Step 4: Publish
    const handlePublish = async () => {
        setIsSubmitting(true);
        try {
            const min = formData.minPay ? parseInt(formData.minPay) : undefined;
            const max = formData.maxPay ? parseInt(formData.maxPay) : undefined;

            const res = await createJob({
                title: formData.title,
                companyName: formData.company,
                companyLogo: formData.companyLogo,
                location: formData.location || "Remote",
                type: formData.jobTypes[0] || "Full-time", // Schema expects string, mostly single
                workplaceType: formData.workplaceType,
                experienceLevel: formData.experienceLevel,
                salaryMin: min,
                salaryMax: max,
                description: formData.description,
                skills: formData.skills.join(', '), // CSV
                applyMethod: formData.applyMethod,
                externalUrl: formData.externalUrl,
                questions: formData.questions
            });

            if (res.success) {
                toast.success(res.message);
                router.push('/hire/dashboard'); // Redirect to Recruiter Dashboard
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Publish error:", error);
            toast.error("Failed to post job. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate Preview Job
    const previewJob: JobProps = {
        id: 'preview',
        title: formData.title || 'Untitled',
        company: formData.company || 'Company',
        type: (formData.workplaceType as any) || 'On-Site',
        postedTime: 'Just now',
        salary: formData.minPay && formData.maxPay
            ? `$${parseInt(formData.minPay) / 1000}k - $${parseInt(formData.maxPay) / 1000}k`
            : 'Unspecified',
        experience: 'Mid-Senior', // Hardcoded / cast as needed since form has different options
        contract: 'Full-Time',
        tags: formData.skills,
        logo: formData.companyLogo,
        isApplied: false
    };

    return (
        <div className="min-h-screen bg-obsidian font-sans text-white flex flex-col items-center pt-10 pb-20 px-4">

            {/* WIZARD HEADER */}
            <div className="w-full max-w-3xl mb-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
                        </p>
                        {credits !== null && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full">
                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-white">{credits} Credits</span>
                            </div>
                        )}
                    </div>
                    <Link href="/jobs" className="text-xs text-zinc-500 hover:text-white transition-colors">Exit Studio</Link>
                </div>
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-violet-600 shadow-[0_0_10px_#8b5cf6]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / 4) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* MAIN CARD */}
            <div className="w-full max-w-3xl bg-zinc-950 border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl overflow-hidden relative min-h-[600px] flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 opacity-20" />

                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
                        {STEPS[currentStep - 1].subtitle}
                    </h1>
                </div>

                <div className="flex-1">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: BASICS */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* JOB TITLE */}
                                <div className="relative">
                                    <Input
                                        placeholder="Job Title *"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({ ...formData, title: e.target.value });
                                            setTitleSearch(e.target.value);
                                            setShowTitleSuggestions(true);
                                        }}
                                        className="h-16 text-xl bg-zinc-900/50 border-white/10"
                                    />
                                    {showTitleSuggestions && titleSearch && (
                                        <div className="absolute top-full left-0 w-full bg-zinc-900 border border-white/10 rounded-xl mt-2 z-50 shadow-2xl overflow-hidden">
                                            {JOB_TITLES.filter(t => t.toLowerCase().includes(titleSearch.toLowerCase())).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => selectTitle(t)}
                                                    className="w-full text-left px-4 py-3 hover:bg-violet-600/20 hover:text-white text-zinc-400 text-sm transition-colors"
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="relative group shrink-0">
                                        <div className={cn(
                                            "w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden transition-all",
                                            formData.companyLogo ? "bg-black" : "bg-zinc-900 border-dashed"
                                        )}>
                                            {formData.companyLogo ? (
                                                <img src={formData.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-zinc-600" />
                                            )}
                                        </div>
                                        {/* Upload Overlay */}
                                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 flex items-center justify-center rounded-xl cursor-pointer">
                                            <UploadButton
                                                endpoint="companyLogo"
                                                onClientUploadComplete={(res) => {
                                                    if (res && res[0]) {
                                                        setFormData(p => ({ ...p, companyLogo: res[0].url }));
                                                        toast.success("Logo uploaded");
                                                    }
                                                }}
                                                onUploadError={(error: Error) => toast.error(`Error: ${error.message}`)}
                                                appearance={{
                                                    button: "w-full h-full opacity-0 cursor-pointer",
                                                    allowedContent: "hidden"
                                                }}
                                            />
                                            <PlusCircle className="w-5 h-5 text-white pointer-events-none absolute" />
                                        </div>
                                        <p className="text-[10px] text-zinc-500 text-center mt-1">Logo</p>
                                    </div>

                                    <div className="flex-1">
                                        <FloatingInput
                                            label="Company Entity"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* WORKPLACE */}
                                <div className="space-y-3">
                                    <Label className="text-zinc-400">Workplace Type</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['On-site', 'Hybrid', 'Remote'].map(type => (
                                            <div
                                                key={type}
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        workplaceType: type,
                                                        location: type === 'Remote' ? 'Remote' : formData.location === 'Remote' ? '' : formData.location
                                                    });
                                                }}
                                                className={cn(
                                                    "border rounded-xl p-4 cursor-pointer hover:bg-zinc-900 transition-all flex flex-col items-center justify-center gap-2",
                                                    formData.workplaceType === type
                                                        ? "border-violet-500 bg-violet-600/5 text-violet-300"
                                                        : "border-zinc-800 bg-transparent text-zinc-500"
                                                )}
                                            >
                                                <Building2 className="w-5 h-5" />
                                                <span className="text-sm font-bold">{type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <FloatingInput
                                    label="Location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />

                                {/* JOB TYPE */}
                                <div className="space-y-3">
                                    <Label className="text-zinc-400">Job Type (Select all that apply)</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map(type => {
                                            const isSelected = formData.jobTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        const newTypes = isSelected
                                                            ? formData.jobTypes.filter(t => t !== type)
                                                            : [...formData.jobTypes, type];
                                                        setFormData({ ...formData, jobTypes: newTypes });
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full border text-sm transition-all",
                                                        isSelected
                                                            ? "bg-white text-black border-white font-bold"
                                                            : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
                                                    )}
                                                >
                                                    {type}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: DESCRIPTION */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* SKILLS */}
                                <div className="space-y-3">
                                    <Label className="text-zinc-400">Skills (Press Enter to add)</Label>
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 flex flex-wrap gap-2 focus-within:ring-1 ring-violet-500 transition-all">
                                        {formData.skills.map(skill => (
                                            <div key={skill} className="bg-violet-600/20 text-violet-300 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                                                {skill}
                                                <button onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))}><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        <input
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && skillInput) {
                                                    setFormData(p => ({ ...p, skills: [...p.skills, skillInput] }));
                                                    setSkillInput('');
                                                }
                                            }}
                                            placeholder={formData.skills.length ? "" : "e.g. React, TypeScript..."}
                                            className="bg-transparent outline-none flex-1 min-w-[120px] text-white placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                {/* DESCRIPTION */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-zinc-400">Description</Label>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("text-xs font-mono", wordCount > 1000 ? "text-red-500" : "text-zinc-500")}>
                                                {wordCount}/1000 words
                                            </span>
                                            <Button
                                                onClick={requestAIRewrite}
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "transition-colors",
                                                    isPremium ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10" : "text-zinc-600 hover:text-zinc-500 cursor-not-allowed"
                                                )}
                                            >
                                                {isPremium ? <Sparkles className="w-4 h-4 mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                                                {isPremium ? "Rewrite with AI" : "Premium AI"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border border-white/10 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-violet-500/50 transition-all">
                                        <MarkdownToolbar onFormat={handleFormat} onImageUpload={handleImageInsert} />
                                        <Textarea
                                            id="job-description-editor"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="min-h-[300px] bg-zinc-900/50 border-none font-mono text-sm leading-relaxed p-4 focus-visible:ring-0 rounded-t-none"
                                            placeholder="Enter job responsibilities..."
                                        />
                                    </div>
                                    {wordCount > 1000 && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Description exceeds 1000 words limit.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: PREFERENCES */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* APPLY METHOD */}
                                <div className="space-y-4">
                                    <Label className="text-zinc-400">How should people apply?</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setFormData({ ...formData, applyMethod: 'easy' })}
                                            className={cn("p-4 border rounded-xl cursor-pointer transition-all", formData.applyMethod === 'easy' ? "border-violet-500 bg-violet-600/10" : "border-zinc-800 bg-zinc-900/50")}
                                        >
                                            <div className="flex items-center gap-3 font-bold text-white mb-1"><Zap className="w-4 h-4 text-violet-400" /> Easy Apply</div>
                                            <p className="text-xs text-zinc-500">Candidates apply directly on SkilledCore.</p>
                                        </div>
                                        <div
                                            onClick={() => setFormData({ ...formData, applyMethod: 'external' })}
                                            className={cn("p-4 border rounded-xl cursor-pointer transition-all", formData.applyMethod === 'external' ? "border-violet-500 bg-violet-600/10" : "border-zinc-800 bg-zinc-900/50")}
                                        >
                                            <div className="flex items-center gap-3 font-bold text-white mb-1"><Globe className="w-4 h-4 text-violet-400" /> External Link</div>
                                            <p className="text-xs text-zinc-500">Redirect candidates to your career site.</p>
                                        </div>
                                    </div>

                                    {formData.applyMethod === 'external' && (
                                        <FloatingInput label="External Application URL" value={formData.externalUrl} onChange={e => setFormData({ ...formData, externalUrl: e.target.value })} />
                                    )}
                                </div>

                                {/* SCREENING */}
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-400">Screening Questions (Deal Breakers)</Label>
                                        <Button onClick={addQuestion} size="sm" variant="ghost"><PlusCircle className="w-4 h-4 mr-2" /> Add</Button>
                                    </div>

                                    {formData.questions.map((q, idx) => (
                                        <div key={q.id} className="flex gap-4 items-start bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <span className="text-zinc-500 pt-3">{idx + 1}.</span>
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                                    placeholder="e.g. Do you have a valid working visa?"
                                                    className="bg-black/50 border-white/10"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={q.mustHave}
                                                        onCheckedChange={(c) => updateQuestion(q.id, 'mustHave', c)}
                                                    />
                                                    <span className={cn("text-xs", q.mustHave ? "text-red-400 font-bold" : "text-zinc-500")}>
                                                        {q.mustHave ? "Must-have qualification (Deal Breaker)" : "Nice to have"}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => setFormData(p => ({ ...p, questions: p.questions.filter(qi => qi.id !== q.id) }))} className="text-zinc-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: REVIEW */}
                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <Label className="text-zinc-400">Pay Range</Label>
                                        <div className="flex gap-2 items-center">
                                            <FloatingInput label="Min" value={formData.minPay} onChange={e => setFormData({ ...formData, minPay: e.target.value })} type="number" />
                                            <span className="text-zinc-500">-</span>
                                            <FloatingInput label="Max" value={formData.maxPay} onChange={e => setFormData({ ...formData, maxPay: e.target.value })} type="number" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-zinc-400">Pay Period</Label>
                                        <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/10 h-14 items-center">
                                            {['Hourly', 'Yearly'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setFormData({ ...formData, payPeriod: p })}
                                                    className={cn("flex-1 h-full rounded-md text-sm font-medium transition-all", formData.payPeriod === p ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500")}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black p-6 rounded-xl border border-white/10">
                                    <Label className="text-zinc-500 uppercase tracking-widest text-xs mb-4 block">Feed Preview</Label>
                                    <JobCard job={previewJob} index={0} />
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* CONFIRMATION MODAL */}
                <AnimatePresence>
                    {showConfirmRewrite && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-violet-500/10 rounded-full">
                                        <Sparkles className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Neural Rewrite</h3>
                                        <p className="text-xs text-zinc-400">AI Enhancement</p>
                                    </div>
                                </div>

                                <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
                                    This action will consume <span className="text-white font-bold">1 Credit</span> to rewrite and optimize your job description using advanced AI models.
                                </p>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setShowConfirmRewrite(false)}
                                        variant="ghost"
                                        className="flex-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmAIRewrite}
                                        className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold"
                                    >
                                        Confirm (-1 Credit)
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* FOOTER ACTIONS */}
                <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-6">
                    <Button
                        onClick={prevStep}
                        variant="ghost"
                        disabled={currentStep === 1}
                        className="text-zinc-400 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>

                    {currentStep < 4 ? (
                        <Button onClick={nextStep} className="bg-white text-black hover:bg-zinc-200 px-8">
                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePublish}
                            disabled={isSubmitting}
                            className="bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.5)] px-8"
                        >
                            {isSubmitting ? "Launching..." : "Post Job (1 Credit)"}
                        </Button>
                    )}
                </div>

            </div>

        </div>
    );
}
