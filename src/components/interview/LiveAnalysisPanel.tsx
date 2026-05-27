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
        if (score >= 80) return { label: "EXCEPTIONAL", color: "text-emerald-600" };
        if (score >= 60) return { label: "OPTIMAL RANGE", color: "text-indigo-600" };
        if (score >= 40) return { label: "MODERATE", color: "text-amber-600" };
        return { label: "HESITANT", color: "text-rose-600" };
    };

    const confConfig = getConfidenceConfig(data.confidence);

    return (
        <div className="space-y-6">
            {/* Confidence Meter */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Confidence Telemetry</h3>
                </div>

                <div className="relative pt-4 pb-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                        <span>Hesitant</span>
                        <span>Assertive</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${data.confidence}%` }}
                        />
                    </div>
                    <div
                        className="absolute top-3 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-slate-350 transition-all duration-1000"
                        style={{ left: `${data.confidence}%` }}
                    />
                    <div className="mt-2 text-center">
                        <span className={`text-2xl font-mono font-bold ${confConfig.color}`}>
                            {data.confidence}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wider">{confConfig.label}</p>
                    </div>
                </div>
            </div>

            {/* Keyword Checklist */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Key Topics Detected</h3>
                </div>
                <ul className="space-y-3">
                    {data.topics.length === 0 ? (
                        <li className="text-sm text-slate-400 italic">Listening for topics...</li>
                    ) : (
                        data.topics.map((topic, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-650 animate-in fade-in slide-in-from-left-2 font-medium">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span>{topic}</span>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Coach Feedback Stream */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Live Feedback</h3>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-150 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        "{data.feedback}"
                    </p>
                </div>
            </div>
        </div>
    );
}
