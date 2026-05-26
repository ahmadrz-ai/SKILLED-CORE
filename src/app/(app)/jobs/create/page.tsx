'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, DollarSign, Eye, EyeOff, X, PlusCircle, Briefcase, Zap, AlertCircle,
    Bold, Italic, Link2, Quote, List, Heading, Image as ImageIcon, Underline, Strikethrough,
    Check, ChevronLeft, ChevronRight, Globe, ShieldAlert, Sparkles, Building2
} from 'lucide-react';
import { UploadButton } from "@/lib/uploadthing";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { FloatingInput } from '@/components/ui/floating-input';
import JobCard, { JobProps } from '@/components/JobCard';
import { toast } from 'sonner';
import { createJob, rewriteJobDescription } from '@/app/actions/jobs';
import { getCredits, getPlan } from '@/app/actions/credits';

// --- WYSIWYG FORMATTING TOOLBAR ---
const MarkdownToolbar = ({ 
    onFormat, 
    onImageUpload 
}: { 
    onFormat: (type: string) => void, 
    onImageUpload: (url: string) => void 
}) => {
    return (
        <div className="flex flex-wrap items-center gap-1 bg-zinc-50 border-b border-zinc-200 p-2 rounded-t-lg">
            <button 
                type="button" 
                onClick={() => onFormat('bold')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button 
                type="button" 
                onClick={() => onFormat('italic')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <button 
                type="button" 
                onClick={() => onFormat('underline')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Underline"
            >
                <Underline className="w-4 h-4" />
            </button>
            <button 
                type="button" 
                onClick={() => onFormat('strikethrough')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Strikethrough"
            >
                <Strikethrough className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-zinc-200 mx-1" />
            <button 
                type="button" 
                onClick={() => onFormat('bullet')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </button>
            <button 
                type="button" 
                onClick={() => onFormat('quote')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Blockquote"
            >
                <Quote className="w-4 h-4" />
            </button>
            <button 
                type="button" 
                onClick={() => onFormat('link')} 
                className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" 
                title="Insert Link"
            >
                <Link2 className="w-4 h-4" />
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
                <button type="button" className="p-2 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900 rounded-md transition-colors" title="Upload Image">
                    <ImageIcon className="w-4 h-4" />
                </button>
            </div>
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
    const [userPlan, setUserPlan] = useState<string>('BASIC');
    const [showConfirmRewrite, setShowConfirmRewrite] = useState(false);

    // Initial Telemetry Fetch
    useEffect(() => {
        getCredits().then(setCredits);
        getPlan().then(setUserPlan);
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

    // Sync editor initial content when entering Step 2
    useEffect(() => {
        if (currentStep === 2) {
            setTimeout(() => {
                const el = document.getElementById('job-description-editor');
                if (el && el.innerHTML !== formData.description) {
                    el.innerHTML = formData.description;
                }
            }, 100);
        }
    }, [currentStep]);

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
            const wordCount = getWordCount(formData.description);
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
    const selectTitle = (title: string) => {
        setFormData({ ...formData, title });
        setTitleSearch(title);
        setShowTitleSuggestions(false);
    };

    // Helper to sync editor innerHTML back to state
    const syncEditorState = () => {
        const el = document.getElementById('job-description-editor');
        if (!el) return;
        setFormData(p => ({ ...p, description: el.innerHTML }));
    };

    // WYSIWYG execution helpers
    const execFormat = (command: string, value?: string) => {
        const editor = document.getElementById('job-description-editor');
        if (!editor) return;
        editor.focus();
        document.execCommand(command, false, value);
        syncEditorState();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Bold: Ctrl+B
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            execFormat("bold");
            return;
        }
        // Italic: Ctrl+I
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
            e.preventDefault();
            execFormat("italic");
            return;
        }
        // Underline: Ctrl+U
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
            e.preventDefault();
            execFormat("underline");
            return;
        }
        // Strikethrough: Ctrl+Shift+S
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            execFormat("strikeThrough");
            return;
        }
        // Bullet list: * Space at line start
        if (e.key === " ") {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.startContainer;
                const textBefore = container.textContent?.slice(0, range.startOffset) ?? "";
                if (textBefore === "*" || textBefore === "-") {
                    e.preventDefault();
                    document.execCommand("selectAll", false);
                    const newRange = document.createRange();
                    newRange.setStart(container, 0);
                    newRange.setEnd(container, range.startOffset);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                    document.execCommand("delete", false);
                    document.execCommand("insertUnorderedList", false);
                    syncEditorState();
                    return;
                }
            }
        }
    };

    const handleInsertLink = () => {
        const url = prompt("Enter the link URL:");
        if (!url) return;
        const href = url.startsWith("http") ? url : `https://${url}`;
        const sel = window.getSelection();
        const selected = sel?.toString() || "link";
        
        const html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#6366F1;text-decoration:underline;">${selected}</a>`;
        execFormat("insertHTML", html);
    };

    const handleImageInsert = (url: string) => {
        const html = `<img src="${url}" alt="Job Image" style="max-width:100%; height:auto; border-radius:8px; margin:8px 0;" />`;
        execFormat("insertHTML", html);
    };

    const handleFormat = (type: string) => {
        switch (type) {
            case 'bold':          execFormat("bold"); break;
            case 'italic':        execFormat("italic"); break;
            case 'underline':     execFormat("underline"); break;
            case 'strikethrough': execFormat("strikeThrough"); break;
            case 'bullet':        execFormat("insertUnorderedList"); break;
            case 'quote':
                execFormat("formatBlock", "blockquote");
                break;
            case 'link':          handleInsertLink(); break;
            default: break;
        }
    };

    // Calculate clean word count from HTML tags
    const getWordCount = (html: string) => {
        if (typeof window === 'undefined') return 0;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const text = tempDiv.innerText || tempDiv.textContent || "";
        return text.trim().split(/\s+/).filter(Boolean).length;
    };

    const wordCount = getWordCount(formData.description);

    // --- AUTH ---
    const { data: session } = useSession();
    const isPremium = session?.user?.role === 'RECRUITER' || session?.user?.role === 'ADMIN';

    // Step 2: AI Rewrite
    const requestAIRewrite = () => {
        if (!isPremium) {
            toast.error("Access Denied: This neural enhancement requires a Premium Recruiter License.");
            return;
        }
        if (!formData.description || formData.description === "<br>") {
            toast.error("Write something first for AI to improve.");
            return;
        }
        if (userPlan === 'BASIC') {
            toast.error("Upgrade to PRO or ULTRA to access Neural Rewrite.");
            return;
        }
        // If not Ultra, they must have credits
        if (userPlan !== 'ULTRA' && (credits !== null && credits < 1)) {
            toast.error("Insufficient Credits (1 Required).");
            return;
        }

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
                const editor = document.getElementById('job-description-editor');
                if (editor) editor.innerHTML = res.description!;
                
                // Re-sync plan credits
                getCredits().then(setCredits);
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
                type: formData.jobTypes[0] || "Full-time",
                workplaceType: formData.workplaceType,
                experienceLevel: formData.experienceLevel,
                salaryMin: min,
                salaryMax: max,
                description: formData.description,
                skills: formData.skills.join(', '),
                applyMethod: formData.applyMethod,
                externalUrl: formData.externalUrl,
                questions: formData.questions
            });

            if (res.success) {
                toast.success(res.message);
                router.push('/hire/dashboard');
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
        experience: 'Mid-Senior',
        contract: 'Full-Time',
        tags: formData.skills,
        logo: formData.companyLogo,
        isApplied: false
    };

    return (
        <div 
            className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center py-6 px-4 relative overflow-hidden font-sans rounded-2xl text-zinc-800"
            style={{ background: "linear-gradient(165deg, #FAFAFE 0%, #F1EEFF 40%, #EDE9FE 70%, #FAFAFE 100%)" }}
        >
            {/* Subtle mesh background */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #6366F1 1px, transparent 1px), radial-gradient(circle at 75% 75%, #6366F1 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* WIZARD HEADER */}
            <div className="w-full max-w-3xl mb-6 z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
                        </p>
                        {credits !== null && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 rounded-full shadow-sm">
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-zinc-700">{credits} Credits</span>
                            </div>
                        )}
                    </div>
                    <Link href="/jobs" className="text-xs text-zinc-400 hover:text-indigo-600 font-bold transition-colors">Exit Studio</Link>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / 4) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* MAIN CARD */}
            <div className="w-full max-w-3xl bg-white border border-zinc-200/85 rounded-2xl p-8 md:p-12 shadow-xl overflow-hidden relative min-h-[600px] flex flex-col z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-650" />

                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-600">
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
                                        className="h-16 text-xl bg-zinc-50 border-zinc-200 focus:border-indigo-500 focus:ring-indigo-100 text-zinc-900"
                                    />
                                    {showTitleSuggestions && titleSearch && (
                                        <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 rounded-xl mt-2 z-50 shadow-2xl overflow-hidden">
                                            {JOB_TITLES.filter(t => t.toLowerCase().includes(titleSearch.toLowerCase())).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => selectTitle(t)}
                                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 hover:text-indigo-650 text-zinc-700 text-sm transition-colors"
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
                                            "w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden transition-all",
                                            formData.companyLogo ? "bg-zinc-50 border-zinc-200" : "bg-zinc-50 border-zinc-200 border-dashed"
                                        )}>
                                            {formData.companyLogo ? (
                                                <img src={formData.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-zinc-400" />
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
                                                onUploadError={(error: Error) => { toast.error(`Error: ${error.message}`); }}
                                                appearance={{
                                                    button: "w-full h-full opacity-0 cursor-pointer",
                                                    allowedContent: "hidden"
                                                }}
                                            />
                                            <PlusCircle className="w-5 h-5 text-white pointer-events-none absolute" />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 text-center mt-1">Logo</p>
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
                                    <Label className="text-zinc-500 font-semibold text-sm">Workplace Type</Label>
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
                                                    "border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                                                    formData.workplaceType === type
                                                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 font-bold shadow-sm"
                                                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500"
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
                                    <Label className="text-zinc-500 font-semibold text-sm">Job Type (Select all that apply)</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map(type => {
                                            const isSelected = formData.jobTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        const newTypes = isSelected
                                                            ? formData.jobTypes.filter(t => t !== type)
                                                            : [...formData.jobTypes, type];
                                                        setFormData({ ...formData, jobTypes: newTypes });
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full border text-sm transition-all",
                                                        isSelected
                                                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm"
                                                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-700"
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
                                    <Label className="text-zinc-500 font-semibold text-sm">Skills (Press Enter to add)</Label>
                                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                                        {formData.skills.map(skill => (
                                            <div key={skill} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 font-semibold">
                                                {skill}
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))}
                                                    className="hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <input
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (skillInput.trim()) {
                                                        setFormData(p => ({ ...p, skills: [...p.skills, skillInput.trim()] }));
                                                        setSkillInput('');
                                                    }
                                                }
                                            }}
                                            placeholder={formData.skills.length ? "" : "e.g. React, TypeScript..."}
                                            className="bg-transparent outline-none flex-1 min-w-[120px] text-zinc-800 placeholder:text-zinc-400 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* DESCRIPTION */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-zinc-500 font-semibold text-sm">Description</Label>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("text-xs font-mono", wordCount > 1000 ? "text-red-500" : "text-zinc-450")}>
                                                {wordCount}/1000 words
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={requestAIRewrite}
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "transition-colors font-bold text-xs rounded-lg px-3 py-1.5 flex items-center gap-1.5 border border-indigo-100 shadow-sm",
                                                    isPremium 
                                                        ? "text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-700" 
                                                        : "text-zinc-400 bg-zinc-50 hover:text-zinc-600 cursor-not-allowed"
                                                )}
                                            >
                                                {isPremium ? <Sparkles className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                                {isPremium ? (userPlan === 'ULTRA' ? "Rewrite with AI (Free)" : "Rewrite with AI") : "Premium AI"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all bg-white shadow-inner">
                                        <MarkdownToolbar onFormat={handleFormat} onImageUpload={handleImageInsert} />
                                        <div
                                            id="job-description-editor"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={syncEditorState}
                                            onKeyDown={handleKeyDown}
                                            data-placeholder="Enter job responsibilities..."
                                            className={cn(
                                                "min-h-[300px] bg-white border-none font-sans text-sm leading-relaxed p-4 outline-none text-zinc-800",
                                                "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline",
                                                "[&_a]:text-indigo-650 [&_a]:underline [&_a]:cursor-pointer",
                                                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
                                                "[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-1",
                                                "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-zinc-400 [&:empty]:before:pointer-events-none"
                                            )}
                                            style={{ whiteSpace: "pre-wrap" }}
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
                                    <Label className="text-zinc-500 font-semibold text-sm">How should people apply?</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setFormData({ ...formData, applyMethod: 'easy' })}
                                            className={cn("p-4 border rounded-xl cursor-pointer transition-all", formData.applyMethod === 'easy' ? "border-indigo-600 bg-indigo-50/50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100")}
                                        >
                                            <div className="flex items-center gap-3 font-bold text-zinc-800 mb-1"><Zap className="w-4 h-4 text-indigo-650 fill-indigo-100" /> Easy Apply</div>
                                            <p className="text-xs text-zinc-500">Candidates apply directly on SkilledCore.</p>
                                        </div>
                                        <div
                                            onClick={() => setFormData({ ...formData, applyMethod: 'external' })}
                                            className={cn("p-4 border rounded-xl cursor-pointer transition-all", formData.applyMethod === 'external' ? "border-indigo-600 bg-indigo-50/50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100")}
                                        >
                                            <div className="flex items-center gap-3 font-bold text-zinc-800 mb-1"><Globe className="w-4 h-4 text-indigo-655" /> External Link</div>
                                            <p className="text-xs text-zinc-500">Redirect candidates to your career site.</p>
                                        </div>
                                    </div>

                                    {formData.applyMethod === 'external' && (
                                        <FloatingInput label="External Application URL" value={formData.externalUrl} onChange={e => setFormData({ ...formData, externalUrl: e.target.value })} />
                                    )}
                                </div>

                                {/* SCREENING */}
                                <div className="space-y-4 pt-6 border-t border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-500 font-semibold text-sm">Screening Questions (Deal Breakers)</Label>
                                        <Button type="button" onClick={addQuestion} size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"><PlusCircle className="w-4 h-4 mr-2" /> Add</Button>
                                    </div>

                                    {formData.questions.map((q, idx) => (
                                        <div key={q.id} className="flex gap-4 items-start bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                                            <span className="text-zinc-400 pt-3 font-mono font-bold">{idx + 1}.</span>
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                                    placeholder="e.g. Do you have a valid working visa?"
                                                    className="bg-white border-zinc-200 text-zinc-800"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={q.mustHave}
                                                        onCheckedChange={(c) => updateQuestion(q.id, 'mustHave', c)}
                                                    />
                                                    <span className={cn("text-xs font-semibold", q.mustHave ? "text-red-650" : "text-zinc-500")}>
                                                        {q.mustHave ? "Must-have qualification (Deal Breaker)" : "Nice to have"}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData(p => ({ ...p, questions: p.questions.filter(qi => qi.id !== q.id) }))} 
                                                className="text-zinc-450 hover:text-red-500 p-1.5 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Label className="text-zinc-500 font-semibold text-sm">Pay Range</Label>
                                        <div className="flex gap-2 items-center">
                                            <FloatingInput label="Min" value={formData.minPay} onChange={e => setFormData({ ...formData, minPay: e.target.value })} type="number" />
                                            <span className="text-zinc-400 font-bold">-</span>
                                            <FloatingInput label="Max" value={formData.maxPay} onChange={e => setFormData({ ...formData, maxPay: e.target.value })} type="number" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-zinc-500 font-semibold text-sm">Pay Period</Label>
                                        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 h-14 items-center">
                                            {['Hourly', 'Yearly'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, payPeriod: p })}
                                                    className={cn("flex-1 h-full rounded-lg text-sm font-bold transition-all", formData.payPeriod === p ? "bg-white text-indigo-600 shadow-sm border border-zinc-200/50" : "text-zinc-500 hover:text-zinc-700")}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200/80 shadow-inner">
                                    <Label className="text-zinc-400 uppercase tracking-widest text-[10px] font-bold mb-4 block">Feed Preview</Label>
                                    <JobCard job={previewJob} index={0} />
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* CONFIRMATION MODAL */}
                <AnimatePresence>
                    {showConfirmRewrite && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-full">
                                        <Sparkles className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-950">Neural Rewrite</h3>
                                        <p className="text-xs text-zinc-500">AI Enhancement</p>
                                    </div>
                                </div>

                                <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
                                    {userPlan === 'ULTRA' 
                                        ? "This action will rewrite and optimize your job description using advanced AI models. (Free with Ultra Plan)"
                                        : "This action will consume 1 Credit to rewrite and optimize your job description using advanced AI models."
                                    }
                                </p>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setShowConfirmRewrite(false)}
                                        variant="ghost"
                                        className="flex-1 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmAIRewrite}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                    >
                                        {userPlan === 'ULTRA' ? "Confirm (Free)" : "Confirm (-1 Credit)"}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* FOOTER ACTIONS */}
                <div className="mt-12 flex justify-between items-center border-t border-zinc-100 pt-6">
                    <Button
                        type="button"
                        onClick={prevStep}
                        variant="ghost"
                        disabled={currentStep === 1}
                        className="text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 font-semibold"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>

                    {currentStep < 4 ? (
                        <Button 
                            type="button"
                            onClick={nextStep} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg active:scale-95 duration-100 px-8 rounded-xl border-none"
                        >
                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handlePublish}
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] px-8 rounded-xl border-none active:scale-95 duration-100"
                        >
                            {isSubmitting ? "Launching..." : "Post Job (1 Credit)"}
                        </Button>
                    )}
                </div>

            </div>

        </div>
    );
}
