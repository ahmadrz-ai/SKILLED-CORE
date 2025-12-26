"use client";

import { useState } from "react";
import { ConfigurationModal } from "@/components/interview/ConfigurationModal";
import { ChatInterface } from "@/components/interview/ChatInterface";
import { LiveAnalysisPanel, TelemetryData } from "@/components/interview/LiveAnalysisPanel";
import { Scorecard } from "@/components/interview/Scorecard";
import { CodeEditorPanel } from "@/components/interview/CodeEditorPanel";
import { MessageSquarePlus, Code2, Mic, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DojoPage() {
    const [configOpen, setConfigOpen] = useState(true);
    const [sessionActive, setSessionActive] = useState(false);
    const [scorecardOpen, setScorecardOpen] = useState(false);
    const [config, setConfig] = useState<any>(null);

    const [sessionId, setSessionId] = useState<string>("");

    // Telemetry State (Lifted Up)
    const [telemetry, setTelemetry] = useState<TelemetryData>({
        confidence: 50,
        topics: [],
        feedback: "Waiting for analysis..."
    });

    // v2.0 Features
    const [isCoding, setIsCoding] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    const handleStartSession = (newConfig: any) => {
        setConfig(newConfig);
        setSessionId(Date.now().toString()); // Force remount
        setConfigOpen(false);
        setSessionActive(true);
        // Reset Telemetry
        setTelemetry({ confidence: 50, topics: [], feedback: "Waiting for analysis..." });
    };

    const handleEndSession = () => {
        setSessionActive(false);
        setScorecardOpen(true);
    };

    const handleReset = () => {
        setScorecardOpen(false);
        setConfigOpen(true);
        setConfig(null);
        setSessionId(""); // Clear session
        setIsCoding(false);
        setIsVoiceActive(false);
        setTelemetry({ confidence: 50, topics: [], feedback: "Waiting for analysis..." });
    };

    // Triggered by ChatInterface or Manual Toggle
    const toggleCodingMode = () => {
        setIsCoding(!isCoding);
    };

    return (
        <div className="min-h-screen bg-obsidian p-4 lg:p-6 flex flex-col h-screen overflow-hidden">

            {/* Header */}
            <header className="flex-none mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(8,145,178,0.3)]">
                        <MessageSquarePlus className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-heading font-black text-white tracking-wide">AI INTERVIEW <span className="text-cyan-500 text-xs align-top">v2.0</span></h1>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest hidden sm:block">
                            Neural Interview Simulator
                            {config?.useResume && <span className="ml-2 text-green-500">• Resume Context Active</span>}
                        </p>
                    </div>

                    {/* Navigation Tabs - Added per request */}
                    <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-lg p-1 ml-6 border border-white/5">
                        <button className="px-3 py-1 rounded-md bg-zinc-800 text-white text-xs font-bold shadow-sm cursor-default">
                            Interview
                        </button>
                        <Link href="/assessments">
                            <button className="flex items-center gap-2 px-3 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all">
                                <FileText className="w-3 h-3" />
                                Assessments
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Session Controls */}
                <div className="flex items-center gap-4">
                    {!sessionActive && (
                        <Link href="/feed" className="text-xs font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                            <LogOut className="w-3 h-3" /> EXIT
                        </Link>
                    )}
                    {sessionActive && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsVoiceActive(!isVoiceActive)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                    isVoiceActive
                                        ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"
                                )}
                            >
                                <Mic className="w-3 h-3" />
                                {isVoiceActive ? "VOICE LIVE" : "ENABLE VOICE"}
                            </button>

                            <button
                                onClick={toggleCodingMode}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                    isCoding
                                        ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"
                                )}
                            >
                                <Code2 className="w-3 h-3" />
                                {isCoding ? "CLOSE EDITOR" : "OPEN SANDBOX"}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Grid - Responsive Layout Switching */}
            <div className="flex-1 min-h-0 container mx-auto">
                <div className={cn(
                    "grid gap-4 h-full transition-all duration-500 ease-in-out",
                    isCoding
                        ? "grid-cols-1 lg:grid-cols-12" // Coding Layout
                        : "grid-cols-1 lg:grid-cols-3"  // Standard Layout
                )}>

                    {/* 1. CHAT COLUMN */}
                    <div className={cn(
                        "h-full flex flex-col transition-all duration-500",
                        isCoding ? "lg:col-span-4" : "lg:col-span-2"
                    )}>
                        <ChatInterface
                            key={sessionId} // FORCE REMOUNT ON NEW SESSION
                            sessionActive={sessionActive}
                            config={config || { role: 'Unknown', persona: 'Standard' }}
                            onEndSession={handleEndSession}
                            isVoiceMode={isVoiceActive}
                            compactMode={isCoding} // Tell Chat to be compact
                            onCodeTrigger={() => setIsCoding(true)} // Allow AI to open editor
                            onTelemetryUpdate={setTelemetry}
                        />
                    </div>

                    {/* 2. EDITOR COLUMN (Only visible in coding mode) */}
                    {isCoding && (
                        <div className="lg:col-span-8 h-full animate-in fade-in slide-in-from-right-10 duration-500">
                            <CodeEditorPanel
                                language="javascript" // Should be dynamic based on role
                                onRun={(code) => console.log("Run:", code)}
                            />
                        </div>
                    )}

                    {/* 3. ANALYSIS COLUMN (Hidden/Moved in coding mode for space?) */}
                    {!isCoding && (
                        <div className="lg:col-span-1 h-full hidden lg:block">
                            <LiveAnalysisPanel sessionActive={sessionActive} data={telemetry} />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConfigurationModal
                isOpen={configOpen}
                onStart={handleStartSession}
                onClose={() => setConfigOpen(false)}
            />

            <Scorecard
                isOpen={scorecardOpen}
                onClose={handleReset}
            />
        </div>
    );
}
