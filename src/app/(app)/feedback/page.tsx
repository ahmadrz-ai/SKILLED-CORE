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

                    {/* Attachment Placeholder - In real app, reuse FileUploadArea */}
                    {/* <div className="border border-dashed border-white/10 rounded-xl p-6 text-center text-zinc-600 hover:bg-white/5 transition-colors cursor-pointer group">
                        <Paperclip className="w-5 h-5 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xs font-mono">ATTACH SCREENSHOTS (OPTIONAL)</span>
                    </div> */}

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
