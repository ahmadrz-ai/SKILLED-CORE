'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    FileText,
    Save,
    ArrowLeft,
    ChevronLeft,
    CheckCircle
} from 'lucide-react';
import { iconMap } from '@/lib/icons';
import { SocialIcon } from '@/components/shared/SocialIcon';

interface ResumeProfileBuilderProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
    context: 'onboarding' | 'profile';
}

interface SummaryChange {
    type: 'added' | 'updated' | 'removed';
    label: string;
}

interface SummaryData {
    tabName: string;
    isFull: boolean;
    changes: SummaryChange[];
}

interface ParsedResume {
    basics: {
        name: string;
        headline: string;
        location: string;
        summary: string;
        email?: string;
        phone?: string;
    };
    experience: any[];
    education: any[];
    skills: string[];
    projects: any[];
    socials: any[];
    certifications?: any[];
    languages?: any[];
}

// Map database user data profile state to ParsedResume structure
const getUserProfileAsParsedResume = (u: any): ParsedResume => {
    let parsedSkills: string[] = [];
    try {
        if (u?.skills) {
            const trimmed = typeof u.skills === 'string' ? u.skills.trim() : '';
            if (trimmed.startsWith('[')) {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    parsedSkills = parsed.map((s: any) => {
                        if (s && typeof s === 'object') return String(s.name || '');
                        return String(s);
                    }).map((s: string) => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
                }
            } else if (Array.isArray(u.skills)) {
                parsedSkills = u.skills.map((s: any) => {
                    if (s && typeof s === 'object') return String(s.name || '');
                    return String(s);
                }).map((s: string) => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
            } else {
                parsedSkills = trimmed.split(',').map((s: string) => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
            }
        }
    } catch (e) {
        parsedSkills = [];
    }
    
    let parsedSocials: any[] = [];
    try {
        parsedSocials = u?.customLinks ? (typeof u.customLinks === 'string' ? JSON.parse(u.customLinks) : u.customLinks) : [];
    } catch (e) {
        parsedSocials = [];
    }

    return {
        basics: {
            name: u?.name || '',
            headline: u?.headline || '',
            location: u?.location || '',
            summary: u?.bio || '',
            email: u?.email || '',
            phone: u?.phone || ''
        },
        experience: (u?.experience || []).map((exp: any) => ({
            position: exp.position || exp.role || exp.title || '',
            company: exp.company || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            description: exp.description || ''
        })),
        education: (u?.education || []).map((edu: any) => ({
            school: edu.school || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || ''
        })),
        skills: parsedSkills,
        projects: (u?.projects || []).map((proj: any) => ({
            title: proj.title || proj.name || '',
            description: proj.description || '',
            link: proj.link || proj.url || '',
            technologies: proj.technologies || []
        })),
        socials: parsedSocials.map((soc: any) => ({
            title: soc.title || soc.label || 'Link',
            url: soc.url || '',
            icon: soc.icon || getSocialIconName(soc.url || soc.title || '')
        })),
        certifications: [],
        languages: []
    };
};

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

const TAB_LABELS: Record<string, string> = {
    basics: 'Basics',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    socials: 'Socials',
};

export function ResumeProfileBuilder({ user, isOpen, onClose, context }: ResumeProfileBuilderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Custom helper to update query params synchronously in the browser address bar
    const updateUrlParams = (updates: Record<string, string | null>) => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, val]) => {
            if (val === null) {
                params.delete(key);
            } else {
                params.set(key, val);
            }
        });
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    };
    
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
        summary: '',
        email: '',
        phone: ''
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
    
    // Read initial states from URL parameters
    const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'socials'>(() => {
        const tab = searchParams.get('tab');
        if (tab && ['basics', 'experience', 'education', 'skills', 'projects', 'socials'].includes(tab)) {
            return tab as any;
        }
        return 'basics';
    });
    
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Per-tab save states (Task 2 & 9)
    const [isSavingTab, setIsSavingTab] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);
    
    const [showSummaryPopup, setShowSummaryPopup] = useState(() => {
        return searchParams.get('popup') === 'true';
    });
    
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [originalData, setOriginalData] = useState<ParsedResume | null>(null);
    const [tabError, setTabError] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<any | null>(null);
    const [pendingTabName, setPendingTabName] = useState<string | null>(null);
    
    const [popupState, setPopupState] = useState<'preview' | 'saving' | 'success' | 'error'>(() => {
        const state = searchParams.get('popupState');
        if (state && ['preview', 'saving', 'success', 'error'].includes(state)) {
            return state as any;
        }
        return 'preview';
    });

    // Synchronize open, active tab, and popup states with the URL
    useEffect(() => {
        if (isOpen) {
            updateUrlParams({ 
                builder: 'open', 
                tab: activeTab,
                popup: showSummaryPopup ? 'true' : null,
                popupState: showSummaryPopup ? popupState : null
            });
        } else {
            updateUrlParams({ builder: null, tab: null, popup: null, popupState: null });
        }
    }, [isOpen, activeTab, showSummaryPopup, popupState]);
    const [popupError, setPopupError] = useState<string | null>(null);
    
    // Certifications & languages from the AI parser (stored in state but not displayed in UI)
    const [certifications, setCertifications] = useState<any[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);

    // UploadThing integration
    const { startUpload } = useUploadThing("resumeUploader", {
        onClientUploadComplete: () => {
            console.log("File successfully uploaded to store");
        },
        onUploadError: (error) => {
            console.error("UploadThing failed:", error.message);
        }
    });

    const clearOnboardingTimer = () => {
        if ((globalThis as any)._onboardingRedirectTimer) {
            clearTimeout((globalThis as any)._onboardingRedirectTimer);
            (globalThis as any)._onboardingRedirectTimer = null;
        }
    };

    // Reset step based on resumeUrl existence and set baseline originalData
    useEffect(() => {
        if (isOpen) {
            setSaveError(null);
            setParseError(null);
            setTabError(null);
            setShowSuccessToast(false);
            setActiveTab('basics');
            if (user?.resumeUrl) {
                setStep('choice');
            } else {
                setStep('upload');
            }

            // Set baseline originalData from current user values
            const currentProfile = getUserProfileAsParsedResume(user);
            setOriginalData(currentProfile);
        }
    }, [isOpen]);

    // Reset isConfirmed and clear onboarding redirect timer when summary popup is closed
    useEffect(() => {
        if (!showSummaryPopup) {
            setIsConfirmed(false);
            clearOnboardingTimer();
        }
    }, [showSummaryPopup]);

    // Auto-dismiss popup after 5 seconds inside success state (Task 4)
    useEffect(() => {
        if (!showSummaryPopup || popupState !== 'success') return;
        const timer = setTimeout(() => {
            setShowSummaryPopup(false);
            // If full save and onboarding, redirect immediately when timer expires
            if (context === 'onboarding' && summaryData?.isFull) {
                router.push('/feed');
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [showSummaryPopup, popupState, context, summaryData]);

    // Render Platform Social Icon
    const renderSocialIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName];
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
            summary: basicsData.summary || data.summary || '',
            email: basicsData.email || '',
            phone: basicsData.phone || ''
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
        
        const rawSkills = data.skills || [];
        const mappedSkills = Array.isArray(rawSkills)
            ? rawSkills.map((s: any) => {
                if (s && typeof s === 'object') return String(s.name || '');
                return String(s);
              }).map((s: string) => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean)
            : [];
        setSkills(mappedSkills);
        
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
            
            // Clarification 4: Socials tab must render the icon returned by AI parser as matching icon component
            // If missing or unrecognized, default using getSocialIconName
            const rawIcon = soc.icon || '';
            const detectedIcon = getSocialIconName(url || label);
            
            // Validate if rawIcon exists in iconMap
            const isValidIcon = iconMap[rawIcon] !== undefined || rawIcon.startsWith('Si') || rawIcon.startsWith('Fa');
            
            return {
                title: label,
                url: url,
                icon: isValidIcon ? rawIcon : detectedIcon
            };
        });
        setSocials(parsedSocials);
        
        // Clarification 5: Store certifications and languages in component state
        setCertifications(data.certifications || []);
        setLanguages(data.languages || []);
        
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

    const handleTabChange = (tab: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'socials') => {
        setActiveTab(tab);
        setTabError(null);
        updateUrlParams({ tab });
    };

    const handleTabSave = (tab: string) => {
        setTabError(null);
        const changes: SummaryChange[] = [];
        let payload: any = {};

        switch (tab) {
            case 'basics':
                payload = {
                    name: basics.name,
                    headline: basics.headline,
                    bio: basics.summary,
                    location: basics.location,
                    email: basics.email,
                    phone: basics.phone,
                };
                if (basics.name !== originalData?.basics?.name)
                    changes.push({ type: 'updated', label: 'Name updated' });
                if (basics.headline !== originalData?.basics?.headline)
                    changes.push({ type: 'updated', label: 'Headline updated' });
                if (basics.summary !== originalData?.basics?.summary)
                    changes.push({ type: 'updated', label: 'Bio/summary updated' });
                if (basics.location !== originalData?.basics?.location)
                    changes.push({ type: 'updated', label: 'Location updated' });
                if (!originalData?.basics?.email && basics.email)
                    changes.push({ type: 'added', label: 'Email address added' });
                if (!originalData?.basics?.phone && basics.phone)
                    changes.push({ type: 'added', label: 'Phone number added' });
                break;

            case 'experience':
                payload = { experience: experience };
                const prevExpCount = originalData?.experience?.length ?? 0;
                const newExpCount = experience.length;
                if (newExpCount > prevExpCount) {
                    const count = newExpCount - prevExpCount;
                    changes.push({
                        type: 'added',
                        label: `${count} experience ${count === 1 ? 'entry' : 'entries'} added`
                    });
                } else if (newExpCount === prevExpCount) {
                    changes.push({
                        type: 'updated',
                        label: `${newExpCount} experience ${newExpCount === 1 ? 'entry' : 'entries'} updated`
                    });
                } else {
                    changes.push({ type: 'updated', label: 'Experience section updated' });
                }
                break;

            case 'education':
                payload = { education: education };
                const prevEduCount = originalData?.education?.length ?? 0;
                const newEduCount = education.length;
                if (newEduCount > prevEduCount) {
                    const count = newEduCount - prevEduCount;
                    changes.push({
                        type: 'added',
                        label: `${count} education ${count === 1 ? 'entry' : 'entries'} added`
                    });
                } else {
                    changes.push({ type: 'updated', label: 'Education section updated' });
                }
                break;

            case 'skills':
                payload = { skills: skills };
                const prevSkillCount = originalData?.skills?.length ?? 0;
                const newSkillCount = skills.length;
                const addedSkills = newSkillCount - prevSkillCount;
                if (addedSkills > 0) {
                    changes.push({
                        type: 'added',
                        label: `${addedSkills} ${addedSkills === 1 ? 'skill' : 'skills'} added to your Skill Set`
                    });
                } else if (addedSkills < 0) {
                    const removed = Math.abs(addedSkills);
                    changes.push({
                        type: 'removed',
                        label: `${removed} ${removed === 1 ? 'skill' : 'skills'} removed`
                    });
                } else {
                    changes.push({ type: 'updated', label: 'Skills updated' });
                }
                break;

            case 'projects':
                payload = { projects: projects };
                const prevProjCount = originalData?.projects?.length ?? 0;
                const newProjCount = projects.length;
                if (newProjCount > prevProjCount) {
                    const count = newProjCount - prevProjCount;
                    changes.push({
                        type: 'added',
                        label: `${count} ${count === 1 ? 'project' : 'projects'} added to your portfolio`
                    });
                } else {
                    changes.push({
                        type: 'updated',
                        label: `${newProjCount} ${newProjCount === 1 ? 'project' : 'projects'} updated`
                    });
                }
                break;

            case 'socials':
                payload = { customLinks: socials.length > 0 ? JSON.stringify(socials) : null };
                const prevSocialCount = originalData?.socials?.length ?? 0;
                const newSocialCount = socials.length;
                if (newSocialCount > prevSocialCount) {
                    const count = newSocialCount - prevSocialCount;
                    changes.push({
                        type: 'added',
                        label: `${count} social ${count === 1 ? 'link' : 'links'} added`
                    });
                } else {
                    changes.push({ type: 'updated', label: 'Social links updated' });
                }
                break;
        }

        setPendingPayload(payload);
        setPendingTabName(tab);
        setPopupState('preview');
        setPopupError(null);
        setSummaryData({
            tabName: TAB_LABELS[tab] || tab,
            isFull: false,
            changes: changes.length > 0
                ? changes
                : [{ type: 'updated', label: `${TAB_LABELS[tab] || tab} section saved successfully` }]
        });
        setShowSummaryPopup(true);
    };

    const handleSaveAll = () => {
        setTabError(null);
        const changes: SummaryChange[] = [];

        // Diff all sections
        const prevSkills = originalData?.skills?.length ?? 0;
        const newSkills = skills.length;
        const prevExp = originalData?.experience?.length ?? 0;
        const newExp = experience.length;
        const prevEdu = originalData?.education?.length ?? 0;
        const newEdu = education.length;
        const prevProj = originalData?.projects?.length ?? 0;
        const newProj = projects.length;
        const prevSocials = originalData?.socials?.length ?? 0;
        const newSocials = socials.length;

        if (basics.name !== originalData?.basics?.name ||
            basics.headline !== originalData?.basics?.headline ||
            basics.summary !== originalData?.basics?.summary)
            changes.push({ type: 'updated', label: 'Profile basics updated' });

        if (newExp > prevExp) {
            const count = newExp - prevExp;
            changes.push({ type: 'added', label: `${count} experience ${count === 1 ? 'entry' : 'entries'} added` });
        } else if (newExp === prevExp && newExp > 0) {
            changes.push({ type: 'updated', label: `${newExp} experience ${newExp === 1 ? 'entry' : 'entries'} updated` });
        }

        if (newEdu > prevEdu) {
            const count = newEdu - prevEdu;
            changes.push({ type: 'added', label: `${count} education ${count === 1 ? 'entry' : 'entries'} added` });
        } else if (newEdu > 0) {
            changes.push({ type: 'updated', label: 'Education section updated' });
        }

        if (newSkills > prevSkills) {
            const count = newSkills - prevSkills;
            changes.push({ type: 'added', label: `${count} ${count === 1 ? 'skill' : 'skills'} added to your Skill Set` });
        } else if (newSkills > 0) {
            changes.push({ type: 'updated', label: `${newSkills} ${newSkills === 1 ? 'skill' : 'skills'} in your profile` });
        }

        if (newProj > prevProj) {
            const count = newProj - prevProj;
            changes.push({ type: 'added', label: `${count} ${count === 1 ? 'project' : 'projects'} added to your portfolio` });
        } else if (newProj > 0) {
            changes.push({ type: 'updated', label: `${newProj} ${newProj === 1 ? 'project' : 'projects'} updated` });
        }

        if (newSocials > prevSocials) {
            const count = newSocials - prevSocials;
            changes.push({ type: 'added', label: `${count} social ${count === 1 ? 'link' : 'links'} connected` });
        } else if (newSocials > 0) {
            changes.push({ type: 'updated', label: 'Social links updated' });
        }

        const fullPayload = {
            name: basics.name || undefined,
            headline: basics.headline,
            bio: basics.summary,
            location: basics.location,
            email: basics.email,
            phone: basics.phone,
            experience: experience,
            education: education,
            skills: skills,
            projects: projects,
            customLinks: socials.length > 0 ? JSON.stringify(socials) : null
        };

        setPendingPayload(fullPayload);
        setPendingTabName('all');
        setPopupState('preview');
        setPopupError(null);
        setSummaryData({
            tabName: 'All Sections',
            isFull: true,
            changes: changes.length > 0
                ? changes
                : [{ type: 'updated', label: 'All profile sections saved successfully' }]
        });
        setShowSummaryPopup(true);
    };

    const handleConfirmedSave = async () => {
        if (!pendingPayload || !pendingTabName) return;

        const isFullSave = pendingTabName === 'all';
        if (isFullSave) {
            setIsSavingAll(true);
        } else {
            setIsSavingTab(true);
        }
        setPopupState('saving');
        setPopupError(null);

        try {
            const result = await updateUserProfile(pendingPayload);
            if (!result.success) {
                throw new Error(result.message || "Failed to save profile changes.");
            }

            // Update originalData to match saved state
            if (isFullSave) {
                setOriginalData({
                    basics: {
                        name: basics.name,
                        headline: basics.headline,
                        location: basics.location,
                        summary: basics.summary,
                        email: basics.email,
                        phone: basics.phone
                    },
                    experience: [...experience],
                    education: [...education],
                    skills: [...skills],
                    projects: [...projects],
                    socials: [...socials]
                });
            } else {
                setOriginalData((prev: any) => {
                    const updated = { ...prev };
                    if (pendingTabName === 'basics') {
                        updated.basics = {
                            name: basics.name,
                            headline: basics.headline,
                            location: basics.location,
                            summary: basics.summary,
                            email: basics.email,
                            phone: basics.phone
                        };
                    } else if (pendingTabName === 'experience') {
                        updated.experience = [...experience];
                    } else if (pendingTabName === 'education') {
                        updated.education = [...education];
                    } else if (pendingTabName === 'skills') {
                        updated.skills = [...skills];
                    } else if (pendingTabName === 'projects') {
                        updated.projects = [...projects];
                    } else if (pendingTabName === 'socials') {
                        updated.socials = [...socials];
                    }
                    return updated;
                });
            }

            setPendingPayload(null);
            setPendingTabName(null);
            setPopupState('success');

            if (context === 'onboarding') {
                const timer = setTimeout(() => {
                    setShowSummaryPopup(false);
                    router.push('/feed');
                }, 3000);
                (globalThis as any)._onboardingRedirectTimer = timer;
            }

        } catch (err: any) {
            console.error("Confirmed save failed:", err);
            setPopupState('error');
            setPopupError(err.message || "Failed to save changes. Please try again.");
            if (!isFullSave) {
                setTabError(`Failed to save ${summaryData?.tabName || 'section'}. Please try again.`);
            }
        } finally {
            setIsSavingAll(false);
            setIsSavingTab(false);
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
                                    style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#1F2937' }}
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
                                    style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#1F2937' }}
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
                                style={{ color: '#6B6B78', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF' }}
                                className="border-[var(--border-default)] hover:bg-[var(--bg-secondary-panel)] text-xs rounded-xl"
                            >
                                Cancel scanning
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Full Edit Review Modal */}
                    {step === 'review' && (
                        <div className="relative flex-1 flex flex-col overflow-hidden min-h-[450px]">
                            {/* Tab selector */}
                            <div className="flex border-b border-border-default -mb-px overflow-x-auto">
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
                                            onClick={() => handleTabChange(tab.id)}
                                            className={
                                                activeTab === tab.id
                                                    ? "relative px-4 py-3 text-sm font-medium text-sc-purple-600 border-b-2 border-sc-purple-600 flex items-center gap-1.5 shrink-0"
                                                    : "relative px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-heading transition-colors duration-150 border-b-2 border-transparent flex items-center gap-1.5 shrink-0"
                                            }
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

                                        {/* Per-tab save button & error banner */}
                                        <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleTabSave('basics')}
                                                    disabled={isSavingTab}
                                                    style={isSavingTab ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: 'transparent' }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    {isSavingTab ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Basics
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {tabError && activeTab === 'basics' && (
                                                <div className="mt-2 px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                    {tabError}
                                                </div>
                                            )}
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

                                        {/* Per-tab save button & error banner */}
                                        <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleTabSave('experience')}
                                                    disabled={isSavingTab}
                                                    style={isSavingTab ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: 'transparent' }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    {isSavingTab ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Experience
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {tabError && activeTab === 'experience' && (
                                                <div className="mt-2 px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                    {tabError}
                                                </div>
                                            )}
                                        </div>
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

                                        {/* Per-tab save button & error banner */}
                                        <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleTabSave('education')}
                                                    disabled={isSavingTab}
                                                    style={isSavingTab ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: 'transparent' }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    {isSavingTab ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Education
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {tabError && activeTab === 'education' && (
                                                <div className="mt-2 px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                    {tabError}
                                                </div>
                                            )}
                                        </div>
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

                                        {/* Per-tab save button & error banner */}
                                        <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleTabSave('skills')}
                                                    disabled={isSavingTab}
                                                    style={isSavingTab ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: 'transparent' }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    {isSavingTab ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Skills
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {tabError && activeTab === 'skills' && (
                                                <div className="mt-2 px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                    {tabError}
                                                </div>
                                            )}
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

                                        {/* Per-tab save button & error banner */}
                                        <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleTabSave('projects')}
                                                    disabled={isSavingTab}
                                                    style={isSavingTab ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: 'transparent' }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    {isSavingTab ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Projects
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {tabError && activeTab === 'projects' && (
                                                <div className="mt-2 px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                    {tabError}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 6. Socials Panel */}
                                {activeTab === 'socials' && (
                                    <div className="space-y-4 max-w-3xl">
                                        {socials.map((soc, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--bg-secondary-panel)] border border-[var(--border-subtle)] rounded-xl group">
                                                {/* Left Icon Square */}
                                                <SocialIcon platform={soc.icon ? soc.icon.replace(/^Si/, '').replace(/^Fa/, '').toLowerCase() : 'globe'} />
                                                
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

                                        {/* Per-tab save button & error banner */}
                                        <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleTabSave('socials')}
                                                    disabled={isSavingTab}
                                                    style={isSavingTab ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: 'transparent' }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    {isSavingTab ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Socials
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {tabError && activeTab === 'socials' && (
                                                <div className="mt-2 px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                    {tabError}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {showSummaryPopup && summaryData && (
                                <div
                                    className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-slate-900/40 backdrop-blur-sm"
                                    onClick={() => popupState !== 'saving' && setShowSummaryPopup(false)}
                                >
                                    <div
                                        className="relative w-full max-w-md mx-6 bg-white rounded-xl border border-slate-200 shadow-xl p-6 flex flex-col gap-4 max-h-[90%] overflow-y-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Back button visible in STATE 1: PREVIEW or STATE 4: ERROR */}
                                        {(popupState === 'preview' || popupState === 'error') && (
                                            <button
                                                onClick={() => {
                                                    clearOnboardingTimer();
                                                    setShowSummaryPopup(false);
                                                }}
                                                style={{ color: '#6B6B78' }}
                                                className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-heading transition-colors duration-150 cursor-pointer bg-transparent border-0 outline-none p-1 rounded"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Back
                                            </button>
                                        )}

                                        {/* HEADER SECTION */}
                                        <div className="flex items-start gap-3 mt-4">
                                            {popupState === 'success' ? (
                                                <div className="w-10 h-10 rounded-full bg-sc-green-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-5 h-5 text-sc-green-600" />
                                                </div>
                                            ) : popupState === 'error' ? (
                                                <div className="w-10 h-10 rounded-full bg-sc-red-100 flex items-center justify-center flex-shrink-0">
                                                    <X className="w-5 h-5 text-sc-red-650" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-sc-purple-100 flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-5 h-5 text-sc-purple-600" />
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h3 className="text-base font-semibold text-text-heading">
                                                    {popupState === 'success'
                                                        ? 'Changes saved successfully'
                                                        : popupState === 'error'
                                                        ? 'Something went wrong'
                                                        : popupState === 'saving'
                                                        ? 'Saving your changes...'
                                                        : 'Review your changes'}
                                                </h3>
                                                <p className="text-xs text-text-secondary mt-0.5">
                                                    {popupState === 'success'
                                                        ? 'Your profile has been updated'
                                                        : popupState === 'error'
                                                        ? 'We couldn\'t apply these updates. Please check the error below.'
                                                        : popupState === 'saving'
                                                        ? 'Applying updates to your database record...'
                                                        : 'Here is what will be updated on your profile'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* BODY SECTION */}
                                        {popupState === 'error' ? (
                                            <div className="px-3 py-2 rounded-lg bg-sc-red-50 border border-sc-red-200 text-sm text-sc-red-700">
                                                {popupError}
                                            </div>
                                        ) : (
                                            <ul className="flex flex-col gap-2 border-t border-b border-border-subtle py-3 my-1">
                                                {summaryData.changes.map((change, i) => (
                                                    <li key={i} className="flex items-center gap-2.5">
                                                        <span className={`
                                                            w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                                                            ${change.type === 'added'
                                                                ? 'bg-sc-purple-100 text-sc-purple-700'
                                                                : change.type === 'removed'
                                                                ? 'bg-sc-red-100 text-sc-red-700'
                                                                : 'bg-sc-blue-100 text-sc-blue-700'}
                                                        `}>
                                                            {change.type === 'added' ? '+' : change.type === 'removed' ? '−' : '✓'}
                                                        </span>
                                                        <span className="text-sm text-text-body">{change.label}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* FOOTER / CONTROLS SECTION */}
                                        {popupState === 'preview' && (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3 pt-1">
                                                    <input
                                                        type="checkbox"
                                                        id="confirm-save"
                                                        checked={isConfirmed}
                                                        onChange={(e) => setIsConfirmed(e.target.checked)}
                                                        className="w-4 h-4 rounded accent-sc-purple-600 cursor-pointer"
                                                    />
                                                    <label
                                                        htmlFor="confirm-save"
                                                        className="text-sm text-text-body cursor-pointer select-none font-medium"
                                                    >
                                                        Are you sure you want these changes?
                                                    </label>
                                                </div>

                                                <button
                                                    onClick={handleConfirmedSave}
                                                    disabled={!isConfirmed || isSavingTab || isSavingAll}
                                                    style={(!isConfirmed || isSavingTab || isSavingAll) ? { backgroundColor: '#E8E8ED', color: '#B8B8C0', border: 'none' } : { backgroundColor: '#5B35D5', color: '#FFFFFF', border: 'none' }}
                                                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        )}

                                        {popupState === 'saving' && (
                                            <button
                                                disabled
                                                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-btn-primary-bg-disabled text-btn-primary-text-disabled cursor-not-allowed transition-colors duration-150 border-none flex items-center justify-center gap-2"
                                            >
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                Saving...
                                            </button>
                                        )}

                                        {popupState === 'success' && (
                                            <div className="flex gap-3 pt-4 mt-2">
                                                <button
                                                    onClick={() => {
                                                        clearOnboardingTimer();
                                                        setShowSummaryPopup(false);
                                                    }}
                                                    style={{ backgroundColor: '#5B35D5', color: '#FFFFFF' }}
                                                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-sc-purple-600 text-white hover:bg-sc-purple-700 transition-colors duration-150 border-0 outline-none cursor-pointer"
                                                >
                                                    Continue Editing
                                                </button>
                                                
                                                <button
                                                    onClick={() => {
                                                        clearOnboardingTimer();
                                                        setShowSummaryPopup(false);
                                                        onClose();
                                                        if (context === 'onboarding') {
                                                            router.push('/feed');
                                                        }
                                                    }}
                                                    style={{ backgroundColor: 'transparent', color: '#5B35D5', border: '1px solid #B4A3F3' }}
                                                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-sc-purple-600 border border-sc-purple-300 hover:bg-sc-purple-50 transition-colors duration-150 cursor-pointer"
                                                >
                                                    {summaryData?.isFull && context === 'onboarding'
                                                        ? 'Go to Feed'
                                                        : 'Close Builder'}
                                                </button>
                                            </div>
                                        )}

                                        {popupState === 'error' && (
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={handleConfirmedSave}
                                                    style={{ backgroundColor: '#5B35D5', color: '#FFFFFF', border: 'none' }}
                                                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    Try Again
                                                </button>
                                                
                                                <button
                                                    onClick={() => {
                                                        clearOnboardingTimer();
                                                        setShowSummaryPopup(false);
                                                    }}
                                                    style={{ backgroundColor: 'transparent', color: '#5B35D5', border: '1px solid #B4A3F3' }}
                                                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Modal Footer */}
                    {step === 'review' ? (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-bg-secondary-panel rounded-b-xl flex-shrink-0">
                            {/* Left: info text */}
                            <p className="text-xs text-text-tertiary">
                                Use tab save buttons to update individual sections
                            </p>

                            {/* Right: Save All button */}
                            <button
                                onClick={handleSaveAll}
                                disabled={isSavingAll}
                                style={isSavingAll ? { backgroundColor: '#E8E8ED', color: '#B8B8C0' } : { backgroundColor: '#5B35D5', color: '#FFFFFF', border: 'none' }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                {isSavingAll ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving everything...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Save All Changes
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="border-t border-[var(--border-subtle)] pt-4 flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-end gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={onClose} 
                                    disabled={isAnalyzing}
                                    style={{ color: '#6B6B78', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF' }}
                                    className="border-[var(--border-default)] hover:bg-[var(--bg-secondary-panel)] h-10 px-4 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
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
