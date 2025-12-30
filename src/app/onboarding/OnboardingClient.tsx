'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2,
    X, MapPin, Briefcase, Building2, Globe, Mail, Rocket, AlertCircle, Hexagon, Loader2
} from 'lucide-react';
import { checkUsername } from '../(app)/feed/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ResumeUploadZone } from '@/components/onboarding/ResumeUploadZone';
import { toast } from 'sonner';

// --- CONFIG ---
const CANDIDATE_STEPS = [
    { id: 1, title: "Define Your Role", description: "Who are you in this vast digital frontier?" },
    { id: 2, title: "Select Your Arsenal", description: "What tools do you bring to the role?" },
    { id: 3, title: "Data Ingestion", description: "Upload your career telemetry (Resume)." },
];

const RECRUITER_STEPS = [
    { id: 1, title: "Establish Company HQ", description: "Where is your base of operations?" },
    { id: 2, title: "Verify Authority", description: "Confirm your command credentials." },
    { id: 3, title: "Initialization", description: "Prepare to deploy." },
];

const SUGGESTED_SKILLS = ["React", "TypeScript", "Node.js", "Python", "Design Systems", "AWS", "GraphQL"];

// Move main logic to inner component
function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate';
    const STEPS = role === 'recruiter' ? RECRUITER_STEPS : CANDIDATE_STEPS;

    const [currentStep, setCurrentStep] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        username: '',
        headline: '',
        bio: '',
        location: '',
        skills: [] as string[],
        resume: null,
        companyName: '',
        industry: '',
        workEmail: '',
        experience: [] as any[],
        education: [] as any[],
        // resumeUrl removed
    });

    // --- UPLOAD SIMULATION ---
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadProgress, setUploadProgress] = useState(0);

    // --- VALIDATION ---
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [usernameWarning, setUsernameWarning] = useState<string | null>(null);

    // Check Username Effect
    useEffect(() => {
        const check = async () => {
            if (!formData.username || formData.username.length < 3) {
                setUsernameStatus('idle');
                return;
            }
            setUsernameStatus('checking');
            const result = await checkUsername(formData.username);
            if (result.available) {
                setUsernameStatus('available');
            } else {
                setUsernameStatus('taken');
            }
        };
        const timeoutId = setTimeout(check, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.username]);
    const validateStep = (step: number) => {
        setPageError(null);
        if (role === 'candidate') {
            if (step === 1) {
                if (!formData.username) return "Unique ID (Username) is required.";
                if (formData.username.length < 3) return "Username must be at least 3 characters.";
                if (usernameStatus === 'taken') return "Username is already taken.";
                if (!formData.headline.trim()) return "Professional Headline is required.";
                if (!formData.location.trim()) return "Current Location is required.";
            }
            if (step === 2) {
                if (formData.skills.length === 0) return "Please add at least one skill.";
            }
            // Step 3 (Resume) is optional? User asked for "every field mandatory".
            // Let's make it mandatory if user hasn't uploaded OR typed data manually (which isn't really an option here yet).
            // Actually ResumeUploader might be optional if they want to skip? 
            // The prompt says "make every field mandatory". Let's assume Resume is mandatory for now or at least some data.
            // However, the resume step also allows auto-fill. If they don't upload, they can't proceed?
            // Let's check if we strictly enforce file upload.
            // If they are on step 3, maybe we require the upload status to be complete?
            // Or maybe just let them skip since step 3 is "Data Ingestion" which usually implies optional automation.
            // BUT user said "everyfield mandatory". Let's restrict it.
            if (step === 3 && uploadStatus !== 'complete') return "Please upload your resume to proceed.";
        }

        if (role === 'recruiter') {
            if (step === 1) {
                if (!formData.companyName.trim()) return "Organization Name is required.";
                if (!formData.industry.trim()) return "Industry is required.";
            }
            if (step === 2) {
                if (!formData.workEmail.trim()) return "Work Email is required.";
                if (!formData.workEmail.includes('@')) return "Please enter a valid email address.";
            }
        }
        return null;
    };

    // --- NAV LOGIC ---
    const nextStep = async () => {
        const error = validateStep(currentStep);
        if (error) {
            setPageError(error);
            toast.error(error);
            return;
        }

        if (currentStep < STEPS.length) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsTransitioning(false);
            }, 300);
        } else {
            // FINISH - Save Profile
            try {
                const res = await fetch("/api/user/onboarding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        role: role.toUpperCase(),
                        ...formData
                    }),
                });

                if (!res.ok) throw new Error("Failed to save profile");

                // Redirect
                router.push('/feed');
            } catch (error) {
                console.error(error);
                router.push('/feed');
            }
        }
    };

    const prevStep = () => {
        setPageError(null);
        if (currentStep > 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsTransitioning(false);
            }, 300);
        }
    };

    // --- SUB-COMPONENTS ---

    const TagInput = () => {
        const [input, setInput] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);

        const addSkill = (skill: string) => {
            if (!formData.skills.includes(skill) && formData.skills.length < 10) {
                setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
            }
            setInput('');
        };

        return (
            <div className="space-y-4">
                <div
                    onClick={() => inputRef.current?.focus()}
                    className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-zinc-900/50 border border-white/5 rounded-xl focus-within:border-violet-500/50 transition-all cursor-text"
                >
                    {formData.skills.map(s => (
                        <span key={s} className="px-2 py-1 bg-amber-500/10 text-amber-300 rounded-md text-sm flex items-center gap-1 border border-amber-500/20 animate-in fade-in zoom-in duration-200">
                            {s}
                            <button onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, skills: prev.skills.filter(i => i !== s) })); }} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        className="bg-transparent outline-none flex-1 min-w-[120px] text-white placeholder:text-zinc-600 text-sm h-full"
                        placeholder={formData.skills.length === 0 ? "Add skills (e.g. React, UX Design)..." : "Add more..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && input) {
                                e.preventDefault();
                                addSkill(input);
                            }
                        }}
                        disabled={formData.skills.length >= 10}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.map(s => (
                        <button
                            key={s}
                            onClick={() => addSkill(s)}
                            disabled={formData.skills.includes(s) || formData.skills.length >= 10}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border border-white/5 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition-all"
                        >
                            + {s}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const handleResumeUpload = async (url: string, file: File) => {
        setUploadStatus('parsing');
        try {
            const formData = new FormData();
            formData.append("url", url);
            formData.append("file", file);

            // Call API to parse resume (now accepting File via FormData)
            const res = await fetch('/api/ai/parse-resume-from-url', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API Error Details:", errorText);

                if (res.status === 429) {
                    toast.error("AI usage limit reached. Please wait a minute and try again.");
                    setUploadStatus('idle');
                    return;
                }

                throw new Error("Parse failed: " + res.statusText);
            }

            const json = await res.json();
            const aiData = json.aiData;

            setFormData(prev => ({
                ...prev,
                resume: null, // No File object anymore
                // resumeUrl removed
                headline: aiData?.headline || prev.headline,
                bio: aiData?.summary || prev.bio,
                location: aiData?.location || prev.location,
                skills: Array.from(new Set([...prev.skills, ...(aiData?.skills || [])])).slice(0, 10),
                experience: aiData?.experience?.map((exp: any) => ({
                    role: exp.position,
                    company: exp.company,
                    start: exp.startDate,
                    end: exp.endDate,
                    desc: exp.description
                })) || [],
                education: aiData?.education?.map((edu: any) => ({
                    school: edu.school,
                    degree: edu.degree,
                    start: edu.startDate,
                    end: edu.endDate
                })) || []
            }));

            setUploadStatus('complete');
            toast.success("Resume processed successfully");
            // Auto-advance handled by useEffect now
        } catch (error) {
            console.error(error);
            setUploadStatus('idle');
            toast.error("Failed to parse resume");
        }
    };

    // Auto-advance when upload is complete
    useEffect(() => {
        if (role === 'candidate' && currentStep === 3 && uploadStatus === 'complete') {
            const timer = setTimeout(() => {
                nextStep();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [uploadStatus, currentStep, role]);

    // Replaced internal FileUpload with ResumeUploadZone
    const ResumeUploader = () => {
        return (
            <div className="space-y-4">
                {uploadStatus === 'idle' && (
                    <ResumeUploadZone
                        onUploadSuccess={handleResumeUpload}
                        className="bg-zinc-900/50 border-white/5 hover:bg-zinc-900/80 hover:border-violet-500/30 transition-all border-dashed"
                    />
                )}

                {uploadStatus === 'uploading' && (
                    <div className="w-full max-w-xs mx-auto space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-300 font-mono text-sm animate-pulse">
                            <FileText className="w-4 h-4" />
                            ANALYZING DATA...
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </div>
                )}

                {uploadStatus === 'complete' && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center bg-zinc-900/50 p-6 rounded-xl border border-green-500/20">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 mx-auto border border-green-500/20">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-white font-heading font-bold mb-1">Extraction Complete</h3>
                        <p className="text-sm text-green-400/80 mb-4">Resume Analyzed & Data Ingested</p>
                        <Button variant="outline" onClick={() => setUploadStatus('idle')} className="text-xs h-8 bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Replace Resume</Button>
                    </motion.div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-obsidian flex flex-col relative overflow-hidden font-sans text-white">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.15),transparent_70%)]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-900/10 blur-[100px] rounded-full" />
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-1 bg-zinc-900 fixed top-0 left-0 z-50">
                <motion.div
                    className="h-full shadow-[0_0_10px_rgba(245,158,11,0.5)] bg-gradient-to-r from-amber-600 to-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

                <div className="w-full max-w-xl">
                    {/* Header */}
                    <div className="text-center mb-10 space-y-4">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-zinc-400 inline-block"
                        >
                            Step {currentStep} of {STEPS.length}
                        </motion.div>
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-white mb-2">
                                {STEPS[currentStep - 1].title}
                            </h1>
                            <p className="text-zinc-400 text-sm md:text-base max-w-sm mx-auto">
                                {STEPS[currentStep - 1].description}
                            </p>
                        </div>
                    </div>

                    {/* Content Card */}
                    <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl min-h-[420px] flex flex-col relative overflow-hidden">

                        {/* Error Banner */}
                        <AnimatePresence>
                            {pageError && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-sm text-red-200">{pageError}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1">
                            <AnimatePresence mode="wait">
                                {!isTransitioning && (
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full"
                                    >
                                        {/* --- CANDIDATE FLOW --- */}
                                        {role === 'candidate' && (
                                            <>
                                                {currentStep === 1 && (
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Unique ID (Username) <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Hexagon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="e.g. shadow_coder"
                                                                    className={cn(
                                                                        "pl-10 bg-zinc-900/50 border-white/5 transition-colors h-11 text-white",
                                                                        usernameStatus === 'available' ? "focus:border-green-500/50 border-green-500/20" :
                                                                            usernameStatus === 'taken' ? "focus:border-red-500/50 border-red-500/20" :
                                                                                "focus:border-amber-500/50"
                                                                    )}
                                                                    value={formData.username}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                                                        if (/[^a-zA-Z0-9_]/.test(e.target.value)) setUsernameWarning("Only letters, numbers, and underscores.");
                                                                        else setUsernameWarning(null);
                                                                        setFormData({ ...formData, username: val });
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-zinc-500" />}
                                                                {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                                                            </div>
                                                            {usernameWarning && <p className="text-xs text-red-400">{usernameWarning}</p>}
                                                            {usernameStatus === 'taken' && <p className="text-xs text-red-400">Username taken.</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Professional Headline <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="e.g. Senior Frontend Architect"
                                                                    className="pl-10 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 transition-colors h-11 text-white"
                                                                    value={formData.headline}
                                                                    onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Current Location <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="City, Country"
                                                                    className="pl-10 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 transition-colors h-11 text-white"
                                                                    value={formData.location}
                                                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 2 && <TagInput />}

                                                {currentStep === 3 && <ResumeUploader />}
                                            </>
                                        )}

                                        {/* --- RECRUITER FLOW --- */}
                                        {role === 'recruiter' && (
                                            <>
                                                {currentStep === 1 && (
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Unique ID (Username) <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Hexagon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="e.g. tech_scout"
                                                                    className={cn(
                                                                        "pl-10 bg-zinc-900/50 border-white/5 transition-colors h-11 text-white",
                                                                        usernameStatus === 'available' ? "focus:border-green-500/50 border-green-500/20" :
                                                                            usernameStatus === 'taken' ? "focus:border-red-500/50 border-red-500/20" :
                                                                                "focus:border-amber-500/50"
                                                                    )}
                                                                    value={formData.username}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                                                        if (/[^a-zA-Z0-9_]/.test(e.target.value)) setUsernameWarning("Only letters, numbers, and underscores.");
                                                                        else setUsernameWarning(null);
                                                                        setFormData({ ...formData, username: val });
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-zinc-500" />}
                                                                {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                                                            </div>
                                                            {usernameWarning && <p className="text-xs text-red-400">{usernameWarning}</p>}
                                                            {usernameStatus === 'taken' && <p className="text-xs text-red-400">Username taken.</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Organization Name <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="e.g. Acme Corp"
                                                                    className="pl-10 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 transition-colors h-11 text-white"
                                                                    value={formData.companyName}
                                                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Industry <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Globe className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="e.g. Fintech, AI, Healthcare"
                                                                    className="pl-10 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 transition-colors h-11 text-white"
                                                                    value={formData.industry}
                                                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 2 && (
                                                    <div className="space-y-6">
                                                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                                                            <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5" />
                                                            <div>
                                                                <h4 className="text-amber-400 font-bold text-sm">Verification Required</h4>
                                                                <p className="text-zinc-400 text-xs leading-relaxed mt-1">To prevent fraud, we require a work email address matching your organization's domain.</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-zinc-400 text-xs uppercase tracking-wide">Work Email <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                                                <Input
                                                                    placeholder="you@company.com"
                                                                    type="email"
                                                                    className="pl-10 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 transition-colors h-11 text-white"
                                                                    value={formData.workEmail}
                                                                    onChange={e => setFormData({ ...formData, workEmail: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 3 && (
                                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                                                        <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] animate-pulse">
                                                            <Rocket className="w-12 h-12 text-amber-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-heading font-black text-white mb-2">Systems Online</h3>
                                                            <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                                                Your command center is ready. Prepare to scout the best talent in the sector.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* NAV FOOTER */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={cn("text-zinc-500 hover:text-white hover:bg-white/5", currentStep === 1 && "opacity-0 pointer-events-none")}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>

                            <Button
                                onClick={nextStep}
                                className="min-w-[140px] font-bold tracking-wide transition-all shadow-lg h-11 bg-amber-600 hover:bg-amber-500 shadow-amber-500/20 text-black"
                            >
                                {currentStep === STEPS.length ? "LAUNCH" : "CONTINUE"}
                                {currentStep !== STEPS.length && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default function OnboardingClient() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-violet-500 font-mono">INITIALIZING IDENTITY MATRIX...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}
