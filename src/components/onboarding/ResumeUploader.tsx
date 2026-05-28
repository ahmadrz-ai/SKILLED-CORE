"use client";

import { useState, useCallback } from 'react';
import { useResumeParser } from '@/hooks/useResumeParser';
import { CloudUpload, FileCheck, FileText, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUploadThing } from "@/lib/uploadthing";
import { updateUserProfile } from '@/app/(app)/profile/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function ResumeUploader() {
    const { isAnalyzing, progress, parsedData, parseWithAI, setParsedData } = useResumeParser();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const { startUpload } = useUploadThing("resumeUploader", {
        onClientUploadComplete: () => { console.log("uploaded"); },
        onUploadError: () => { toast.error("File upload failed"); }
    });

    const handleConfirm = async () => {
        if (!parsedData || !file) return;
        setIsSaving(true);
        toast.info("Syncing neural profile...");

        try {
            // 1. Upload Resume File
            const uploadRes = await startUpload([file]);
            if (!uploadRes || uploadRes.length === 0) {
                throw new Error("Upload failed");
            }
            const resumeUrl = uploadRes[0].url;

            // 2. Map and Update Profile
            await updateUserProfile({
                headline: parsedData.headline,
                bio: parsedData.summary,
                skills: parsedData.skills, // items array
                experience: parsedData.experience,
                education: parsedData.education,
                resumeUrl: resumeUrl
            });

            toast.success("Identity Protocol Initialized");
            router.push('/profile/me');

        } catch (error) {
            console.error(error);
            toast.error("Failed to sync profile");
            setIsSaving(false);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
            parseWithAI(droppedFile);
        }
    }, [parseWithAI]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseWithAI(selectedFile);
        }
    };

    if (parsedData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-6 relative overflow-hidden text-[var(--text-body)]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--sc-purple-500)] to-[var(--sc-purple-700)]" />
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--sc-purple-50)] flex items-center justify-center border border-[var(--sc-purple-200)]">
                            <FileCheck className="w-5 h-5 text-[var(--text-brand)]" />
                        </div>
                        <div>
                            <h3 className="text-[var(--text-heading)] font-bold">Analysis Complete</h3>
                            <p className="text-xs text-[var(--text-secondary)]">Data ready for review</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="hover:bg-[var(--bg-sidebar-hover)]" onClick={() => { setParsedData(null); setFile(null); }}>
                        <X className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-heading)]" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 bg-[var(--bg-secondary-panel)] rounded-xl border border-[var(--border-default)]">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Headline</span>
                            <p className="text-xs text-[var(--text-heading)] font-semibold leading-relaxed">{parsedData.headline}</p>
                        </div>
                        <div className="p-3.5 bg-[var(--bg-secondary-panel)] rounded-xl border border-[var(--border-default)]">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">Skills Detected</span>
                            <div className="flex flex-wrap gap-1">
                                {parsedData.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="text-[10px] bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] px-2 py-0.5 rounded-md border border-[var(--sc-purple-200)] font-medium">
                                        {skill}
                                    </span>
                                ))}
                                {parsedData.skills.length > 3 && (
                                    <span className="text-[10px] text-[var(--text-secondary)] font-bold self-center ml-1">+{parsedData.skills.length - 3} more</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-[var(--sc-purple-50)] rounded-xl border border-[var(--sc-purple-100)] flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--sc-purple-500)] animate-pulse" />
                        <p className="text-xs text-[var(--text-brand)] font-semibold leading-normal">
                            "Strong match for Senior roles. Recommendation: Highlight performance optimization."
                        </p>
                    </div>

                    <Button
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className="w-full h-11 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold tracking-wide rounded-xl cursor-pointer"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "CONFIRM & INITIALIZE PROTOCOL"}
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer overflow-hidden bg-[var(--bg-card)]",
                isDragging ? "border-[var(--border-focus)] bg-[var(--sc-purple-50)]/50" : "border-[var(--border-input)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-sidebar-hover)]"
            )}
        >
            <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileInput}
                disabled={isAnalyzing}
            />

            <AnimatePresence mode="wait">
                {isAnalyzing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center z-20 pointer-events-none"
                    >
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 border-4 border-[var(--border-subtle)] rounded-full" />
                            <div className="absolute inset-0 border-4 border-[var(--sc-purple-650)] border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-[var(--sc-purple-650)] animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-heading)] mb-1">Scanning Neural Pattern...</h3>
                        <p className="text-xs text-[var(--text-brand)] font-mono animate-pulse">{progress}</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center space-y-4 pointer-events-none text-[var(--text-secondary)] group-hover:text-[var(--text-heading)]"
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-colors duration-300 border border-[var(--border-default)]",
                            isDragging ? "bg-[var(--sc-purple-600)] text-white shadow-md shadow-[var(--sc-purple-200)]" : "bg-[var(--bg-secondary-panel)] text-[var(--icon-default)] group-hover:bg-[var(--bg-sidebar-hover)] group-hover:text-[var(--text-heading)]"
                        )}>
                            <CloudUpload className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--text-heading)]">Drag & Drop Resume (PDF)</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">or click to browse local files</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Grid Decoration */}
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />
        </div>
    );
}
