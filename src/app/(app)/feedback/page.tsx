'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquarePlus, Bug, Lightbulb, Send, AlertTriangle, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitFeedback } from '@/actions/feedback';
import { FileUploadArea } from '@/components/profile/ProfileEditModals'; // Prepare to reuse or mock if needed

export default function FeedbackPage() {
    const [type, setType] = useState<'BUG' | 'SUGGESTION'>('BUG');
    const [severity, setSeverity] = useState('LOW');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (4MB = 4,194,304 bytes)
        const MAX_SIZE = 4 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error("File too large", { description: "Maximum file size is 4MB." });
            e.target.value = ''; // Reset input
            return;
        }

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type", { description: "Please upload an image or video file." });
            e.target.value = '';
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFiles([base64String]);
            setUploadedFile({
                name: file.name,
                size: file.size,
                type: file.type
            });
            toast.success("File attached", { description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)` });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = () => {
        setFiles([]);
        setUploadedFile(null);
        toast.info("File removed");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            toast.error("Please provide a title and description.");
            return;
        }

        setIsSubmitting(true);
        const res = await submitFeedback({
            type,
            title,
            description,
            severity: type === 'BUG' ? severity : undefined,
            files
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Feedback Recieved", { description: "Transmission logged in central mainframe." });
            setTitle('');
            setDescription('');
            setFiles([]);
            setUploadedFile(null);
        } else {
            toast.error("Transmission Error", { description: res.message });
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 px-4 pb-20">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-heading font-black text-white tracking-tight">
                        PROTOCOL <span className="text-violet-500">FEEDBACK</span>
                    </h1>
                    <p className="text-zinc-500 font-mono text-sm max-w-md mx-auto">
                        Report anomalies or propose system upgrades. Your input optimizes the matrix.
                    </p>
                </div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-xl relative overflow-hidden"
                    onSubmit={handleSubmit}
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-4 p-1 bg-zinc-950/50 rounded-xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => setType('BUG')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
                                type === 'BUG' ? "bg-red-500/10 text-red-500 border border-red-500/20" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <Bug className="w-4 h-4" /> BUG REPORT
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('SUGGESTION')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
                                type === 'SUGGESTION' ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <Lightbulb className="w-4 h-4" /> SUGGESTION
                        </button>
                    </div>

                    {/* Severity (Only for Bugs) */}
                    {type === 'BUG' && (
                        <div className="space-y-3">
                            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Severity Level</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setSeverity(level)}
                                        className={cn(
                                            "py-2 text-xs font-bold rounded border transition-all",
                                            severity === level
                                                ? level === 'CRITICAL' ? "bg-red-600 text-white border-red-600"
                                                    : "bg-zinc-800 text-white border-white/20"
                                                : "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Brief Title (e.g. Navigation Glitch on Mobile)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                        <textarea
                            rows={5}
                            placeholder="Detailed description... Steps to reproduce..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Media Upload Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Attach Media (Optional)</label>

                        <input
                            type="file"
                            id="media-upload"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,video/mp4,video/webm"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {!uploadedFile ? (
                            <label
                                htmlFor="media-upload"
                                className="border border-dashed border-white/10 rounded-xl p-6 text-center text-zinc-600 hover:bg-white/5 hover:border-violet-500/30 transition-all cursor-pointer group block"
                            >
                                <Paperclip className="w-5 h-5 mx-auto mb-2 opacity-50 group-hover:opacity-100 group-hover:text-violet-400 transition-all" />
                                <span className="text-xs font-mono block">ATTACH SCREENSHOT OR VIDEO</span>
                                <span className="text-[10px] text-zinc-700 mt-1 block">Max 4MB • PNG, JPG, GIF, WebP, MP4, WebM</span>
                            </label>
                        ) : (
                            <div className="border border-white/10 rounded-xl p-4 bg-zinc-950/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                        <Paperclip className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-medium">{uploadedFile.name}</p>
                                        <p className="text-xs text-zinc-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "TRANSMITTING..." : (
                            <>
                                SUBMIT FEEDBACK <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
