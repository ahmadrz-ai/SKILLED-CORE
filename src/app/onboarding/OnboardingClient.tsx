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
    { id: 1, title: "Establish Company HQ", description: "Who are you building and hiring for?" },
    { id: 2, title: "Bidirectional ATS Sync", description: "Integrate native webhooks to eliminate manual data entry." },
    { id: 3, title: "Cohort Calibration Ingestion", description: "Seed the ontology using past passed and failed candidate benchmarks." },
    { id: 4, title: "Ontology Model Initialization", description: "Compiling your stack's local calibration criteria." },
];

const SUGGESTED_SKILLS = ["React", "TypeScript", "Node.js", "Python", "Design Systems", "AWS", "GraphQL"];

// Move main logic to inner component
function OnboardingContent({ dbRole, dbName, dbUsername, dbEmail }: OnboardingClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Stateful role, resolvedName, and pendingUsername
    const [role, setRole] = useState<'recruiter' | 'candidate'>('candidate');
    const [resolvedName, setResolvedName] = useState<string>(dbName || '');
    const [pendingUsername, setPendingUsername] = useState<string | null>(null);

    const STEPS = role === 'recruiter' ? RECRUITER_STEPS : CANDIDATE_STEPS;

    const [currentStep, setCurrentStep] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    // Interactive Calibration Walkthrough states
    const [showCohortGuide, setShowCohortGuide] = useState(false);
    const [cohortGuideStep, setCohortGuideStep] = useState(1);
    const [cohortGuideMinimized, setCohortGuideMinimized] = useState(false);

    useEffect(() => {
        if (role === 'recruiter' && currentStep === 3) {
            setShowCohortGuide(true);
            setCohortGuideMinimized(false);
            setCohortGuideStep(1);
        } else {
            setShowCohortGuide(false);
        }
    }, [currentStep, role]);

    // Recruiter Model Calibration Telemetry compiler
    const [compileProgress, setCompileProgress] = useState(0);
    const [activeLogs, setActiveLogs] = useState<string[]>([]);

    useEffect(() => {
        if (role === 'recruiter' && currentStep === 4) {
            setCompileProgress(0);
            setActiveLogs(["Initializing connection protocol..."]);
            const logs = [
                "Verifying command credentials...",
                "Configuring bidirectional ATS webhooks...",
                "Ingesting Hero Hire benchmark telemetry...",
                "Decomposing Missed Signal parameters...",
                "Calibrating Mismatched Hire failed assertions...",
                "Synthesizing custom stack ontology rubric...",
                "Local execution models fully calibrated!"
            ];
            
            let currentLogIndex = 0;
            const logInterval = setInterval(() => {
                if (currentLogIndex < logs.length) {
                    setActiveLogs(prev => [...prev, logs[currentLogIndex]]);
                    currentLogIndex++;
                }
            }, 550);

            const interval = setInterval(() => {
                setCompileProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        clearInterval(logInterval);
                        return 100;
                    }
                    return prev + 4;
                });
            }, 150);

            return () => {
                clearInterval(interval);
                clearInterval(logInterval);
            };
        }
    }, [currentStep, role]);

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        username: dbUsername || '',
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
        // ATS Integrations
        atsSystem: 'greenhouse',
        atsWebhookSync: true,
        atsAutoPipeline: false,
        // Calibration Cohort Ingestions
        heroName: '',
        heroRole: '',
        heroOntology: '',
        missedName: '',
        missedRole: '',
        missedOntology: '',
        mismatchedName: '',
        mismatchedRole: '',
        mismatchedOntology: '',
    });

    // Sync from props and sessionStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const cachedRole = sessionStorage.getItem("skilledcore_pending_role");
            const cachedName = sessionStorage.getItem("skilledcore_pending_name");
            const cachedUsername = sessionStorage.getItem("skilledcore_pending_username");

            const urlRole = searchParams.get('role');
            const isRec = (dbRole?.toUpperCase() === 'RECRUITER') || (urlRole === 'recruiter') || (cachedRole?.toUpperCase() === 'RECRUITER');
            setRole(isRec ? 'recruiter' : 'candidate');

            if (cachedName) {
                setResolvedName(cachedName);
                sessionStorage.removeItem("skilledcore_pending_name");
            } else if (dbName) {
                setResolvedName(dbName);
            }

            if (cachedUsername) {
                setPendingUsername(cachedUsername);
                setFormData(prev => ({ ...prev, username: cachedUsername }));
                sessionStorage.removeItem("skilledcore_pending_username");
            } else if (dbUsername) {
                setFormData(prev => ({ ...prev, username: dbUsername }));
            }

            if (dbEmail) {
                setFormData(prev => ({ ...prev, workEmail: dbEmail }));
            }

            if (cachedRole) {
                sessionStorage.removeItem("skilledcore_pending_role");
            }
        }
    }, [dbRole, dbName, dbUsername, dbEmail, searchParams]);

    // --- UPLOAD SIMULATION ---
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSkipping, setIsSkipping] = useState(false);

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
            if (formData.username === dbUsername || formData.username === pendingUsername) {
                setUsernameStatus('available');
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
    }, [formData.username, dbUsername, pendingUsername]);
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
                if (!formData.username) return "Unique ID (Username) is required.";
                if (formData.username.length < 3) return "Username must be at least 3 characters.";
                if (usernameStatus === 'taken') return "Username is already taken.";
                if (!formData.companyName.trim()) return "Organization Name is required.";
                if (!formData.industry.trim()) return "Industry is required.";
            }
            if (step === 2) {
                if (!formData.workEmail.trim()) return "Work Email is required.";
                if (!formData.workEmail.includes('@')) return "Please enter a valid email address.";
            }
            if (step === 3) {
                if (!formData.heroName.trim()) return "Hero Hire candidate name is required.";
                if (!formData.heroRole.trim()) return "Hero Hire engineering role is required.";
                if (!formData.heroOntology.trim()) return "Hero Hire execution characteristics are required.";
                if (!formData.missedName.trim()) return "Missed Signal candidate name is required.";
                if (!formData.missedRole.trim()) return "Missed Signal engineering role is required.";
                if (!formData.missedOntology.trim()) return "Missed Signal pass rationale is required.";
                if (!formData.mismatchedName.trim()) return "Mismatched Hire candidate name is required.";
                if (!formData.mismatchedRole.trim()) return "Mismatched Hire engineering role is required.";
                if (!formData.mismatchedOntology.trim()) return "Mismatched Hire fail metrics are required.";
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
                        name: resolvedName, // Sync resolved name (from DB or cached from register page)
                        ...formData
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to save profile");
                }

                // Redirect
                router.push('/feed');
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Failed to save profile");
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

    const handleSkip = async () => {
        setIsSkipping(true);
        try {
            const res = await fetch("/api/user/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: role.toUpperCase(),
                    name: resolvedName,
                    ...formData
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to save profile");
            }

            toast.success("Onboarding completed successfully!");
            router.push('/feed');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to finalize onboarding.");
            router.push('/feed');
        } finally {
            setIsSkipping(false);
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
                    className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl focus-within:border-[var(--border-focus)] transition-all cursor-text"
                >
                    {formData.skills.map(s => (
                        <span key={s} className="px-2 py-1 bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] rounded-md text-sm flex items-center gap-1 border border-[var(--sc-purple-200)] animate-in fade-in zoom-in duration-200 font-semibold">
                            {s}
                            <button onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, skills: prev.skills.filter(i => i !== s) })); }} className="hover:text-[var(--sc-purple-900)] transition-colors cursor-pointer"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        className="bg-transparent outline-none flex-1 min-w-[120px] text-[var(--text-body)] placeholder:text-zinc-400 text-sm h-full"
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
                            className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--sc-purple-200)] bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] hover:bg-[var(--sc-purple-100)] disabled:opacity-30 transition-all cursor-pointer"
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
                        <div className="flex items-center justify-center gap-2 text-violet-300 font-mono text-sm animate-pulse">
                            <FileText className="w-4 h-4" />
                            ANALYZING DATA...
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-violet-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </div>
                )}

                {uploadStatus === 'complete' && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center bg-green-50/50 p-6 rounded-xl border border-green-200">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto border border-green-300">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-[var(--text-heading)] font-heading font-bold mb-1">Extraction Complete</h3>
                        <p className="text-sm text-green-700 font-semibold mb-4">Resume Analyzed & Data Ingested</p>
                        <Button variant="outline" onClick={() => setUploadStatus('idle')} className="text-xs h-8 bg-transparent border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] text-[var(--text-body)] cursor-pointer">Replace Resume</Button>
                    </motion.div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg-page)] flex flex-col relative overflow-hidden font-sans text-[var(--text-body)]">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--sc-purple-50),transparent_70%)]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--sc-purple-50)]/50 blur-[100px] rounded-full" />
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-1 bg-[var(--border-subtle)] fixed top-0 left-0 z-50">
                <motion.div
                    className="h-full shadow-[0_0_10px_rgba(139,92,246,0.2)] bg-gradient-to-r from-[var(--sc-purple-500)] to-[var(--sc-purple-700)]"
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
                            className="bg-[var(--bg-secondary-panel)] border border-[var(--border-strong)] px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] inline-block"
                        >
                            Step {currentStep} of {STEPS.length}
                        </motion.div>
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-[var(--text-heading)] mb-2 uppercase">
                                {STEPS[currentStep - 1].title}
                            </h1>
                            <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-sm mx-auto font-medium">
                                {STEPS[currentStep - 1].description}
                            </p>
                        </div>
                    </div>

                    {/* Content Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-8 shadow-xl min-h-[420px] flex flex-col relative overflow-hidden">

                        {/* Error Banner */}
                        <AnimatePresence>
                            {pageError && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50/80 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700 font-semibold">{pageError}</p>
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
                                                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Unique ID (Username) <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Hexagon className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                <Input
                                                                    placeholder="e.g. shadow_coder"
                                                                    className={cn(
                                                                        "pl-10 bg-[var(--bg-input)] border-[var(--border-default)] transition-colors h-11 text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)]",
                                                                        usernameStatus === 'available' ? "focus:border-green-500/50 border-green-500/20" :
                                                                            usernameStatus === 'taken' ? "focus:border-red-500/50 border-red-500/20" :
                                                                                "focus:border-[var(--sc-purple-600)]"
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
                                                                {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-[var(--icon-muted)]" />}
                                                                {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                                                            </div>
                                                            {usernameWarning && <p className="text-xs text-red-400">{usernameWarning}</p>}
                                                            {usernameStatus === 'taken' && <p className="text-xs text-red-400">Username taken.</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Professional Headline <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                <Input
                                                                    placeholder="e.g. Senior Frontend Architect"
                                                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)] transition-colors h-11"
                                                                    value={formData.headline}
                                                                    onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Current Location <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                <Input
                                                                    placeholder="City, Country"
                                                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)] transition-colors h-11"
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
                                                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Unique ID (Username) <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Hexagon className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                <Input
                                                                    placeholder="e.g. tech_scout"
                                                                    className={cn(
                                                                        "pl-10 bg-[var(--bg-input)] border-[var(--border-default)] transition-colors h-11 text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)]",
                                                                        usernameStatus === 'available' ? "focus:border-green-500/50 border-green-500/20" :
                                                                            usernameStatus === 'taken' ? "focus:border-red-500/50 border-red-500/20" :
                                                                                "focus:border-[var(--sc-purple-600)]"
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
                                                                {usernameStatus === 'checking' && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-[var(--icon-muted)]" />}
                                                                {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                                                            </div>
                                                            {usernameWarning && <p className="text-xs text-red-400">{usernameWarning}</p>}
                                                            {usernameStatus === 'taken' && <p className="text-xs text-red-400">Username taken.</p>}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Organization Name <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                <Input
                                                                    placeholder="e.g. Acme Corp"
                                                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)] transition-colors h-11"
                                                                    value={formData.companyName}
                                                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Industry <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Globe className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                <Input
                                                                    placeholder="e.g. Fintech, AI, Healthcare"
                                                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)] transition-colors h-11"
                                                                    value={formData.industry}
                                                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 2 && (
                                                    <div className="space-y-6">
                                                        <div className="space-y-4 border-b border-[var(--border-subtle)] pb-5">
                                                            <div className="flex items-center gap-2 text-[var(--sc-purple-700)] font-mono text-xs uppercase tracking-wider mb-2 font-bold">
                                                                <Hexagon className="w-3.5 h-3.5" />
                                                                1. Verify Command Credentials
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wide">Work Email <span className="text-red-500">*</span></Label>
                                                                <div className="relative">
                                                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-[var(--icon-muted)]" />
                                                                    <Input
                                                                        placeholder="you@company.com"
                                                                        type="email"
                                                                        className="pl-10 bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus:border-[var(--border-focus)] focus-visible:ring-[var(--border-focus)] transition-colors h-11"
                                                                        value={formData.workEmail}
                                                                        onChange={e => setFormData({ ...formData, workEmail: e.target.value })}
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-[var(--sc-purple-700)] font-mono text-xs uppercase tracking-wider font-bold">
                                                                <Building2 className="w-3.5 h-3.5" />
                                                                2. Select Primary ATS Integration
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {(['greenhouse', 'lever', 'ashby'] as const).map(ats => (
                                                                    <button
                                                                        key={ats}
                                                                        type="button"
                                                                        onClick={() => setFormData(prev => ({ ...prev, atsSystem: ats }))}
                                                                        className={cn(
                                                                            "py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm",
                                                                            formData.atsSystem === ats
                                                                                ? "bg-[var(--sc-purple-50)] border-[var(--sc-purple-300)] text-[var(--sc-purple-700)]"
                                                                                : "bg-[var(--bg-secondary-panel)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-sidebar-hover)]"
                                                                        )}
                                                                    >
                                                                        {ats}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl shadow-sm">
                                                                    <div>
                                                                        <div className="text-xs font-bold text-[var(--text-heading)]">Webhook Sync</div>
                                                                        <div className="text-[10px] text-[var(--text-secondary)]">Real-time bi-directional pipeline update</div>
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.atsWebhookSync}
                                                                        onChange={e => setFormData(prev => ({ ...prev, atsWebhookSync: e.target.checked }))}
                                                                        className="w-4 h-4 rounded text-[var(--sc-purple-600)] bg-[var(--bg-input)] border-[var(--border-default)] focus:ring-[var(--sc-purple-500)] cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl shadow-sm">
                                                                    <div>
                                                                        <div className="text-xs font-bold text-[var(--text-heading)]">Auto-Pipeline</div>
                                                                        <div className="text-[10px] text-[var(--text-secondary)]">Automate screening triggers</div>
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.atsAutoPipeline}
                                                                        onChange={e => setFormData(prev => ({ ...prev, atsAutoPipeline: e.target.checked }))}
                                                                        className="w-4 h-4 rounded text-[var(--sc-purple-600)] bg-[var(--bg-input)] border-[var(--border-default)] focus:ring-[var(--sc-purple-500)] cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 3 && (
                                                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                                                        <div className="bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] p-3 rounded-xl flex items-start gap-2.5 mb-2 shadow-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-[var(--sc-purple-700)] mt-0.5 shrink-0" />
                                                            <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                                                                To eliminate the <strong>cold start</strong>, please seed SkilledCore with 3 past benchmark candidates. This trains your local execution model on your exact stack ontology.
                                                            </div>
                                                        </div>

                                                        {/* Hero Hire Card */}
                                                        <div className="p-4 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl space-y-3 shadow-sm">
                                                            <div className="text-xs font-black text-[var(--sc-purple-700)] uppercase tracking-widest flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                Cohort 1: The Hero Hire (Successful Senior)
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    placeholder="Candidate name"
                                                                    className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus-visible:ring-[var(--border-focus)] text-xs h-9"
                                                                    value={formData.heroName}
                                                                    onChange={e => setFormData({ ...formData, heroName: e.target.value })}
                                                                />
                                                                <Input
                                                                    placeholder="Role (e.g. Senior Node Dev)"
                                                                    className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus-visible:ring-[var(--border-focus)] text-xs h-9"
                                                                    value={formData.heroRole}
                                                                    onChange={e => setFormData({ ...formData, heroRole: e.target.value })}
                                                                />
                                                            </div>
                                                            <textarea
                                                                placeholder="Standout execution characteristics (e.g., deep system architecture knowledge, modular code decomposer)..."
                                                                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-body)] placeholder:text-zinc-400 focus:outline-none focus:border-[var(--border-focus)] h-16 resize-none"
                                                                value={formData.heroOntology}
                                                                onChange={e => setFormData({ ...formData, heroOntology: e.target.value })}
                                                            />
                                                        </div>

                                                        {/* Missed Signal Card */}
                                                        <div className="p-4 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl space-y-3 shadow-sm">
                                                            <div className="text-xs font-black text-[var(--sc-purple-700)] uppercase tracking-widest flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sc-purple-400)] animate-pulse" />
                                                                Cohort 2: The Missed Signal (Regret Pass)
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    placeholder="Candidate name"
                                                                    className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus-visible:ring-[var(--border-focus)] text-xs h-9"
                                                                    value={formData.missedName}
                                                                    onChange={e => setFormData({ ...formData, missedName: e.target.value })}
                                                                />
                                                                <Input
                                                                    placeholder="Role (e.g. Fullstack Dev)"
                                                                    className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus-visible:ring-[var(--border-focus)] text-xs h-9"
                                                                    value={formData.missedRole}
                                                                    onChange={e => setFormData({ ...formData, missedRole: e.target.value })}
                                                                />
                                                            </div>
                                                            <textarea
                                                                placeholder="Why was this candidate passed on? (e.g. failed a generic algorithmic brainteaser but excels at high-performance systems execution)..."
                                                                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-body)] placeholder:text-zinc-400 focus:outline-none focus:border-[var(--border-focus)] h-16 resize-none"
                                                                value={formData.missedOntology}
                                                                onChange={e => setFormData({ ...formData, missedOntology: e.target.value })}
                                                            />
                                                        </div>

                                                        {/* Mismatched Hire Card */}
                                                        <div className="p-4 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl space-y-3 shadow-sm">
                                                            <div className="text-xs font-black text-[var(--sc-purple-700)] uppercase tracking-widest flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                                                                Cohort 3: The Mismatched Hire (Regret Hired)
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    placeholder="Candidate name"
                                                                    className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus-visible:ring-[var(--border-focus)] text-xs h-9"
                                                                    value={formData.mismatchedName}
                                                                    onChange={e => setFormData({ ...formData, mismatchedName: e.target.value })}
                                                                />
                                                                <Input
                                                                    placeholder="Role (e.g. Lead Frontend Dev)"
                                                                    className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-body)] placeholder:text-zinc-400 focus-visible:ring-[var(--border-focus)] text-xs h-9"
                                                                    value={formData.mismatchedRole}
                                                                    onChange={e => setFormData({ ...formData, mismatchedRole: e.target.value })}
                                                                />
                                                            </div>
                                                            <textarea
                                                                placeholder="Failed execution metrics (e.g. strong behavioral skills but lacks problem-solving autonomy and coding velocity)..."
                                                                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-body)] placeholder:text-zinc-400 focus:outline-none focus:border-[var(--border-focus)] h-16 resize-none"
                                                                value={formData.mismatchedOntology}
                                                                onChange={e => setFormData({ ...formData, mismatchedOntology: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 4 && (
                                                    <div className="flex flex-col h-full space-y-5 py-2">
                                                        <div className="space-y-2 text-center">
                                                            <div className="text-[var(--text-brand)] font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
                                                                ONTOLOGY SYNTHESIS IN PROGRESS...
                                                            </div>
                                                            <div className="h-2 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden border border-[var(--border-default)]">
                                                                <motion.div
                                                                    className="h-full bg-gradient-to-r from-[var(--sc-purple-500)] to-[var(--sc-purple-700)]"
                                                                    initial={{ width: "0%" }}
                                                                    animate={{ width: `${compileProgress}%` }}
                                                                    transition={{ duration: 0.3 }}
                                                                 />
                                                            </div>
                                                            <div className="text-[10px] text-[var(--text-secondary)] font-mono font-bold text-right">
                                                                {compileProgress}% COMPLETE
                                                            </div>
                                                        </div>

                                                        {/* Scrolling Telemetry Logs */}
                                                        <div className="flex-1 min-h-[160px] max-h-[180px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-y-auto space-y-1.5 font-mono text-[10px] text-zinc-400 leading-normal scrollbar-thin">
                                                            {activeLogs.map((log, i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    initial={{ opacity: 0, x: -5 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    className={cn(
                                                                        "flex gap-2 items-center",
                                                                        i === activeLogs.length - 1 ? "text-[var(--sc-purple-300)] font-bold" : "text-zinc-400"
                                                                    )}
                                                                >
                                                                    <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                                                    <span>&gt;&gt; {log}</span>
                                                                </motion.div>
                                                            ))}
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
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--border-subtle)]">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 1 || isSkipping}
                                className={cn("text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-sidebar-hover)] cursor-pointer", (currentStep === 1 || isSkipping) && "opacity-0 pointer-events-none")}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>

                            {currentStep === 3 && role === 'candidate' && (
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                    disabled={isSkipping}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-sidebar-hover)] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                    {isSkipping ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Finishing...
                                        </>
                                    ) : (
                                        "Skip & Complete"
                                    )}
                                </Button>
                            )}

                            <Button
                                onClick={nextStep}
                                disabled={isSkipping}
                                className="min-w-[140px] font-bold tracking-wide transition-all shadow-lg h-11 bg-gradient-to-r from-[var(--sc-purple-600)] to-[var(--sc-purple-700)] hover:from-[var(--sc-purple-500)] hover:to-[var(--sc-purple-600)] text-white shadow-[var(--sc-purple-500)]/20 cursor-pointer"
                            >
                                {currentStep === STEPS.length ? "LAUNCH" : "CONTINUE"}
                                {currentStep !== STEPS.length && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>

                    </div>
                </div>

            </div>

            {/* COHORT WALKTHROUGH GUIDE POPUP (Floating, non-blocking) */}
            <AnimatePresence>
                {showCohortGuide && !cohortGuideMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] font-sans"
                    >
                        <div className="w-full max-w-lg bg-[var(--bg-modal)] border border-[var(--sc-purple-200)] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left">
                            {/* Decorative top line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--sc-purple-500)] to-[var(--sc-purple-700)]" />
                            
                            {/* Header */}
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--sc-purple-700)] uppercase">Interactive Calibration Walkthrough</span>
                                    <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight mt-1 uppercase">Understanding Talent Calibration Cohorts</h3>
                                </div>
                                <button 
                                    onClick={() => setCohortGuideMinimized(true)}
                                    className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-sidebar-hover)] transition-all cursor-pointer border-none bg-transparent"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content based on Cohort Guide Step */}
                            <div className="min-h-[160px] flex flex-col justify-between">
                                <AnimatePresence mode="wait">
                                    {cohortGuideStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                                                A <strong>Calibration Cohort</strong> is a structural learning batch that trains your custom recruitment model on your team's specific stack ontology. 
                                            </p>
                                            <p className="text-xs text-[var(--text-heading)] leading-relaxed font-bold uppercase tracking-wider text-[9px]">
                                                How it works:
                                            </p>
                                            <ul className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2 list-disc pl-4 font-medium">
                                                <li>You seed the system with three key engineer profiles from your history.</li>
                                                <li>SkilledCore parses their characteristics to build a 100% objective sandbox evaluation benchmark.</li>
                                                <li>Subsequent candidates are evaluated directly against your high-performer execution criteria.</li>
                                            </ul>
                                        </motion.div>
                                    )}

                                    {cohortGuideStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-xs text-[var(--sc-purple-700)] leading-relaxed font-bold uppercase tracking-wide">
                                                Step 1: The Hero Hire (Your benchmark standard)
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                                Think of the strongest developer on your team. Write their details in the first block:
                                            </p>
                                            <div className="bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl p-3.5 space-y-1 shadow-sm">
                                                <p className="text-xs font-bold text-[var(--sc-purple-700)]">How to fill the fields:</p>
                                                <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 list-disc pl-4 leading-normal font-medium">
                                                    <li><span className="font-bold text-[var(--text-heading)]">Candidate Name / Role:</span> Their name and exact technical focus (e.g. Senior Backend Architect).</li>
                                                    <li><span className="font-bold text-[var(--text-heading)]">Standout execution characteristics:</span> Define what makes them excel. (e.g. lock-free atomic synchronizations, modular decoupling, or performance profiling depth).</li>
                                                </ul>
                                            </div>
                                        </motion.div>
                                    )}

                                    {cohortGuideStep === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-xs text-[var(--sc-purple-700)] leading-relaxed font-bold uppercase tracking-wide">
                                                Step 2 & 3: Missed Signals & Mismatched Hires
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                                To build a strong competitive moat, the model needs to understand who you regrettably missed vs who interviewed perfectly but failed on execution:
                                            </p>
                                            <div className="bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl p-3.5 space-y-2 shadow-sm">
                                                <div>
                                                    <p className="text-[11px] font-bold text-[var(--sc-purple-700)]">The Missed Signal (Regret Pass):</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] leading-normal pl-1 font-medium">Explain who you passed on for superficial reasons (e.g. poor verbal presentation, missed a generic graph traversal riddle) but who is actually a highly capable builder.</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-red-600">The Mismatched Hire (Regret Hired):</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] leading-normal pl-1 font-medium">Explain who was a verbal genius (rehearsed credentials) but failed to write autonomous, thread-safe production code under actual load spikes.</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Controls */}
                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--border-subtle)]">
                                    <div className="flex gap-1 text-[10px] font-mono text-[var(--text-tertiary)] font-bold">
                                        Step {cohortGuideStep} of 3
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {cohortGuideStep > 1 && (
                                            <Button
                                                onClick={() => setCohortGuideStep(prev => prev - 1)}
                                                className="bg-transparent border border-[var(--border-default)] hover:bg-[var(--bg-sidebar-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-heading)] px-3 h-9 cursor-pointer"
                                            >
                                                Back
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => {
                                                if (cohortGuideStep < 3) {
                                                    setCohortGuideStep(prev => prev + 1);
                                                } else {
                                                    setCohortGuideMinimized(true);
                                                }
                                            }}
                                            className="bg-gradient-to-r from-[var(--sc-purple-600)] to-[var(--sc-purple-700)] hover:from-[var(--sc-purple-500)] hover:to-[var(--sc-purple-600)] text-xs text-white px-4 h-9 font-bold cursor-pointer"
                                        >
                                            {cohortGuideStep === 3 ? "Close Guide" : "Next Step"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Minimized floating recall bubble */}
                {showCohortGuide && cohortGuideMinimized && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={() => setCohortGuideMinimized(false)}
                        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[var(--sc-purple-600)] to-[var(--sc-purple-700)] hover:from-[var(--sc-purple-500)] hover:to-[var(--sc-purple-600)] text-white px-4 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 border border-[var(--sc-purple-200)] text-xs tracking-wider uppercase active:scale-95 transition-transform cursor-pointer"
                    >
                        <AlertCircle className="w-4 h-4" />
                        Calibration Guide
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

interface OnboardingClientProps {
    dbRole?: string;
    dbName?: string;
    dbUsername?: string;
    dbEmail?: string;
}

export default function OnboardingClient({ dbRole, dbName, dbUsername, dbEmail }: OnboardingClientProps) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-violet-500 font-mono">INITIALIZING IDENTITY MATRIX...</div>}>
            <OnboardingContent dbRole={dbRole} dbName={dbName} dbUsername={dbUsername} dbEmail={dbEmail} />
        </Suspense>
    );
}
