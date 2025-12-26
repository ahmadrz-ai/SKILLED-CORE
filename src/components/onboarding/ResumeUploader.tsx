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
                className="bg-zinc-900/50 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                            <FileCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Analysis Complete</h3>
                            <p className="text-xs text-zinc-400">Data ready for review</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setParsedData(null); setFile(null); }}>
                        <X className="w-4 h-4 text-zinc-500 hover:text-white" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <span className="text-xs text-zinc-500 block mb-1">HEADLINE</span>
                            <p className="text-sm text-white font-medium">{parsedData.headline}</p>
                        </div>
                        <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <span className="text-xs text-zinc-500 block mb-1">SKILLS DETECTED</span>
                            <div className="flex flex-wrap gap-1">
                                {parsedData.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="text-[10px] bg-cyan-900/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                        {skill}
                                    </span>
                                ))}
                                {parsedData.skills.length > 3 && (
                                    <span className="text-[10px] text-zinc-500 py-0.5">+{parsedData.skills.length - 3} more</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-violet-500/5 rounded-lg border border-violet-500/20 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        <p className="text-xs text-violet-200">
                            "Strong match for Senior roles. Recommendation: Highlight performance optimization."
                        </p>
                    </div>

                    <Button
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide"
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
                "relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer overflow-hidden",
                isDragging ? "border-violet-500 bg-violet-500/5" : "border-white/10 bg-zinc-900/20 hover:border-violet-500/50 hover:bg-zinc-900/40"
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
                            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
                            <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Scanning Neural Pattern...</h3>
                        <p className="text-sm text-cyan-400 font-mono animate-pulse">{progress}</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center space-y-4 pointer-events-none text-zinc-400 group-hover:text-zinc-200"
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-colors duration-300",
                            isDragging ? "bg-violet-500 text-white shadow-[0_0_20px_#8b5cf6]" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-white"
                        )}>
                            <CloudUpload className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Drag & Drop Resume (PDF)</p>
                            <p className="text-xs text-zinc-500 mt-1">or click to browse local files</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Grid Decoration */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />
        </div>
    );
}
