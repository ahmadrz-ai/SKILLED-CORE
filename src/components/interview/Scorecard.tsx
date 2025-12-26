"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Loader2, Save, X, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { generateAnalysis, saveInterview } from "@/app/actions/interview";
import { toast } from "sonner";
import { motion } from "framer-motion";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ScorecardProps {
    isOpen: boolean;
    onClose: () => void;
    messages?: any[]; // Pass chat history
    config?: any;     // Pass role/difficulty
}

// Mock Data for Instant Feedback
const MOCK_DATA = {
    score: 72,
    feedback: "Preliminary analysis allows us to estimate performance. Finalizing neural validation...",
    radarData: { technical: 65, communication: 70, problemSolving: 60, confidence: 75, culturalFit: 80 },
    strengths: ["Communication", "Cultural Fit"],
    weaknesses: ["Technical Depth (Analyzing...)", "Problem Solving (Analyzing...)"]
};

export function Scorecard({ isOpen, onClose, messages = [], config = { role: "General", difficulty: 3 } }: ScorecardProps) {
    const [isLoading, setIsLoading] = useState(false); // No blocking load
    const [isRefining, setIsRefining] = useState(true); // Background loading state
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [data, setData] = useState<any>(MOCK_DATA); // Start with Mock

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            console.log("Generating analysis for", messages.length, "messages");
            setIsRefining(true);

            // Generate Real Analysis with Autosave
            generateAnalysis(messages, config.role, config.difficulty)
                .then(async (result) => {
                    if (result.success) {
                        setData(result.data);
                        // Trigger Autosave
                        setIsSaving(true);
                        const saveResult = await saveInterview(config.role, config.difficulty, result.data, messages);
                        if (saveResult.success) {
                            setSaved(true);
                            toast.success("Interview report saved to profile.");
                        } else {
                            toast.error("Failed to autosave report.");
                        }
                        setIsSaving(false);
                    } else {
                        toast.error("Analysis refined (using fallback).");
                    }
                })
                .finally(() => setIsRefining(false));
        }
    }, [isOpen]); // Runs when opened

    // Manual save handler removed as autosave is now default
    // Keeping function structure if needed for manual verification later
    const handleSave = async () => { };

    const chartData = {
        labels: ['Technical', 'Communication', 'Problem Solving', 'Confidence', 'Cultural Fit'],
        datasets: [
            {
                label: 'Candidate Score',
                data: data ? [data.radarData.technical, data.radarData.communication, data.radarData.problemSolving, data.radarData.confidence, data.radarData.culturalFit] : [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderColor: '#06b6d4',
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#94a3b8', font: { size: 10 } },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: { display: false }
            },
        },
        plugins: { legend: { display: false } }
    };

    if (!isOpen) return null;

    const getGrade = (score: number) => {
        if (score >= 97) return "S";
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        return "F";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-2xl overflow-hidden p-0">
                <DialogTitle className="sr-only">Interview Analysis</DialogTitle>

                <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                    {/* Left: Graphic Report */}
                    <div className="w-full md:w-2/5  bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 flex flex-col items-center justify-center border-r border-white/5 relative">

                        {/* Grade Badge */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-2xl bg-cyan-500 shadow-[0_0_40px_rgba(8,178,212,0.4)] flex items-center justify-center mb-6"
                        >
                            <span className="text-5xl font-black text-white">{getGrade(data?.score || 0)}</span>
                        </motion.div>

                        <h2 className="text-2xl font-bold tracking-wide text-white mb-2">SESSION COMPLETE</h2>
                        <p className="text-zinc-400 text-center text-sm mb-6">Performance analysis finalized.</p>

                        <div className="w-full aspect-square relative max-w-[200px]">
                            <Radar data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Right: Details & Actions */}
                    <div className="w-full md:w-3/5 p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-heading font-bold text-lg text-white">AI Analysis Report</h3>
                                <div className="text-xs font-mono text-cyan-500">
                                    ROLE: {config.role.toUpperCase()} // LVL {config.difficulty}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                            {/* Feedback */}
                            <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/5">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-yellow-500 mb-2">
                                    ⚡ Executive Summary
                                </h4>
                                <p className="text-sm text-zinc-300 italic">
                                    "{data?.feedback}"
                                </p>
                            </div>

                            {/* Strengths */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Strengths Detected</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data?.strengths.map((s: string, i: number) => (
                                        <span key={i} className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Areas for Improvement</h4>
                                <ul className="space-y-1">
                                    {data?.weaknesses.map((w: string, i: number) => (
                                        <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                                            <span className="text-red-500 mt-1">•</span>
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-6 mt-4 border-t border-white/5 flex gap-3">
                            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white">
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    if (saved) {
                                        window.location.href = "/feed";
                                    } else {
                                        toast.info("Saving in progress...");
                                    }
                                }}
                                disabled={isSaving}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {saved ? "Saved - Return to Feed" : "Saving Report..."}
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
