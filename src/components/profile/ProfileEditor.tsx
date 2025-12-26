'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadCloud, X, Plus, Loader2, Save, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserProfile } from '@/app/(app)/profile/actions';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Schema ---
const profileSchema = z.object({
    name: z.string().min(2, "Name is required"),
    headline: z.string().optional(),
    bio: z.string().optional(),
    role: z.string().optional(),
    skills: z.array(z.string()),
    experience: z.array(z.object({
        title: z.string(),
        company: z.string(),
        start: z.string().optional(),
        end: z.string().optional(),
        description: z.string().optional()
    })),
    education: z.array(z.object({
        school: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string().optional(),
        year: z.string().optional()
    }))
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditor({ user, isOwner }: { user: any, isOwner: boolean }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [skillInput, setSkillInput] = useState('');

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name || '',
            headline: user.headline || '',
            bio: user.bio || '',
            skills: user.skills ? user.skills.split(',') : [],
            experience: user.experience || [],
            // Education might be missing in initial user object if not included in fetch
            education: user.education || []
        }
    });

    const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
        control: form.control,
        name: "experience"
    });

    const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
        control: form.control,
        name: "education"
    });

    // --- Resume Parsing ---
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/ai/parse-resume', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Parsing failed");

            const data = await response.json();

            // Auto-Fill Form
            form.setValue('bio', data.bio || form.getValues('bio'));
            form.setValue('headline', data.headline || form.getValues('headline'));

            if (data.skills && Array.isArray(data.skills)) {
                const currentSkills = form.getValues('skills');
                // Merge unique skills
                const newSkills = Array.from(new Set([...currentSkills, ...data.skills]));
                form.setValue('skills', newSkills);
            }

            if (data.experience && Array.isArray(data.experience)) {
                form.setValue('experience', data.experience);
            }

            if (data.education && Array.isArray(data.education)) {
                form.setValue('education', data.education);
            }

            toast.success("Profile synched with Resume via Neural Link.");

        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze resume.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [form]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    });

    // --- Actions ---
    const onSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        const result = await updateUserProfile(data);
        setIsSaving(false);

        if (result.success) {
            toast.success("Shadow Profile Updated.");
        } else {
            toast.error(result.message || "Save failed.");
        }
    };

    const addSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            const current = form.getValues('skills');
            if (!current.includes(skillInput.trim())) {
                form.setValue('skills', [...current, skillInput.trim()]);
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        const current = form.getValues('skills');
        form.setValue('skills', current.filter(s => s !== skill));
    };

    if (!isOwner) {
        return <div className="p-8 text-center text-red-500">Access Denied. Encrypted Channel Only.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">SHADOW PROFILE</span>
                    <span className="text-xs px-2 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full font-mono">v3.1</span>
                </h1>
                <p className="text-zinc-400 mt-2">Manage your digital operational identity.</p>
            </div>

            {/* Smart Upload Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer relative overflow-hidden group",
                    isDragActive ? "border-violet-500 bg-violet-500/5 scale-[1.01]" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
            >
                <input {...getInputProps()} />

                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 text-violet-400 animate-spin relative z-10" />
                        </div>
                        <p className="mt-4 text-violet-300 font-mono animate-pulse">EXTRACTING NEURAL PATTERNS...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                            <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Drop Resume (PDF) to Auto-Build</h3>
                        <p className="text-sm text-zinc-500 max-w-sm">
                            Our AI will extract your bio, skills, and history to populate the fields below instantly.
                        </p>
                    </div>
                )}

                {/* Scanline Effect */}
                {isAnalyzing && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
                )}
            </div>

            {/* Main Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Identity */}
                <section className="space-y-4 bg-zinc-900/30 border border-white/5 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-5 bg-violet-500 rounded-full" />
                        Identity Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase">Full Name</label>
                            <input {...form.register('name')} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-violet-500 outline-none" placeholder="John Doe" />
                            {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase">Headline</label>
                            <input {...form.register('headline')} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-violet-500 outline-none" placeholder="Frontend Architect" />
                        </div>
                        <div className="col-span-full space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase">Bio / Summary</label>
                            <textarea {...form.register('bio')} rows={4} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-violet-500 outline-none" placeholder="Brief professional summary..." />
                        </div>
                    </div>
                </section>

                {/* Skills */}
                <section className="space-y-4 bg-zinc-900/30 border border-white/5 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-5 bg-cyan-500 rounded-full" />
                        Skills Assessment
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={addSkill}
                                placeholder="Type skill and hit Enter..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                            />
                            <button type="button" onClick={() => { }} className="bg-zinc-800 px-4 rounded-lg text-white hover:bg-zinc-700">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.watch('skills').map((skill, index) => (
                                <span key={index} className="px-3 py-1 bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 rounded-full text-sm flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    {skill}
                                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Experience */}
                <section className="space-y-4 bg-zinc-900/30 border border-white/5 p-6 rounded-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                            Operational History
                        </h3>
                        <button type="button" onClick={() => appendExp({ title: '', company: '' })} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-md flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Role
                        </button>
                    </div>

                    <div className="space-y-6">
                        {expFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0 relative animate-in slide-in-from-left-4">
                                <button type="button" onClick={() => removeExp(index)} className="absolute top-0 right-0 text-zinc-600 hover:text-red-500 p-1">
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">Title</label>
                                    <input {...form.register(`experience.${index}.title`)} placeholder="Job Title" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">Company</label>
                                    <input {...form.register(`experience.${index}.company`)} placeholder="Company Name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">Start Date</label>
                                    <input {...form.register(`experience.${index}.start`)} placeholder="e.g. 2020" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">End Date</label>
                                    <input {...form.register(`experience.${index}.end`)} placeholder="Present" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">Description</label>
                                    <textarea {...form.register(`experience.${index}.description`)} rows={2} placeholder="Responsibilities..." className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="space-y-4 bg-zinc-900/30 border border-white/5 p-6 rounded-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1 h-5 bg-amber-500 rounded-full" />
                            Academic Archives
                        </h3>
                        <button type="button" onClick={() => appendEdu({ school: '', degree: '' })} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-md flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Education
                        </button>
                    </div>

                    <div className="space-y-6">
                        {eduFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0 relative animate-in slide-in-from-left-4">
                                <button type="button" onClick={() => removeEdu(index)} className="absolute top-0 right-0 text-zinc-600 hover:text-red-500 p-1">
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">School</label>
                                    <input {...form.register(`education.${index}.school`)} placeholder="University" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">Degree</label>
                                    <input {...form.register(`education.${index}.degree`)} placeholder="B.S. Computer Science" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-zinc-400 uppercase">Year</label>
                                    <input {...form.register(`education.${index}.year`)} placeholder="e.g. 2018" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer Actions */}
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        {isSaving ? "Syncing..." : "Save Profile"}
                    </button>
                </div>
            </form>
        </div>
    );
}
