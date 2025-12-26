'use client';

import React, { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X, Trash2, Camera, Link as LinkIcon, Save, Image as ImageIcon, CloudUpload, FileText, Copy, Share2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserProfile, addProject, updateProject, deleteProject } from '@/app/(app)/profile/actions'; // We will create these
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// --- Types ---
interface ProfileEditModalsProps {
    user: any;
    section: 'identity' | 'about' | 'experience' | 'education' | 'skills' | 'projects' | 'links' | 'banner' | 'resume' | 'share' | null;
    isOpen: boolean;
    onClose: () => void;
    projectToEdit?: any | null; // For editing specific project
}

// --- Schemas ---

const identitySchema = z.object({
    name: z.string().optional(),
    username: z.string().min(3, "Unique ID is required (min 3 chars)"),
    headline: z.string().optional(),
    location: z.string().optional(),
});

const aboutSchema = z.object({
    bio: z.string().optional(),
});

const projectSchema = z.object({
    title: z.string().min(2, "Title is required"),
    description: z.string().optional(),
    link: z.string().url().optional().or(z.literal('')),
    imageUrl: z.string().url().optional().or(z.literal('')),
});

const customLinksSchema = z.object({
    customLinks: z.array(z.object({
        title: z.string().min(1, "Title required"),
        url: z.string().url("Valid URL required")
    }))
});

// --- Components ---

// Helper for File Upload
// Helper for File Upload
import { useUploadThing } from "@/lib/uploadthing";
import ImageCropper from "@/components/ui/image-cropper";

