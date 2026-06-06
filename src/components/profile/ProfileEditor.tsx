'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadCloud, X, Plus, Loader2, Save, FileText, Sparkles, AlertCircle } from 'lucide-react';
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
            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Parsing failed");

            const data = await response.json();

            // Auto-Fill Form (route returns `summary`, not `bio`)
            form.setValue('bio', data.bio || data.summary || form.getValues('bio'));
            form.setValue('headline', data.headline || form.getValues('headline'));

            if (data.skills && Array.isArray(data.skills)) {
                const currentSkills = form.getValues('skills');
                const newSkills = Array.from(new Set([...currentSkills, ...data.skills]));
                form.setValue('skills', newSkills);
            }

            if (data.experience && Array.isArray(data.experience)) {
                form.setValue('experience', data.experience);
            }

            if (data.education && Array.isArray(data.education)) {
                form.setValue('education', data.education);
            }

            toast.success("Profile synced with Resume via Neural Link.");

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

    const handleAddSkillBtn = () => {
        if (skillInput.trim()) {
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
        return (
            <div className="flex items-center justify-center p-12 text-center text-[var(--text-error)] bg-[var(--bg-error)] border border-[var(--border-error)] rounded-xl max-w-md mx-auto mt-10">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                <span className="font-bold">Access Denied. Encrypted Channel Only.</span>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-24 font-sans text-[var(--text-body)]">

            {/* Header */}
            <div className="border-b border-[var(--border-strong)] pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading uppercase flex items-center gap-2.5">
                    <span className="bg-gradient-to-r from-[var(--sc-purple-650)] to-[var(--sc-purple-800)] bg-clip-text text-transparent">SHADOW PROFILE</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] text-[var(--text-brand)] rounded-full font-mono font-bold tracking-wide">v3.1</span>
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Manage your digital operational identity and resume details.</p>
            </div>

            {/* Smart Upload Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer relative overflow-hidden group bg-[var(--bg-card)]",
                    isDragActive ? "border-[var(--border-focus)] bg-[var(--sc-purple-50)]/50 scale-[1.005]" : "border-[var(--border-input)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-sidebar-hover)]"
                )}
            >
                <input {...getInputProps()} />

                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--sc-purple-100)]/30 blur-xl rounded-full animate-pulse" />
                            <Loader2 className="w-10 h-10 text-[var(--sc-purple-600)] animate-spin relative z-10" />
                        </div>
                        <p className="mt-4 text-xs font-mono font-bold tracking-widest text-[var(--text-brand)] animate-pulse uppercase">EXTRACTING NEURAL PATTERNS...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 bg-[var(--bg-secondary-panel)] rounded-2xl flex items-center justify-center border border-[var(--border-default)] mb-4 group-hover:scale-105 transition-transform duration-300">
                            <UploadCloud className="w-7 h-7 text-[var(--icon-default)] group-hover:text-[var(--sc-purple-600)] transition-colors" />
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text-heading)] mb-1">Drop Resume (PDF) to Auto-Build</h3>
                        <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed font-medium">
                            Our AI will extract your bio, skills, and history to populate the fields below instantly.
                        </p>
                    </div>
                )}

                {/* Scanline Effect */}
                {isAnalyzing && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--sc-purple-500)] shadow-[0_0_20px_rgba(91,53,213,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
                )}
            </div>

            {/* Main Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Identity */}
                <section className="space-y-4 bg-[var(--bg-card)] border border-[var(--border-card)] p-6 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2 font-heading uppercase">
                        <div className="w-1 h-4 bg-[var(--sc-purple-600)] rounded-full" />
                        Identity Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</label>
                            <input {...form.register('name')} className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" placeholder="John Doe" />
                            {form.formState.errors.name && <p className="text-red-650 text-[10px] font-bold mt-1">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Headline</label>
                            <input {...form.register('headline')} className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" placeholder="Frontend Architect" />
                        </div>
                        <div className="col-span-full space-y-1.5">
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Bio / Summary</label>
                            <textarea {...form.register('bio')} rows={4} className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)] resize-none" placeholder="Brief professional summary..." />
                        </div>
                    </div>
                </section>

                {/* Skills */}
                <section className="space-y-4 bg-[var(--bg-card)] border border-[var(--border-card)] p-6 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2 font-heading uppercase">
                        <div className="w-1 h-4 bg-[var(--sc-purple-600)] rounded-full" />
                        Skills Assessment
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={addSkill}
                                placeholder="Type skill and hit Enter..."
                                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]"
                            />
                            <button type="button" onClick={handleAddSkillBtn} className="bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer select-none">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.watch('skills').map((skill, index) => (
                                <span key={index} className="px-3 py-1 bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] rounded-full text-xs font-semibold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                                    {skill}
                                    <X className="w-3 h-3 cursor-pointer hover:text-[var(--text-error)] shrink-0" onClick={() => removeSkill(skill)} />
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Experience */}
                <section className="space-y-4 bg-[var(--bg-card)] border border-[var(--border-card)] p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
                        <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2 font-heading uppercase">
                            <div className="w-1 h-4 bg-[var(--sc-purple-600)] rounded-full" />
                            Operational History
                        </h3>
                        <button type="button" onClick={() => appendExp({ title: '', company: '' })} className="text-xs bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm transition-all cursor-pointer select-none">
                            <Plus className="w-3.5 h-3.5" /> Add Role
                        </button>
                    </div>

                    <div className="space-y-6 pt-2">
                        {expFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[var(--border-subtle)] pb-6 last:border-0 last:pb-0 relative animate-in slide-in-from-left-4">
                                <button type="button" onClick={() => removeExp(index)} className="absolute top-0 right-0 text-[var(--icon-muted)] hover:text-[var(--text-error)] p-1 cursor-pointer border-none bg-transparent">
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title</label>
                                    <input {...form.register(`experience.${index}.title`)} placeholder="Job Title" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Company</label>
                                    <input {...form.register(`experience.${index}.company`)} placeholder="Company Name" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Start Date</label>
                                    <input {...form.register(`experience.${index}.start`)} placeholder="e.g. 2020" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">End Date</label>
                                    <input {...form.register(`experience.${index}.end`)} placeholder="Present" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
                                </div>
                                <div className="col-span-full space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
                                    <textarea {...form.register(`experience.${index}.description`)} rows={2} placeholder="Responsibilities..." className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)] resize-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="space-y-4 bg-[var(--bg-card)] border border-[var(--border-card)] p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
                        <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2 font-heading uppercase">
                            <div className="w-1 h-4 bg-[var(--sc-purple-600)] rounded-full" />
                            Academic Archives
                        </h3>
                        <button type="button" onClick={() => appendEdu({ school: '', degree: '' })} className="text-xs bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm transition-all cursor-pointer select-none">
                            <Plus className="w-3.5 h-3.5" /> Add Education
                        </button>
                    </div>

                    <div className="space-y-6 pt-2">
                        {eduFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[var(--border-subtle)] pb-6 last:border-0 last:pb-0 relative animate-in slide-in-from-left-4">
                                <button type="button" onClick={() => removeEdu(index)} className="absolute top-0 right-0 text-[var(--icon-muted)] hover:text-[var(--text-error)] p-1 cursor-pointer border-none bg-transparent">
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">School</label>
                                    <input {...form.register(`education.${index}.school`)} placeholder="University" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Degree</label>
                                    <input {...form.register(`education.${index}.degree`)} placeholder="B.S. Computer Science" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Year</label>
                                    <input {...form.register(`education.${index}.year`)} placeholder="e.g. 2018" className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-xs text-[var(--text-heading)] focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] focus:outline-none transition-all placeholder:text-[var(--text-placeholder)]" />
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
                        className="bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] active:bg-[var(--btn-primary-bg-active)] text-[var(--btn-primary-text)] font-bold py-3 px-8 rounded-xl shadow-[var(--shadow-lg)] border-none hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center cursor-pointer select-none"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {isSaving ? "Syncing..." : "Save Profile"}
                    </button>
                </div>
            </form>
        </div>
    );
}
