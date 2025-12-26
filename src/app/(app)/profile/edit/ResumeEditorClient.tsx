'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Briefcase, Code2, FolderGit2, ExternalLink, Plus, Trash2,
    Edit2, Save, CheckCircle2, ChevronRight, Image as ImageIcon,
    Bold, Italic, Loader2, Sparkles, X, Linkedin, Github, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { nanoid } from 'nanoid';

interface EditorProps {
    user: {
        id: string;
        name: string | null;
        username?: string | null; // Added username
        headline: string | null;
        bio: string | null;
        skills: string | null;
        location?: string;
        image: string | null;
        portfolio?: string;
        linkedin?: string;
        github?: string;
        experience?: any[];
    }
}

const TABS = [
    { id: 'identity', label: 'Core Identity', icon: User },
    { id: 'experience', label: 'Work History', icon: Briefcase },
    { id: 'stack', label: 'Tech Arsenal', icon: Code2 },
];

export default function ResumeEditorClient({ user }: EditorProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('identity');
    const [isSaving, setIsSaving] = useState(false);

    // Initial State Parsing
    let initialSkills: string[] = [];
    try {
        if (user.skills) initialSkills = JSON.parse(user.skills);
    } catch {
        if (user.skills) initialSkills = [user.skills];
    }

    const [identity, setIdentity] = useState({
        name: user.name || '',
        username: user.username || '',
        image: user.image || '',
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
        portfolio: user.portfolio || '',
        linkedin: user.linkedin || '',
        github: user.github || ''
    });

    const [skills, setSkills] = useState<string[]>(initialSkills);
    const [newSkill, setNewSkill] = useState('');

    // Username Validation State
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Check Username logic
    useEffect(() => {
        const check = async () => {
            if (!identity.username || identity.username.length < 3) {
                setUsernameStatus('idle');
                return;
            }
            if (identity.username === user.username) {
                setUsernameStatus('idle'); // No change
                return;
            }

            setUsernameStatus('checking');
            // Import dynamically to avoid server action issues if not fully set up
            const { checkUsername } = await import('../../feed/actions');
            const result = await checkUsername(identity.username);

            if (result.available) {
                setUsernameStatus('available');
                setSuggestions([]);
            } else {
                setUsernameStatus('taken');
                setSuggestions(result.suggestions || []);
            }
        };

        const timeoutId = setTimeout(check, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [identity.username, user.username]);


    // Normalize Experience State (DB uses 'position', UI uses 'role')
    const [experience, setExperience] = useState<any[]>(
        user.experience?.map(e => ({
            ...e,
            id: e.id || nanoid(),
            role: e.role || e.position || '', // Ensure role is populated from position
            company: e.company || '',
            start: e.start || e.startDate || '',
            end: e.end || e.endDate || '',
            desc: e.desc || e.description || ''
        })) || []
    );

    const [strength, setStrength] = useState(0);

    // Calculate Strength
    useEffect(() => {
        let score = 0;
        const totalPoints = 8; // Name, Img, Title, Bio, Skills, Exp, Location, One Social

        if (identity.name) score++;
        if (identity.image) score++;
        if (identity.headline) score++;
        if (identity.bio && identity.bio.length > 20) score++;
        if (skills.length > 0) score++;
        if (experience.length > 0) score++;
        if (identity.location) score++;
        if (identity.linkedin || identity.github || identity.portfolio) score++;

        setStrength(Math.round((score / totalPoints) * 100));
    }, [identity, skills, experience]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: "CANDIDATE",
                    name: identity.name,
                    username: identity.username, // Send username
                    image: identity.image,
                    headline: identity.headline,
                    bio: identity.bio,
                    skills: skills,
                    location: identity.location,
                    portfolio: identity.portfolio,
                    linkedin: identity.linkedin,
                    github: identity.github,
                    experience: experience
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Profile Updated");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };

    // --- HELPERS ---
    const addExperience = () => {
        setExperience([...experience, { id: nanoid(), role: '', company: '', start: '', end: '', desc: '' }]);
    };
    const updateExperience = (id: string, field: string, value: string) => {
        setExperience(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };
    const removeExperience = (id: string) => {
        setExperience(prev => prev.filter(e => e.id !== id));
    };

    const addSkill = () => {
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill]);
            setNewSkill('');
        }
    };

    // File Upload Handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image too large. Max 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setIdentity(prev => ({ ...prev, image: reader.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-obsidian text-white p-4 md:p-8 pb-32">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* HEADLINE */}
                <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold font-cinzel text-white">Resume Matrix</h1>
                        <p className="text-zinc-400">Architect your digital presence.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/profile/me">
                            <Button variant="outline" className="border-white/10 text-zinc-400 hover:text-white">
                                <ExternalLink className="w-4 h-4 mr-2" /> Public View
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20 min-w-[120px]"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                        </Button>
                    </div>
                </div>

                {/* LEFT: EDITOR TABS */}
                <div className="lg:col-span-8 space-y-6">
                    {/* TABS HEADER */}
                    <div className="flex overflow-x-auto pb-2 gap-2 border-b border-white/5 scrollbar-hide">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap relative",
                                    activeTab === tab.id
                                        ? "text-white bg-white/5 border-b-2 border-violet-500"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                )}
                            >
                                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-violet-400" : "text-zinc-500")} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="min-h-[500px]">
                        {activeTab === 'identity' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-6 p-6 bg-zinc-900/50 rounded-xl border border-white/5">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-violet-500/10 transition-all overflow-hidden relative">
                                            {identity.image ? (
                                                <img src={identity.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <User className="w-8 h-8 text-zinc-500 mx-auto mb-1 group-hover:text-violet-400" />
                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold group-hover:text-violet-300">Upload</span>
                                                </div>
                                            )}
                                            {/* Hidden Input Overlay */}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-white font-bold">Profile Imagery</h3>
                                        <p className="text-sm text-zinc-500">Upload a professional avatar (Max 2MB).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Full Name</Label>
                                        <Input
                                            value={identity.name}
                                            onChange={e => setIdentity({ ...identity, name: e.target.value })}
                                            className="bg-zinc-900 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Username (Unique ID)</Label>
                                        <Input
                                            value={identity.username}
                                            onChange={e => setIdentity({ ...identity, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                                            className="bg-zinc-900 border-white/10 text-white"
                                            placeholder="username"
                                        />
                                        {usernameStatus === 'checking' && <p className="text-xs text-zinc-500 animate-pulse">Checking availability...</p>}
                                        {usernameStatus === 'available' && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Available</p>}
                                        {usernameStatus === 'taken' && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-red-400">Username is taken.</p>
                                                {suggestions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="text-zinc-500">Suggestions:</span>
                                                        {suggestions.map(s => (
                                                            <button
                                                                key={s}
                                                                type="button" // Prevent submit
                                                                onClick={() => setIdentity({ ...identity, username: s })}
                                                                className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 border border-violet-500/20 transition-colors"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Current Location</Label>
                                        <Input
                                            value={identity.location}
                                            onChange={e => setIdentity({ ...identity, location: e.target.value })}
                                            className="bg-zinc-900 border-white/10 text-white"
                                            placeholder="e.g. San Francisco"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-zinc-400">Professional Headline</Label>
                                        <Input value={identity.headline} onChange={e => setIdentity({ ...identity, headline: e.target.value })} className="bg-zinc-900 border-white/10 text-white" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-zinc-400">Bio / Executive Summary</Label>
                                        <Textarea value={identity.bio} onChange={e => setIdentity({ ...identity, bio: e.target.value })} className="bg-zinc-900 border-white/10 text-white h-24" />
                                    </div>

                                    {/* SOCAL LINKS */}
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 flex items-center gap-2"><Globe className="w-3 h-3" /> Portfolio URL</Label>
                                        <Input value={identity.portfolio} onChange={e => setIdentity({ ...identity, portfolio: e.target.value })} className="bg-zinc-900 border-white/10 text-white" placeholder="https://..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 flex items-center gap-2"><Linkedin className="w-3 h-3" /> LinkedIn URL</Label>
                                        <Input value={identity.linkedin} onChange={e => setIdentity({ ...identity, linkedin: e.target.value })} className="bg-zinc-900 border-white/10 text-white" placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 flex items-center gap-2"><Github className="w-3 h-3" /> GitHub URL</Label>
                                        <Input value={identity.github} onChange={e => setIdentity({ ...identity, github: e.target.value })} className="bg-zinc-900 border-white/10 text-white" placeholder="https://github.com/..." />
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'experience' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">Career Trajectory</h3>
                                    <Button onClick={addExperience} variant="outline" size="sm" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                                        <Plus className="w-4 h-4 mr-2" /> Add Position
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {experience.map((job) => (
                                        <div key={job.id} className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 transition-all group relative space-y-4">
                                            <div className="absolute top-4 right-4">
                                                <Button size="icon" variant="ghost" onClick={() => removeExperience(job.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-zinc-500">Role / Title</Label>
                                                    <Input value={job.role ?? ''} onChange={e => updateExperience(job.id, 'role', e.target.value)} className="bg-zinc-950 border-white/10 h-9" placeholder="Senior Engineer" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-zinc-500">Company</Label>
                                                    <Input value={job.company ?? ''} onChange={e => updateExperience(job.id, 'company', e.target.value)} className="bg-zinc-950 border-white/10 h-9" placeholder="Acme Inc." />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-zinc-500">Start Date</Label>
                                                    <Input value={job.start ?? ''} onChange={e => updateExperience(job.id, 'start', e.target.value)} className="bg-zinc-950 border-white/10 h-9" placeholder="e.g. 2022-01" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-zinc-500">End Date</Label>
                                                    <Input value={job.end ?? ''} onChange={e => updateExperience(job.id, 'end', e.target.value)} className="bg-zinc-950 border-white/10 h-9" placeholder="Present" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-zinc-500">Description</Label>
                                                <Textarea value={job.desc ?? ''} onChange={e => updateExperience(job.id, 'desc', e.target.value)} className="bg-zinc-950 border-white/10 h-20 text-sm" placeholder="Describe your impact..." />
                                            </div>
                                        </div>
                                    ))}
                                    {experience.length === 0 && (
                                        <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-zinc-500">
                                            No experience recorded. Add your missions.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'stack' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white">Technical Arsenal</h3>

                                    <div className="flex gap-2">
                                        <Input
                                            value={newSkill}
                                            onChange={e => setNewSkill(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addSkill()}
                                            className="bg-zinc-900 border-white/10"
                                            placeholder="Add a skill (e.g. React, Docker)"
                                        />
                                        <Button onClick={addSkill} className="bg-zinc-800 hover:bg-zinc-700">Add</Button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-4">
                                        {skills.map(skill => (
                                            <div key={skill} className="px-3 py-1.5 bg-violet-600/10 border border-violet-500/20 text-violet-300 rounded-lg flex items-center gap-2 group">
                                                {skill}
                                                <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="text-violet-400 hover:text-white"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: STRENGTH METER */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-8 space-y-6">
                        <div className="p-6 rounded-2xl bg-zinc-950/50 border border-white/5 backdrop-blur-xl shadow-xl">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                Profile Strength
                            </h3>

                            <div className="flex items-center justify-center mb-6 relative">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle className="text-zinc-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                    <circle
                                        className="text-violet-500 transition-all duration-1000 ease-out"
                                        strokeWidth="8"
                                        strokeDasharray={365}
                                        strokeDashoffset={365 - (365 * strength) / 100}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="58"
                                        cx="64"
                                        cy="64"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white font-mono">{strength}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