export const FileUploadArea = ({
    label,
    buttonLabel = "Upload",
    currentUrl,
    onUploadComplete,
    endpoint,
    aspectRatio
}: {
    label: string,
    buttonLabel?: string,
    currentUrl?: string | null,
    onUploadComplete: (url: string) => void,
    endpoint: "avatarUploader" | "bannerUploader" | "resumeUploader",
    aspectRatio?: number
}) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isResume = endpoint === "resumeUploader";
    const acceptedFileTypes = isResume ? "application/pdf" : "image/*";
    const helperText = isResume ? "PDF up to 4MB" : "JPG, PNG, GIF up to 4MB";

    const { startUpload, isUploading } = useUploadThing(endpoint, {
        onClientUploadComplete: (res) => {
            if (res && res.length > 0) {
                onUploadComplete(res[0].url);
                toast.success(isResume ? "Resume uploaded successfully" : "Image uploaded successfully");
                setImageSrc(null); // Cleanup
            }
        },
        onUploadError: (error: Error) => {
            toast.error(`Upload failed: ${error.message}`);
        }
    });

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            if (isResume) {
                // Direct upload for PDF, no cropper
                await startUpload([file]);
            } else {
                // Image processing
                const imageDataUrl = await readFile(file);
                setImageSrc(imageDataUrl);
                setIsCropperOpen(true);
            }
            // Reset input so same file can be selected again if cancelled
            e.target.value = '';
        }
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string));
            reader.readAsDataURL(file);
        });
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropperOpen(false);
        const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
        await startUpload([file]);
    };

    const isCircular = endpoint === "avatarUploader";
    const cropRatio = aspectRatio || (isCircular ? 1 : 4 / 1);

    return (
        <div className="space-y-4">
            <Label>{label}</Label>

            {/* Image Cropper Modal */}
            {isCropperOpen && imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 rounded-xl p-4 w-full max-w-xl h-[500px] flex flex-col">
                        <div className="flex-1 relative bg-black/50 rounded-lg overflow-hidden border border-white/10">
                            <ImageCropper
                                imageSrc={imageSrc}
                                onCropComplete={handleCropComplete}
                                aspectRatio={cropRatio}
                                isOpen={true}
                                onClose={() => setIsCropperOpen(false)}
                                isCircular={isCircular}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsCropperOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "border-2 border-dashed border-zinc-700 rounded-xl p-6 bg-zinc-900/30 relative group hover:border-violet-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]",
                    isUploading && "pointer-events-none opacity-50"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept={acceptedFileTypes}
                    onChange={onFileChange}
                />

                {currentUrl && !isResume ? (
                    <div className="relative group-hover:scale-[1.02] transition-transform duration-300 w-full">
                        <img
                            src={currentUrl}
                            alt="Preview"
                            className={cn(
                                "object-contain shadow-2xl bg-black/50 mx-auto",
                                isCircular ? "w-32 h-32 rounded-full border-4 border-zinc-800" : "w-full h-48 rounded-lg max-w-sm"
                            )}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <span className="text-white font-bold text-sm flex items-center gap-2">
                                <CloudUpload className="w-4 h-4" /> CHANGE
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-2 group-hover:bg-zinc-800 transition-colors">
                            {isResume ? <FileText className="w-8 h-8 opacity-50" /> : <CloudUpload className="w-8 h-8 opacity-50" />}
                        </div>
                        <p className="text-sm font-medium">{isUploading ? "Uploading..." : "Click to Upload"}</p>
                        <p className="text-xs opacity-50">{helperText}</p>
                    </div>
                )}

                {(!currentUrl || isResume) && (
                    <Button
                        type="button"
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-wide uppercase px-6 py-2 rounded-md shadow-lg shadow-violet-900/20 pointer-events-none"
                    >
                        {buttonLabel}
                    </Button>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 rounded-xl">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
                        <span className="text-xs text-zinc-400 animate-pulse">Uploading...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ProfileEditModals({ user, section, isOpen, onClose, projectToEdit }: ProfileEditModalsProps) {
    const router = useRouter();

    const handleSave = async (result: any) => {
        console.log("handleSave result:", result);
        if (result && result.success) {
            toast.success("Profile Updated");
            onClose(); // Close immediately for better UX
            router.refresh();
        } else {
            toast.error(result?.message || "Update failed");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-cinzel">
                        {section === 'identity' && 'Edit Identity'}
                        {section === 'about' && 'Edit About'}
                        {section === 'banner' && 'Update Banner'}
                        {section === 'projects' && (projectToEdit ? 'Edit Project' : 'Add Project')}
                        {section === 'links' && 'Manage Custom Links'}
                        {section === 'skills' && 'Update Skills'}
                        {section === 'experience' && 'Update Experience'}
                        {section === 'education' && 'Update Education'}
                    </DialogTitle>
                </DialogHeader>

                {section === 'identity' && <IdentityForm user={user} onSave={handleSave} />}
                {section === 'about' && <AboutForm user={user} onSave={handleSave} />}
                {section === 'banner' && <BannerForm user={user} onSave={handleSave} />}
                {section === 'projects' && <ProjectForm user={user} project={projectToEdit} onSave={handleSave} />}
                {section === 'links' && <CustomLinksForm user={user} onSave={handleSave} />}
                {section === 'skills' && <SkillsForm user={user} onSave={handleSave} />}
                {section === 'experience' && <ExperienceForm user={user} onSave={handleSave} />}
                {section === 'education' && <EducationForm user={user} onSave={handleSave} />}
                {section === 'resume' && <ResumeForm user={user} onSave={handleSave} />}
                {section === 'share' && <ShareProfileForm user={user} onSave={handleSave} />}

            </DialogContent>
        </Dialog>
    );
}

// --- Sub-Forms ---

// ... (Other forms)

function ResumeForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (url: string) => {
        setIsLoading(true);
        const res = await updateUserProfile({ resumeUrl: url });
        setIsLoading(false);
        onSave(res);
    };

    return (
        <div className="space-y-4">
            <FileUploadArea
                label="Resume (PDF)"
                buttonLabel="UPLOAD RESUME"
                currentUrl={user.resumeUrl}
                onUploadComplete={handleUpload}
                endpoint="resumeUploader"
            />
            <div className="flex justify-end">
                <Button variant="ghost" onClick={() => onSave({ success: true })}>Close</Button>
            </div>
        </div>
    );
}

function ShareProfileForm({ user, onSave }: any) {
    const [copied, setCopied] = useState(false);
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${user.username || user.id}` : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 text-center space-y-4">
                <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400">
                    <Share2 className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Share Profile</h3>
                    <p className="text-zinc-400 text-sm">Share this profile with others</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Profile Link</Label>
                <div className="flex gap-2">
                    <Input readOnly value={profileUrl} className="bg-black/50 border-white/10 font-mono text-sm" />
                    <Button onClick={handleCopy} className="bg-violet-600 hover:bg-violet-500 min-w-[100px]">
                        {copied ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" /> Copy
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button variant="ghost" onClick={() => onSave({ success: true })}>Close</Button>
            </div>
        </div>
    );
}

function IdentityForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);

    // Username Check State
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [invalidCharWarning, setInvalidCharWarning] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [typedUsername, setTypedUsername] = useState(user.username || '');

    const form = useForm({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            name: user.name || '',
            headline: user.headline || '',
            location: user.location || '',
            username: user.username || ''
        }
    });

    // Check Username logic
    React.useEffect(() => {
        const check = async () => {
            if (!typedUsername || typedUsername.length < 3) {
                setUsernameStatus('idle');
                return;
            }
            if (typedUsername === user.username) {
                setUsernameStatus('idle'); // No change
                return;
            }

            setUsernameStatus('checking');
            // Dynamically import to avoid server action issues
            const { checkUsername } = await import('../../app/(app)/feed/actions');
            const result = await checkUsername(typedUsername);

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
    }, [typedUsername, user.username]);


    const onSubmit = async (data: any) => {
        if (usernameStatus === 'taken') {
            toast.error("Username is already taken");
            return;
        }

        setIsLoading(true);
        try {
            const res = await updateUserProfile({
                ...data,
                username: typedUsername // Explicitly send username state
            });
            onSave(res);
        } catch (error) {
            console.error("IdentityForm Submit Error:", error);
            onSave({ success: false, message: "Network or Server Error" });
        } finally {
            setIsLoading(false);
        }
    };

    const updateAvatar = async (url: string) => {
        await updateUserProfile({ image: url });
        setIsLoading(true); // flicker
        setTimeout(() => setIsLoading(false), 500);
    };

    return (
        <div className="space-y-6 animate-in fade-in transition-all">
            <FileUploadArea
                label="Profile Photo"
                buttonLabel="UPLOAD AVATAR"
                currentUrl={user.image}
                onUploadComplete={updateAvatar}
                endpoint="avatarUploader"
            />
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label>Full Name <span className="text-zinc-500 font-normal">(Optional)</span></Label>
                    <Input {...form.register('name')} className="bg-black/50 border-white/10" placeholder="e.g. Sarah Connor" />
                    {form.formState.errors.name && <p className="text-red-500 text-xs">{String(form.formState.errors.name.message)}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Username (Unique ID) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Input
                            value={typedUsername}
                            onChange={(e) => {
                                const rawVal = e.target.value;
                                const val = rawVal.toLowerCase().replace(/[^a-z0-9_]/g, '');

                                if (/[^a-zA-Z0-9_]/.test(rawVal)) {
                                    setInvalidCharWarning("Only letters, numbers, and underscores allowed");
                                } else {
                                    setInvalidCharWarning(null);
                                }

                                setTypedUsername(val);
                                form.setValue('username', val); // Sync with form
                            }}
                            className={cn(
                                "bg-black/50 border-white/10 pr-10",
                                (usernameStatus === 'taken' || invalidCharWarning) && "border-red-500/50 focus-visible:ring-red-500/50",
                                usernameStatus === 'available' && !invalidCharWarning && "border-green-500/50 focus-visible:ring-green-500/50"
                            )}
                            placeholder="e.g. cloud_surge"
                        />
                        {usernameStatus === 'checking' && (
                            <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-zinc-500" />
                        )}
                    </div>

                    {invalidCharWarning && (
                        <p className="text-xs text-red-400 animate-in slide-in-from-top-1">{invalidCharWarning}</p>
                    )}

                    {usernameStatus === 'available' && <p className="text-xs text-green-400">Username available</p>}
                    {usernameStatus === 'taken' && (
                        <div className="space-y-1">
                            <p className="text-xs text-red-400">Username is taken.</p>
                            {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 text-xs pt-1">
                                    <span className="text-zinc-500">Suggestions:</span>
                                    {suggestions.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => { setTypedUsername(s); form.setValue('username', s); }}
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
                    <Label>Headline</Label>
                    <Input {...form.register('headline')} className="bg-black/50 border-white/10" placeholder="e.g. Frontend Architect" />
                </div>
                <div className="space-y-2">
                    <Label>Location</Label>
                    <Input {...form.register('location')} className="bg-black/50 border-white/10" placeholder="e.g. Night City, CA" />
                </div>
                <Button type="submit" disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken'} className="w-full bg-violet-600 hover:bg-violet-500">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Identity
                </Button>
            </form>
        </div>
    );
}

function AboutForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm({
        resolver: zodResolver(aboutSchema),
        defaultValues: { bio: user.bio || '' }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const res = await updateUserProfile(data);
        setIsLoading(false);
        onSave(res);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea {...form.register('bio')} rows={6} className="bg-black/50 border-white/10" />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Bio
            </Button>
        </form>
    );
}

function BannerForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [url, setUrl] = useState(user.bannerUrl || '');

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await updateUserProfile({ bannerUrl: url });
        setIsLoading(false);
        onSave(res);
    };

    // Banner Form - direct upload
    const handleUpload = async (url: string) => {
        setIsLoading(true);
        const res = await updateUserProfile({ bannerUrl: url });
        setIsLoading(false);
        onSave(res);
    };

    return (
        <div className="space-y-4">
            <FileUploadArea
                label="Banner Image"
                buttonLabel="UPLOAD BANNER"
                currentUrl={user.bannerUrl}
                onUploadComplete={handleUpload}
                endpoint="bannerUploader"
            />
            <div className="flex justify-end">
                <Button variant="ghost" onClick={() => onSave({ success: true })}>Close</Button>
            </div>
        </div>
    );
}

function ProjectForm({ user, project, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: project?.title || '',
            description: project?.description || '',
            link: project?.link || '',
            imageUrl: project?.imageUrl || ''
        }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        let res;
        if (project) {
            res = await updateProject(project.id, data);
        } else {
            res = await addProject(data);
        }
        setIsLoading(false);
        onSave(res);
    };

    const handleDelete = async () => {
        if (!confirm("Delete this project?")) return;
        setIsLoading(true);
        const res = await deleteProject(project.id);
        setIsLoading(false);
        onSave(res);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label>Project Title</Label>
                <Input {...form.register('title')} className="bg-black/50 border-white/10" />
                {form.formState.errors.title && <p className="text-red-500 text-xs">{String(form.formState.errors.title.message)}</p>}
            </div>
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...form.register('description')} className="bg-black/50 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Project Link</Label>
                    <Input {...form.register('link')} placeholder="https://..." className="bg-black/50 border-white/10" />
                    {form.formState.errors.link && <p className="text-red-500 text-xs">{String(form.formState.errors.link.message)}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Project Media (Optional)</Label>
                    <FileUploadArea
                        label=""
                        buttonLabel="Upload Image"
                        currentUrl={form.watch('imageUrl')}
                        onUploadComplete={(url) => form.setValue('imageUrl', url)}
                        endpoint="bannerUploader"
                        aspectRatio={16 / 9}
                    />
                    <input type="hidden" {...form.register('imageUrl')} />
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1 bg-violet-600 hover:bg-violet-500">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {project ? 'Update' : 'Create'} Project
                </Button>
                {project && (
                    <Button type="button" onClick={handleDelete} variant="destructive" disabled={isLoading}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </form>
    );
}

function CustomLinksForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);

    // Parse initial links
    let initialLinks = [];
    try {
        initialLinks = user.customLinks ? JSON.parse(user.customLinks) : [];
    } catch (e) { initialLinks = []; }

    const form = useForm({
        resolver: zodResolver(customLinksSchema),
        defaultValues: { customLinks: initialLinks }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "customLinks"
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        // Stringify before sending
        const res = await updateUserProfile({ customLinks: JSON.stringify(data.customLinks) });
        setIsLoading(false);
        onSave(res);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 animate-in slide-in-from-left-2">
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs uppercase text-zinc-500">Label</Label>
                            <Input {...form.register(`customLinks.${index}.title` as const)} placeholder="My Blog" className="bg-black/50 border-white/10" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs uppercase text-zinc-500">URL</Label>
                            <Input {...form.register(`customLinks.${index}.url` as const)} placeholder="https://..." className="bg-black/50 border-white/10" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="hover:bg-red-500/10 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ title: '', url: '' })} className="w-full border-dashed border-white/10 text-zinc-400 hover:text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Link
            </Button>

            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Links
            </Button>
        </form>
    );
}

function SkillsForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');

    // Parse initial skills (comma separated in DB, or JSON)
    let initialSkills: string[] = [];
    if (user.skills) {
        // handle both JSON array string and comma-separated string
        if (user.skills.startsWith('[')) {
            try { initialSkills = JSON.parse(user.skills); } catch { initialSkills = []; }
        } else {
            initialSkills = user.skills.split(',').filter(Boolean);
        }
    }

    const [skills, setSkills] = useState<string[]>(initialSkills);

    const addSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            if (!skills.includes(input.trim())) {
                setSkills([...skills, input.trim()]);
            }
            setInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const onSubmit = async () => {
        setIsLoading(true);
        // Store as JSON string for better structured data support moving forward, 
        // OR comma separated if we want to stick to old schema. Let's stick to JSON string if possible, 
        // but looking at ProfileClient it parses JSON. So JSON string array is checking out.
        const res = await updateUserProfile({ skills: JSON.stringify(skills) });
        setIsLoading(false);
        onSave(res);
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="Type skill and hit Enter..."
                    className="bg-black/50 border-white/10"
                />
                <Button onClick={() => { if (input.trim()) { setSkills([...skills, input.trim()]); setInput(''); } }} variant="secondary">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border border-white/5 rounded-lg bg-zinc-900/30">
                {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                    </span>
                ))}
                {skills.length === 0 && <p className="text-zinc-500 text-sm italic">No skills added yet.</p>}
            </div>
            <Button onClick={onSubmit} disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Skills
            </Button>
        </div>
    );
}

function EducationForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm({
        defaultValues: { education: user.education || [] }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "education"
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const res = await updateUserProfile({ education: data.education });
        setIsLoading(false);
        onSave(res);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4 relative">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-0 right-0 hover:text-red-500 z-10">
                            <X className="w-4 h-4" />
                        </Button>
                        <div className="col-span-2 space-y-1">
                            <Label>School</Label>
                            <Input {...form.register(`education.${index}.school` as const)} className="bg-black/50 border-white/10" required />
                        </div>
                        <div className="space-y-1">
                            <Label>Degree</Label>
                            <Input {...form.register(`education.${index}.degree` as const)} className="bg-black/50 border-white/10" required />
                        </div>
                        <div className="space-y-1">
                            <Label>Year</Label>
                            <Input {...form.register(`education.${index}.year` as const)} placeholder="2022" className="bg-black/50 border-white/10" />
                        </div>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ school: '', degree: '', year: '' })} className="w-full border-dashed border-white/10">
                <Plus className="w-4 h-4 mr-2" /> Add Education
            </Button>

            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Education
            </Button>
        </form>
    );
}

function ExperienceForm({ user, onSave }: any) {
    const [isLoading, setIsLoading] = useState(false);

    // Sort experience by date descending for initial view
    const sortedExperience = user.experience ? [...user.experience].sort((a: any, b: any) =>
        new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
    ) : [];

    // Map Prisma model fields to form fields if needed
    // Prisma: position, company, startDate, endDate, description
    // Form: role, company, start, end, desc
    const initialData = sortedExperience.map((e: any) => ({
        role: e.position,
        company: e.company,
        start: e.startDate,
        end: e.endDate,
        desc: e.description
    }));

    const form = useForm({
        defaultValues: { experience: initialData }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "experience"
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        // We replace all experience with the new array
        const res = await updateUserProfile({ experience: data.experience });
        setIsLoading(false);
        onSave(res);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-8">
                {fields.map((field, index) => (
                    <div key={field.id} className="relative bg-zinc-900/30 p-4 rounded-xl border border-white/5 space-y-4">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 z-10">
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role / Position</Label>
                                <Input {...form.register(`experience.${index}.role` as const)} className="bg-black/50 border-white/10" placeholder="Senior Engineer" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input {...form.register(`experience.${index}.company` as const)} className="bg-black/50 border-white/10" placeholder="Acme Corp" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input {...form.register(`experience.${index}.start` as const)} type="text" placeholder="Jan 2023" className="bg-black/50 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input {...form.register(`experience.${index}.end` as const)} type="text" placeholder="Present" className="bg-black/50 border-white/10" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea {...form.register(`experience.${index}.desc` as const)} placeholder="Key achievements..." className="bg-black/50 border-white/10" rows={3} />
                        </div>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ role: '', company: '', start: '', end: '', desc: '' })} className="w-full border-dashed border-white/10 text-zinc-400 hover:text-white py-6">
                <Plus className="w-4 h-4 mr-2" /> Add Experience Position
            </Button>

            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Experience
            </Button>
        </form>
    );
}




