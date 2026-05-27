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
            toast.success("Feedback Received", { description: "Feedback logged in central mainframe." });
            setTitle('');
            setDescription('');
            setFiles([]);
            setUploadedFile(null);
        } else {
            toast.error("Feedback Error", { description: res.message });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 px-4 pb-20">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-heading font-black text-slate-900 tracking-tight">
                        PROTOCOL <span className="text-indigo-600">FEEDBACK</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
                        Report anomalies or propose system upgrades. Your input optimizes the matrix.
                    </p>
                </div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden"
                    onSubmit={handleSubmit}
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setType('BUG')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all border",
                                type === 'BUG' ? "bg-red-50 text-red-600 border-red-200" : "text-slate-500 border-transparent hover:text-slate-800"
                            )}
                        >
                            <Bug className="w-4 h-4" /> BUG REPORT
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('SUGGESTION')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all border",
                                type === 'SUGGESTION' ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "text-slate-500 border-transparent hover:text-slate-800"
                            )}
                        >
                            <Lightbulb className="w-4 h-4" /> SUGGESTION
                        </button>
                    </div>

                    {/* Severity (Only for Bugs) */}
                    {type === 'BUG' && (
                        <div className="space-y-3">
                            <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Severity Level</label>
                            <div className="grid grid-cols-4 gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setSeverity(level)}
                                            className={cn(
                                                "py-2 text-xs font-bold rounded border transition-all",
                                                severity === level
                                                    ? level === 'CRITICAL' ? "bg-red-600 text-white border-red-600 shadow-sm"
                                                      : level === 'HIGH' ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                                      : level === 'MEDIUM' ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                      : "bg-slate-800 text-white border-slate-800 shadow-sm"
                                                    : "bg-transparent text-slate-600 border-slate-200 hover:border-slate-400"
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
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-sm"
                        />
                        <textarea
                            rows={5}
                            placeholder="Detailed description... Steps to reproduce..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none shadow-sm"
                        />
                    </div>

                    {/* Media Upload Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Attach Media (Optional)</label>

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
                                className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 hover:bg-slate-50 hover:border-indigo-500/30 transition-all cursor-pointer group block"
                            >
                                <Paperclip className="w-5 h-5 mx-auto mb-2 text-slate-400 group-hover:text-indigo-600 transition-all opacity-70 group-hover:opacity-100" />
                                <span className="text-xs font-bold block">ATTACH SCREENSHOT OR VIDEO</span>
                                <span className="text-[10px] text-slate-400 mt-1 block">Max 4MB • PNG, JPG, GIF, WebP, MP4, WebM</span>
                            </label>
                        ) : (
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
                                        <Paperclip className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-900 font-bold">{uploadedFile.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
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
                        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "SUBMITTING..." : (
                            <>
                                SUBMIT FEEDBACK <Send className="w-4 h-4 text-white" />
                            </>
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
