'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUploadThing } from '@/lib/uploadthing';
import { updateUserProfile } from '@/app/(app)/profile/actions';
import { 
    Loader2, 
    Sparkles, 
    UploadCloud, 
    X, 
    Plus, 
    Trash2, 
    Globe, 
    CheckCircle2, 
    Briefcase, 
    GraduationCap, 
    Laptop, 
    User, 
    Share2, 
    FileText 
} from 'lucide-react';
import * as SiIcons from 'react-icons/si';
import * as FaIcons from 'react-icons/fa';

interface ResumeProfileBuilderProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
    context: 'onboarding' | 'profile';
}

// Inline Social Icon Detection Helper matching exact comments rules
function getSocialIconName(urlOrText: string): string {
    const text = urlOrText.trim().toLowerCase();
    
    // @ without http
    if (text.includes('@') && !text.includes('http') && !text.includes('//')) {
        return 'FaEnvelope';
    }
    
    // Phone number pattern: starts with +, +92, +1, or standard digits format
    const phonePattern = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;
    const looksLikePhone = phonePattern.test(text) || text.startsWith('+92') || text.startsWith('+1') || (text.replace(/[\s-+()]/g, '').length >= 10 && !isNaN(Number(text.replace(/[\s-+()]/g, ''))));
    if (looksLikePhone) {
        return 'SiWhatsapp';
    }
    
    if (text.includes('linkedin.com')) {
        return 'SiLinkedin';
    }
    if (text.includes('github.com')) {
        return 'SiGithub';
    }
    if (text.includes('behance.net')) {
        return 'SiBehance';
    }
    if (text.includes('dribbble.com')) {
        return 'SiDribbble';
    }
    if (text.includes('twitter.com') || text.includes('x.com')) {
        return 'SiX';
    }
    if (text.includes('instagram.com')) {
        return 'SiInstagram';
    }
    if (text.includes('facebook.com')) {
        return 'SiFacebook';
    }
    if (text.includes('youtube.com') || text.includes('youtu.be')) {
        return 'SiYoutube';
    }
    if (text.includes('fiverr.com')) {
        return 'SiFiverr';
    }
    if (text.includes('upwork.com')) {
        return 'SiUpwork';
    }
    
    return 'FaGlobe';
}

