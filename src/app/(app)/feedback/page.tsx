'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquarePlus, Bug, Lightbulb, Send, AlertTriangle, Paperclip, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitFeedback } from '@/actions/feedback';

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

        const MAX_SIZE = 4 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error("File too large", { description: "Maximum file size is 4MB." });
            e.target.value = '';
            return;
        }

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type", { description: "Please upload an image or video file." });
            e.target.value = '';
            return;
        }

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
            toast.success("Feedback Received", { description: "Feedback logged in central database." });
            setTitle('');
            setDescription('');
            setFiles([]);
            setUploadedFile(null);
        } else {
            toast.error("Feedback Error", { description: res.message });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pt-12 pb-20 font-sans text-[var(--text-body)]">
            
            {/* Header */}
            <div className="text-center space-y-1.5 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading uppercase flex items-center justify-center gap-2">
                    <MessageSquarePlus className="w-6 h-6 text-[var(--sc-purple-600)]" />
                    Protocol <span className="text-[var(--text-brand)]">Feedback</span>
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto leading-relaxed">
                    Report anomalies or propose system upgrades. Your input optimizes our operations.
                </p>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden"
                onSubmit={handleSubmit}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none" />

                {/* Type Selector */}
                <div className="grid grid-cols-2 gap-4 p-1.5 bg-[var(--bg-secondary-panel)] rounded-xl border border-[var(--border-default)]">
                    <button
                        type="button"
                        onClick={() => setType('BUG')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                            type === 'BUG' 
                                ? "bg-[var(--bg-error)] text-[var(--text-error)] border-[var(--border-error)]" 
                                : "text-[var(--text-sidebar-inactive)] border-transparent hover:text-[var(--text-sidebar-hover)] bg-transparent"
                        )}
                    >
                        <Bug className="w-4 h-4 shrink-0" /> BUG REPORT
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('SUGGESTION')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                            type === 'SUGGESTION' 
                                ? "bg-[var(--sc-purple-50)] text-[var(--text-brand)] border-[var(--sc-purple-200)]" 
                                : "text-[var(--text-sidebar-inactive)] border-transparent hover:text-[var(--text-sidebar-hover)] bg-transparent"
                        )}
                    >
                        <Lightbulb className="w-4 h-4 shrink-0" /> SUGGESTION
                    </button>
                </div>

                {/* Severity (Only for Bugs) */}
                {type === 'BUG' && (
                    <div className="space-y-2 text-left">
                        <label className="block text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest">Severity Level</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setSeverity(level)}
                                    className={cn(
                                        "py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer uppercase",
                                        severity === level
                                            ? level === 'CRITICAL' ? "bg-[var(--sc-red-600)] text-white border-[var(--sc-red-600)] shadow-sm"
                                              : level === 'HIGH' ? "bg-[var(--sc-amber-600)] text-white border-[var(--sc-amber-600)] shadow-sm"
                                              : level === 'MEDIUM' ? "bg-[var(--sc-purple-600)] text-white border-[var(--sc-purple-600)] shadow-sm"
                                              : "bg-[var(--sc-gray-800)] text-white border-[var(--sc-gray-800)] shadow-sm"
                                            : "bg-transparent text-[var(--text-secondary)] border-[var(--border-input)] hover:border-[var(--border-input-hover)]"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content inputs */}
                <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Subject Title</label>
                        <input
                            type="text"
                            placeholder="Brief Title (e.g. Navigation Glitch on Mobile)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2.5 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] transition-all shadow-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
                        <textarea
                            rows={5}
                            placeholder="Detailed description... Steps to reproduce..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2.5 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] transition-all resize-none shadow-xs"
                        />
                    </div>
                </div>

                {/* Media Upload Section */}
                <div className="space-y-2 text-left">
                    <label className="block text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest">Attach Media (Optional)</label>
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
                            className="border border-dashed border-[var(--border-input)] hover:border-[var(--border-focus)] rounded-xl p-6 text-center text-[var(--text-secondary)] hover:bg-[var(--bg-sidebar-hover)] transition-all cursor-pointer group block"
                        >
                            <Paperclip className="w-5 h-5 mx-auto mb-2 text-[var(--icon-muted)] group-hover:text-[var(--sc-purple-600)] transition-all opacity-70 group-hover:opacity-100 shrink-0" />
                            <span className="text-xs font-bold block">ATTACH SCREENSHOT OR VIDEO</span>
                            <span className="text-[10px] text-[var(--text-tertiary)] mt-1 block">Max 4MB • PNG, JPG, GIF, WebP, MP4, WebM</span>
                        </label>
                    ) : (
                        <div className="border border-[var(--border-default)] rounded-xl p-4 bg-[var(--bg-secondary-panel)] flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                                    <Paperclip className="w-4 h-4 text-[var(--text-brand)]" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-xs text-[var(--text-heading)] font-bold truncate max-w-[240px]">{uploadedFile.name}</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-medium">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="text-[var(--icon-default)] hover:text-[var(--text-error)] transition-colors p-1 cursor-pointer border-none bg-transparent"
                            >
                                <XCircle className="w-5 h-5 shrink-0" />
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none shadow-sm cursor-pointer"
                >
                    {isSubmitting ? "SUBMITTING..." : (
                        <>
                            SUBMIT FEEDBACK <Send className="w-3.5 h-3.5 text-white shrink-0" />
                        </>
                    )}
                </button>
            </motion.form>
        </div>
    );
}
