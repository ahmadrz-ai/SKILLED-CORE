"use client";

import { Activity, CheckCircle, AlertTriangle } from "lucide-react";

export interface TelemetryData {
    confidence: number;
    topics: string[];
    feedback: string;
}

interface AnalysisPanelProps {
    sessionActive: boolean;
    data?: TelemetryData;
}

export function LiveAnalysisPanel({ sessionActive, data = { confidence: 50, topics: [], feedback: "Waiting for analysis..." } }: AnalysisPanelProps) {
    if (!sessionActive) return null;

    // Determine Confidence Color and Label
    const getConfidenceConfig = (score: number) => {
        if (score >= 80) return { label: "EXCEPTIONAL", color: "text-green-400" };
        if (score >= 60) return { label: "OPTIMAL RANGE", color: "text-cyan-400" };
        if (score >= 40) return { label: "MODERATE", color: "text-yellow-400" };
        return { label: "HESITANT", color: "text-red-400" };
    };

    const confConfig = getConfidenceConfig(data.confidence);

    return (
        <div className="space-y-6">
            {/* Confidence Meter */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Confidence Telemetry</h3>
                </div>

                <div className="relative pt-4 pb-2">
                    <div className="flex justify-between text-xs text-zinc-500 mb-2">
                        <span>Hesitant</span>
                        <span>Assertive</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-1000"
                            style={{ width: `${data.confidence}%` }}
                        />
                    </div>
                    <div
                        className="absolute top-3 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-1000"
                        style={{ left: `${data.confidence}%` }}
                    />
                    <div className="mt-2 text-center">
                        <span className={`text-2xl font-mono font-bold ${confConfig.color}`}>
                            {data.confidence}%
                        </span>
                        <p className="text-[10px] text-zinc-500">{confConfig.label}</p>
                    </div>
                </div>
            </div>

            {/* Keyword Checklist */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Key Topics Detected</h3>
                </div>
                <ul className="space-y-3">
                    {data.topics.length === 0 ? (
                        <li className="text-sm text-zinc-600 italic">Listening for topics...</li>
                    ) : (
                        data.topics.map((topic, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-400 animate-in fade-in slide-in-from-left-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span>{topic}</span>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Coach Feedback Stream */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Live Feedback</h3>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-200">
                        "{data.feedback}"
                    </p>
                </div>
            </div>
        </div>
    );
}