export function ResumeProfileBuilder({ user, isOpen, onClose, context }: ResumeProfileBuilderProps) {
    const router = useRouter();
    
    // Parsing states
    const [step, setStep] = useState<'choice' | 'upload' | 'parsing' | 'review'>('choice');
    const [progressText, setProgressText] = useState('Initializing scan...');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Form Review states (All parsed data loaded here)
    const [basics, setBasics] = useState({
        name: '',
        headline: '',
        location: '',
        summary: ''
    });
    const [experience, setExperience] = useState<any[]>([]);
    const [education, setEducation] = useState<any[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [socials, setSocials] = useState<any[]>([]);
    const [newSkill, setNewSkill] = useState('');
    
    // Action states
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'socials'>('basics');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // UploadThing integration
    const { startUpload } = useUploadThing("resumeUploader", {
        onClientUploadComplete: () => {
            console.log("File successfully uploaded to store");
        },
        onUploadError: (error) => {
            console.error("UploadThing failed:", error.message);
        }
    });

    // Reset step based on resumeUrl existence
    useEffect(() => {
        if (isOpen) {
            setSaveError(null);
            setParseError(null);
            setShowSuccessToast(false);
            setActiveTab('basics');
            if (user?.resumeUrl) {
                setStep('choice');
            } else {
                setStep('upload');
            }
        }
    }, [isOpen, user]);

    // Render Platform Social Icon
    const renderSocialIcon = (iconName: string) => {
        const IconComponent = (SiIcons as any)[iconName] || (FaIcons as any)[iconName];
        if (IconComponent) {
            return <IconComponent className="w-5 h-5 text-white" style={{ color: '#FFFFFF' }} />;
        }
        return <Globe className="w-5 h-5 text-white" style={{ color: '#FFFFFF' }} />;
    };

    // Parse with AI directly from uploaded File
    const handleParseFile = async (file: File) => {
        try {
            setParseError(null);
            setIsAnalyzing(true);
            setStep('parsing');
            setProgressText("Uploading file layer...");
            
            const formData = new FormData();
            formData.append('file', file);
            
            setProgressText("Reading content blocks...");
            
            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.error || "Failed to scan document structure");
            }
            
            setProgressText("Calibrating structured items...");
            loadParsedData(data);
            setStep('review');
        } catch (error: any) {
            console.error("Option B upload parse failed:", error);
            const msg = (error.message || "").toLowerCase();
            let errorMsg = "An unexpected error occurred. Please try again.";
            if (msg.includes('retrieve') || msg.includes('file')) {
                errorMsg = "Could not access your resume file. Try uploading a new one.";
            } else if (msg.includes('parsing') || msg.includes('ai')) {
                errorMsg = "AI parsing failed. Please try again in a moment.";
            } else if (msg.includes('json') || msg.includes('read') || msg.includes('format')) {
                errorMsg = "Resume format not recognized. Try a PDF format.";
            }
            setParseError(errorMsg);
            setStep(user?.resumeUrl ? 'choice' : 'upload');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Option A: Parse existing resumeUrl from database
    const handleParseExisting = async () => {
        if (!user?.resumeUrl) return;
        
        try {
            setParseError(null);
            setIsAnalyzing(true);
            setStep('parsing');
            setProgressText("Accessing existing resume document...");
            
            const response = await fetch('/api/ai/parse-resume-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: user.resumeUrl })
            });
            
            const resData = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(resData.error || "Failed to scan existing resume");
            }
            
            setProgressText("Refining profile data layers...");
            loadParsedData(resData);
            setStep('review');
        } catch (error: any) {
            console.error("Option A URL parse failed:", error);
            const msg = (error.message || "").toLowerCase();
            let errorMsg = "An unexpected error occurred. Please try again.";
            if (msg.includes('retrieve') || msg.includes('file')) {
                errorMsg = "Could not access your resume file. Try uploading a new one.";
            } else if (msg.includes('parsing') || msg.includes('ai')) {
                errorMsg = "AI parsing failed. Please try again in a moment.";
            } else if (msg.includes('json') || msg.includes('read') || msg.includes('format')) {
                errorMsg = "Resume format not recognized. Try a PDF format.";
            }
            setParseError(errorMsg);
            setStep(user?.resumeUrl ? 'choice' : 'upload');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Map AI result fields to UI editor state structures
    const loadParsedData = (data: any) => {
        const basicsData = data.basics || {};
        setBasics({
            name: basicsData.name || data.name || user?.name || '',
            headline: basicsData.headline || data.headline || '',
            location: basicsData.location || data.location || '',
            summary: basicsData.summary || data.summary || ''
        });
        
        // Map experience
        const parsedExperience = (data.experience || []).map((exp: any) => ({
            position: exp.title || exp.position || exp.role || '',
            company: exp.company || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            description: exp.description || ''
        }));
        setExperience(parsedExperience);
        
        // Map education
        const parsedEducation = (data.education || []).map((edu: any) => ({
            school: edu.institution || edu.school || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startYear || edu.startDate || '',
            endDate: edu.endYear || edu.endDate || ''
        }));
        setEducation(parsedEducation);
        
        setSkills(data.skills || []);
        
        // Map projects
        const parsedProjects = (data.projects || []).map((proj: any) => ({
            title: proj.name || proj.title || '',
            description: proj.description || '',
            link: proj.url || proj.link || '',
            technologies: proj.technologies || []
        }));
        setProjects(parsedProjects);
        
        // Socials map + detect matching commentary rules
        const parsedSocials = (data.socials || []).map((soc: any) => {
            const url = soc.url || '';
            const label = soc.label || soc.title || 'Link';
            const detectedIcon = getSocialIconName(url || label);
            return {
                title: label,
                url: url,
                icon: detectedIcon
            };
        });
        setSocials(parsedSocials);
        
        toast.success("Resume Parsed Successfully!");
    };

    // File Selection Handlers
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileToUpload(file);
            handleParseFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
                setFileToUpload(file);
                handleParseFile(file);
            } else {
                toast.error("Invalid file format. Please upload PDF or Word documents.");
            }
        }
    };

    // Skills additions
    const handleAddSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!skills.includes(newSkill.trim())) {
                setSkills([...skills, newSkill.trim()]);
            }
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    // Experince list item editors
    const handleAddExperience = () => {
        setExperience([...experience, { position: '', company: '', startDate: '', endDate: '', description: '' }]);
    };

    const handleRemoveExperience = (idx: number) => {
        setExperience(experience.filter((_, i) => i !== idx));
    };

    const handleExperienceChange = (idx: number, field: string, val: string) => {
        const updated = experience.map((exp, i) => {
            if (i === idx) return { ...exp, [field]: val };
            return exp;
        });
        setExperience(updated);
    };

    // Education item editors
    const handleAddEducation = () => {
        setEducation([...education, { school: '', degree: '', startDate: '', endDate: '', fieldOfStudy: '' }]);
    };

    const handleRemoveEducation = (idx: number) => {
        setEducation(education.filter((_, i) => i !== idx));
    };

    const handleEducationChange = (idx: number, field: string, val: string) => {
        const updated = education.map((edu, i) => {
            if (i === idx) return { ...edu, [field]: val };
            return edu;
        });
        setEducation(updated);
    };

    // Project editors
    const handleAddProject = () => {
        setProjects([...projects, { title: '', description: '', link: '', technologies: [] }]);
    };

    const handleRemoveProject = (idx: number) => {
        setProjects(projects.filter((_, i) => i !== idx));
    };

    const handleProjectChange = (idx: number, field: string, val: string) => {
        const updated = projects.map((proj, i) => {
            if (i === idx) return { ...proj, [field]: val };
            return proj;
        });
        setProjects(updated);
    };

    // Social editors & auto-icon detection on key input
    const handleAddSocial = () => {
        setSocials([...socials, { title: 'Link', url: '', icon: 'FaGlobe' }]);
    };

    const handleRemoveSocial = (idx: number) => {
        setSocials(socials.filter((_, i) => i !== idx));
    };

    const handleSocialChange = (idx: number, field: string, val: string) => {
        const updated = socials.map((soc, i) => {
            if (i === idx) {
                const item = { ...soc, [field]: val };
                if (field === 'url') {
                    item.icon = getSocialIconName(val);
                }
                return item;
            }
            return soc;
        });
        setSocials(updated);
    };

    // Atomic DB Save Action
    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveError(null);
        toast.info("Saving profile data...", { duration: 2000 });

        try {
            let resumeUrl = user?.resumeUrl || undefined;

            // 1. Upload file first if new file is selected
            if (fileToUpload) {
                const uploadRes = await startUpload([fileToUpload]);
                if (uploadRes && uploadRes.length > 0) {
                    resumeUrl = uploadRes[0].url;
                } else {
                    throw new Error("Resume upload failed. Try again.");
                }
            }

            // 2. Format and Save atomic data blocks
            const payload = {
                name: basics.name || undefined,
                headline: basics.headline,
                bio: basics.summary,
                location: basics.location,
                skills: skills,
                experience: experience,
                education: education,
                projects: projects,
                customLinks: socials.length > 0 ? JSON.stringify(socials) : null,
                resumeUrl: resumeUrl
            };

            const result = await updateUserProfile(payload);
            if (!result.success) {
                throw new Error(result.message || "Failed to update profile values");
            }

            // 3. Success Trigger
            setShowSuccessToast(true);
            setTimeout(() => {
                setShowSuccessToast(false);
                onClose();
                if (context === 'onboarding') {
                    router.push('/profile/me');
                } else {
                    router.refresh();
                }
            }, 3000);

        } catch (err: any) {
            console.error("Save failed:", err);
            setSaveError(err.message || "Something went wrong. Your data was not saved. Try again.");
            toast.error("Profile synchronization failed");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={() => !isAnalyzing && onClose()}>
                <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-6 rounded-xl border border-[var(--border-modal)] bg-[var(--bg-modal)] text-[var(--text-body)] shadow-[var(--shadow-modal)] font-sans">
                    <DialogHeader className="border-b border-[var(--border-subtle)] pb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text-heading)]">
                            <Sparkles className="w-5 h-5 text-[var(--sc-purple-600)] animate-pulse" />
                            AI Resume Profile Builder
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--text-secondary)]">
                            Parse credentials, elaborate project contexts, and build a cohesive SkilledCore identity in seconds.
                        </DialogDescription>
                    </DialogHeader>

                    {parseError && (
                        <div className="bg-sc-red-50 border border-sc-red-200 rounded-xl p-4 mt-4 text-sm text-sc-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                            <span className="font-medium">{parseError}</span>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setParseError(null);
                                    setStep(user?.resumeUrl ? 'choice' : 'upload');
                                }}
                                className="h-8 border-sc-red-200 text-sc-red-700 hover:bg-sc-red-100 hover:text-sc-red-800 text-xs rounded-xl font-bold bg-white cursor-pointer transition-all border self-end sm:self-auto px-3 shrink-0"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Step 1: Choice view (Only if resume already exists) */}
                    {step === 'choice' && (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-6">
                            <div className="text-center max-w-md">
                                <h3 className="text-base font-bold text-[var(--text-heading)] mb-2">Existing Resume Found</h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    We detected an existing resume linked to your account. Select a path below to initialize the builder.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                <button
                                    onClick={handleParseExisting}
                                    className="p-5 border border-[var(--border-default)] hover:border-[var(--sc-purple-300)] hover:bg-[var(--sc-purple-50)]/50 rounded-xl text-left transition-all group flex flex-col gap-2 bg-transparent cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[var(--sc-purple-100)] flex items-center justify-center group-hover:bg-[var(--sc-purple-200)] transition-colors">
                                        <Sparkles className="w-5 h-5 text-[var(--sc-purple-600)]" />
                                    </div>
                                    <h4 className="text-sm font-bold text-[var(--text-heading)]">Option A: Parse existing resume</h4>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                        Skip file uploads. Instantly scan your stored resume URL with our latest parsing engines.
                                    </p>
                                </button>

                                <button
                                    onClick={() => setStep('upload')}
                                    className="p-5 border border-[var(--border-default)] hover:border-[var(--sc-purple-300)] hover:bg-[var(--sc-purple-50)]/50 rounded-xl text-left transition-all group flex flex-col gap-2 bg-transparent cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                        <UploadCloud className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <h4 className="text-sm font-bold text-[var(--text-heading)]">Option B: Upload a new resume file</h4>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                        Replace your stored file. Drag or drop a fresh PDF, DOC, or DOCX resume to start scanning.
                                    </p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Upload new resume dropzone */}
                    {step === 'upload' && (
                        <div className="flex-1 flex flex-col justify-center py-8">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer overflow-hidden ${
                                    isDragging 
                                    ? 'border-[var(--sc-purple-500)] bg-[var(--sc-purple-50)]' 
                                    : 'border-[var(--border-default)] bg-[var(--bg-secondary-panel)] hover:border-[var(--sc-purple-400)] hover:bg-[var(--sc-purple-50)]/45'
                                }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileInput}
                                />
                                
                                <div className="text-center space-y-3 pointer-events-none text-[var(--text-secondary)] group-hover:text-[var(--text-heading)]">
                                    <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border border-[var(--border-default)] transition-colors ${
                                        isDragging ? 'bg-[var(--sc-purple-600)] text-white' : 'bg-[var(--bg-modal)] text-slate-400 group-hover:text-[var(--sc-purple-600)] group-hover:border-[var(--sc-purple-200)]'
                                    }`}>
                                        <UploadCloud className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text-heading)]">Drag & Drop Resume</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">PDF, DOC, or DOCX up to 10MB</p>
                                    </div>
                                </div>
                            </div>
                            
                            {user?.resumeUrl && (
                                <button
                                    onClick={() => setStep('choice')}
                                    className="text-xs text-[var(--sc-purple-600)] font-bold hover:underline cursor-pointer text-center mt-4 bg-transparent border-none"
                                >
                                    ← Back to choices
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 3: Pulsing scan loader */}
                    {step === 'parsing' && (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-[var(--border-subtle)] rounded-full" />
                                <div className="absolute inset-0 border-4 border-[var(--sc-purple-600)] border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-[var(--sc-purple-600)] animate-spin" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-base font-bold text-[var(--text-heading)]">Reading your resume...</h3>
                                <p className="text-xs text-[var(--sc-purple-700)] font-medium animate-pulse">{progressText}</p>
                                <p className="text-[11px] text-[var(--text-tertiary)]">This takes about 10–15 seconds. Please do not close the window.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                    setIsAnalyzing(false);
                                    setStep(user?.resumeUrl ? 'choice' : 'upload');
                                }}
                                className="border-[var(--border-default)] hover:bg-[var(--bg-secondary-panel)] text-xs rounded-xl"
                            >
                                Cancel scanning
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Full Edit Review Modal */}
                    {step === 'review' && (
                        <div className="flex-1 flex flex-col overflow-hidden min-h-[450px]">
                            {/* Tab selector */}
                            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--border-subtle)] shrink-0">
                                {([
                                    { id: 'basics', label: 'Basics', icon: User },
                                    { id: 'experience', label: 'Experience', icon: Briefcase },
                                    { id: 'education', label: 'Education', icon: GraduationCap },
                                    { id: 'skills', label: 'Skills', icon: Laptop },
                                    { id: 'projects', label: 'Projects', icon: FileText },
                                    { id: 'socials', label: 'Socials', icon: Share2 }
                                ] as const).map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                                                activeTab === tab.id 
                                                ? 'border-[var(--sc-purple-650)] text-[var(--sc-purple-700)] font-extrabold' 
                                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-body)] hover:border-[var(--border-default)]'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Panels */}
                            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar text-left">
                                
                                {/* 1. Basics Panel */}
                                {activeTab === 'basics' && (
                                    <div className="space-y-4 max-w-2xl">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="basics-name" className="text-xs font-bold text-[var(--text-heading)]">Full Name</Label>
                                                <Input 
                                                    id="basics-name" 
                                                    value={basics.name} 
                                                    onChange={e => setBasics({ ...basics, name: e.target.value })}
                                                    placeholder="Ahmad Raza"
                                                    className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="basics-location" className="text-xs font-bold text-[var(--text-heading)]">Location</Label>
                                                <Input 
                                                    id="basics-location" 
                                                    value={basics.location} 
                                                    onChange={e => setBasics({ ...basics, location: e.target.value })}
                                                    placeholder="Lahore, Pakistan"
                                                    className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="basics-headline" className="text-xs font-bold text-[var(--text-heading)]">Headline</Label>
                                            <Input 
                                                id="basics-headline" 
                                                value={basics.headline} 
                                                onChange={e => setBasics({ ...basics, headline: e.target.value })}
                                                placeholder="Senior Frontend Developer @ SkilledCore"
                                                className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="basics-summary" className="text-xs font-bold text-[var(--text-heading)]">Professional Summary</Label>
                                            <Textarea 
                                                id="basics-summary" 
                                                value={basics.summary} 
                                                onChange={e => setBasics({ ...basics, summary: e.target.value })}
                                                placeholder="Brief bio summarising core architectural feats..."
                                                className="min-h-32 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl text-sm p-3"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 2. Experience Panel */}
                                {activeTab === 'experience' && (
                                    <div className="space-y-4">
                                        {experience.map((exp, idx) => (
                                            <div key={idx} className="relative p-4 border border-[var(--border-default)] rounded-xl bg-[var(--bg-secondary-panel)] space-y-3 group">
                                                <button
                                                    onClick={() => handleRemoveExperience(idx)}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-[var(--sc-red-500)] hover:bg-[var(--sc-red-50)] opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer"
                                                    title="Remove job"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Job Title</Label>
                                                        <Input 
                                                            value={exp.position || exp.role || exp.title || ''} 
                                                            onChange={e => handleExperienceChange(idx, 'position', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Company Name</Label>
                                                        <Input 
                                                            value={exp.company || ''} 
                                                            onChange={e => handleExperienceChange(idx, 'company', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 w-72">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Start Year/Date</Label>
                                                        <Input 
                                                            value={exp.startDate || ''} 
                                                            onChange={e => handleExperienceChange(idx, 'startDate', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">End Year/Date</Label>
                                                        <Input 
                                                            value={exp.endDate || ''} 
                                                            onChange={e => handleExperienceChange(idx, 'endDate', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Description / Contributions</Label>
                                                    <Textarea 
                                                        value={exp.description || ''} 
                                                        onChange={e => handleExperienceChange(idx, 'description', e.target.value)}
                                                        className="min-h-20 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <Button 
                                            variant="outline" 
                                            onClick={handleAddExperience}
                                            className="w-full border-2 border-dashed border-[var(--border-default)] hover:border-[var(--sc-purple-400)] hover:text-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-50)]/45 rounded-xl h-10 text-xs font-bold gap-1 flex items-center justify-center transition-all bg-transparent"
                                        >
                                            <Plus className="w-4 h-4" /> Add Experience Record
                                        </Button>
                                    </div>
                                )}

                                {/* 3. Education Panel */}
                                {activeTab === 'education' && (
                                    <div className="space-y-4">
                                        {education.map((edu, idx) => (
                                            <div key={idx} className="relative p-4 border border-[var(--border-default)] rounded-xl bg-[var(--bg-secondary-panel)] space-y-3 group">
                                                <button
                                                    onClick={() => handleRemoveEducation(idx)}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-[var(--sc-red-500)] hover:bg-[var(--sc-red-50)] opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer"
                                                    title="Remove education"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">School / Institution</Label>
                                                        <Input 
                                                            value={edu.school || ''} 
                                                            onChange={e => handleEducationChange(idx, 'school', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Degree / Certification</Label>
                                                        <Input 
                                                            value={edu.degree || ''} 
                                                            onChange={e => handleEducationChange(idx, 'degree', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="space-y-1.5 col-span-2">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Field of Study</Label>
                                                        <Input 
                                                            value={edu.fieldOfStudy || ''} 
                                                            onChange={e => handleEducationChange(idx, 'fieldOfStudy', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Date / Years</Label>
                                                        <Input 
                                                            value={edu.startDate || ''} 
                                                            onChange={e => handleEducationChange(idx, 'startDate', e.target.value)}
                                                            placeholder="2016 - 2020"
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button 
                                            variant="outline" 
                                            onClick={handleAddEducation}
                                            className="w-full border-2 border-dashed border-[var(--border-default)] hover:border-[var(--sc-purple-400)] hover:text-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-50)]/45 rounded-xl h-10 text-xs font-bold gap-1 flex items-center justify-center transition-all bg-transparent"
                                        >
                                            <Plus className="w-4 h-4" /> Add Education Record
                                        </Button>
                                    </div>
                                )}

                                {/* 4. Skills Panel */}
                                {activeTab === 'skills' && (
                                    <div className="space-y-4 max-w-2xl">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="skills-input" className="text-xs font-bold text-[var(--text-heading)]">Add Skills</Label>
                                            <Input 
                                                id="skills-input"
                                                value={newSkill}
                                                onChange={e => setNewSkill(e.target.value)}
                                                onKeyDown={handleAddSkill}
                                                placeholder="Type a skill and press Enter..."
                                                className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                            />
                                            <p className="text-[10px] text-[var(--text-tertiary)]">Enter technologies (e.g. Next.js, Docker, Kubernetes) to append to your arsenal.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-[var(--text-heading)] block mb-1">Your Skills ({skills.length})</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.map((skill, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="inline-flex items-center gap-1 text-xs bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] px-2.5 py-1 rounded-lg font-medium"
                                                    >
                                                        {skill}
                                                        <button
                                                            onClick={() => handleRemoveSkill(skill)}
                                                            className="text-[var(--sc-purple-400)] hover:text-[var(--sc-purple-700)] p-0.5 border-none bg-transparent cursor-pointer rounded-full"
                                                            title="Remove skill"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {skills.length === 0 && (
                                                    <p className="text-xs text-[var(--text-tertiary)] italic">No skills added yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 5. Projects Panel */}
                                {activeTab === 'projects' && (
                                    <div className="space-y-4">
                                        {projects.map((proj, idx) => (
                                            <div key={idx} className="relative p-4 border border-[var(--border-default)] rounded-xl bg-[var(--bg-secondary-panel)] space-y-3 group">
                                                <button
                                                    onClick={() => handleRemoveProject(idx)}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-[var(--sc-red-500)] hover:bg-[var(--sc-red-50)] opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer"
                                                    title="Remove project"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Project Title</Label>
                                                        <Input 
                                                            value={proj.title || proj.name || ''} 
                                                            onChange={e => handleProjectChange(idx, 'title', e.target.value)}
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">Project Link / URL</Label>
                                                        <Input 
                                                            value={proj.link || proj.url || ''} 
                                                            onChange={e => handleProjectChange(idx, 'link', e.target.value)}
                                                            placeholder="https://..."
                                                            className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-sm font-mono"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[11px] font-bold text-[var(--text-secondary)]">AI-Elaborated Description</Label>
                                                        <span className="text-[10px] text-[var(--sc-purple-600)] font-bold bg-[var(--sc-purple-50)] px-1.5 py-0.5 rounded border border-[var(--sc-purple-200)]">
                                                            Expanded to 4-6 sentences
                                                        </span>
                                                    </div>
                                                    <Textarea 
                                                        value={proj.description || ''} 
                                                        onChange={e => handleProjectChange(idx, 'description', e.target.value)}
                                                        className="min-h-24 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <Button 
                                            variant="outline" 
                                            onClick={handleAddProject}
                                            className="w-full border-2 border-dashed border-[var(--border-default)] hover:border-[var(--sc-purple-400)] hover:text-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-50)]/45 rounded-xl h-10 text-xs font-bold gap-1 flex items-center justify-center transition-all bg-transparent"
                                        >
                                            <Plus className="w-4 h-4" /> Add Project Record
                                        </Button>
                                    </div>
                                )}

                                {/* 6. Socials Panel */}
                                {activeTab === 'socials' && (
                                    <div className="space-y-4 max-w-3xl">
                                        {socials.map((soc, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--bg-secondary-panel)] border border-[var(--border-subtle)] rounded-xl group">
                                                {/* Left Icon Square */}
                                                <div className="w-10 h-10 bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-700)] rounded-lg flex items-center justify-center shrink-0 shadow-sm border-none relative">
                                                    {renderSocialIcon(soc.icon)}
                                                </div>
                                                
                                                <div className="w-32 flex-shrink-0">
                                                    <Input 
                                                        value={soc.title}
                                                        onChange={e => handleSocialChange(idx, 'title', e.target.value)}
                                                        placeholder="Label"
                                                        className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-sm text-[var(--text-body)] placeholder:text-[var(--text-placeholder)] focus:outline-none transition-colors"
                                                    />
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <Input 
                                                        value={soc.url}
                                                        onChange={e => handleSocialChange(idx, 'url', e.target.value)}
                                                        placeholder="https://..."
                                                        className="h-9 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-sm text-[var(--text-body)] placeholder:text-[var(--text-placeholder)] focus:outline-none transition-colors font-mono"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveSocial(idx)}
                                                    className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--sc-red-500)] hover:bg-[var(--sc-red-50)] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                    title="Remove link"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <Button 
                                            variant="outline" 
                                            onClick={handleAddSocial}
                                            className="w-full border-2 border-dashed border-[var(--border-default)] hover:border-[var(--sc-purple-400)] hover:text-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-50)]/45 rounded-xl h-10 text-xs font-bold gap-1 flex items-center justify-center transition-all bg-transparent"
                                        >
                                            <Plus className="w-4 h-4" /> Add Social Link
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="border-t border-[var(--border-subtle)] pt-4 flex flex-col gap-2 shrink-0">
                        {saveError && (
                            <p className="text-sm text-sc-red-650 font-semibold">{saveError}</p>
                        )}
                        
                        <div className="flex items-center justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={onClose} 
                                disabled={isSaving || isAnalyzing}
                                className="border-[var(--border-default)] hover:bg-[var(--bg-secondary-panel)] h-10 px-4 rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            
                            {step === 'review' ? (
                                <Button 
                                    onClick={handleSaveProfile} 
                                    disabled={isSaving}
                                    className="bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-750)] text-white shadow-md shadow-[var(--sc-purple-100)] border-none h-10 px-5 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                                            Saving profile...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2 text-white" />
                                            Save SkilledCore Profile
                                        </>
                                    )}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Fixed Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 right-4 z-[99999] bg-sc-green-100 text-sc-green-700 border border-sc-green-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2.5 font-sans text-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-sc-green-600 shrink-0" />
                    <div>
                        <p className="font-bold">Identity Synced Successfully!</p>
                        <p className="text-xs opacity-90 mt-0.5">Your SkilledCore neural pattern is fully initialized.</p>
                    </div>
                </div>
            )}
        </>
    );
}
