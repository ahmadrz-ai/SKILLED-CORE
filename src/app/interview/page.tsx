"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ConfigurationModal } from "@/components/interview/ConfigurationModal";
import { ChatInterface } from "@/components/interview/ChatInterface";
import { LiveAnalysisPanel, TelemetryData } from "@/components/interview/LiveAnalysisPanel";
import { Scorecard } from "@/components/interview/Scorecard";
import { CodeEditorPanel } from "@/components/interview/CodeEditorPanel";
import { MessageSquarePlus, Code2, Mic, LogOut, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DojoPage() {
    // FIX-008: Require authentication before rendering interview UI
    const { data: session, status } = useSession();
    const router = useRouter();

    const [configOpen, setConfigOpen] = useState(false); // Start closed until auth resolved
    const [sessionActive, setSessionActive] = useState(false);
    const [scorecardOpen, setScorecardOpen] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string>("");
    const [interviewMessages, setInterviewMessages] = useState<any[]>([]);
    const [interviewDuration, setInterviewDuration] = useState<number>(0);
    const [sessionSaved, setSessionSaved] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [authResolved, setAuthResolved] = useState(false);

    const [telemetry, setTelemetry] = useState<TelemetryData>({
        confidence: 50,
        topics: [],
        feedback: "Waiting for analysis..."
    });

    const [isCoding, setIsCoding] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    // FIX-008: Redirect unauthenticated users and track auth resolution
    useEffect(() => {
        if (status !== 'loading') {
            setAuthResolved(true);
        }
        if (status === 'unauthenticated') {
            router.replace('/register?role=candidate&redirect=/interview');
        }
        if (status === 'authenticated') {
            // Open config modal only after auth is confirmed
            setConfigOpen(true);
        }
    }, [status, router]);

    const handleStartSession = (newConfig: any) => {
        setConfig(newConfig);
        setSessionId(`session-${Date.now()}`); // Readable session ID
        setConfigOpen(false);
        setSessionActive(true);
        setInterviewMessages([]);
        setTelemetry({ confidence: 50, topics: [], feedback: "Waiting for analysis..." });
        setSessionSaved(false);
    };

    const handleEndSession = (sessionMessages?: any[], durationSeconds?: number) => {
        if (Array.isArray(sessionMessages)) {
            setInterviewMessages(sessionMessages);
        }
        if (typeof durationSeconds === "number") {
            setInterviewDuration(durationSeconds);
        }
        setSessionActive(false);
        setScorecardOpen(true);
    };

    const handleReset = () => {
        setScorecardOpen(false);
        setConfigOpen(true);
        setConfig(null);
        setSessionId("");
        setIsCoding(false);
        setIsVoiceActive(false);
        setInterviewMessages([]);
        setInterviewDuration(0);
        setTelemetry({ confidence: 50, topics: [], feedback: "Waiting for analysis..." });
        setSessionSaved(false);
        setAnalysisData(null);
        setSavedId(null);
    };

    const toggleCodingMode = () => setIsCoding(!isCoding);

    // FIX-008: Loading state while auth resolves (only on initial load)
    if (status === 'loading' && !authResolved) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                    <p className="text-zinc-400 font-mono text-sm tracking-widest uppercase">
                        Initializing AI Interviewer...
                    </p>
                </div>
            </div>
        );
    }

    // FIX-008: Don't render UI for unauthenticated users (redirect handled by useEffect)
    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                    <p className="text-zinc-400 text-sm">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // FIX-008: Dynamic session title — no more "LIVE // Unknown"
    const sessionTitle = config
        ? `${config.role || 'General'} Interview`
        : 'AI Interview';

    const candidateName = session?.user?.name?.split(' ')[0] || 'Candidate';

    return (
        <div className="min-h-[100dvh] bg-transparent p-4 lg:p-6 flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>

            {/* Header */}
            <header className="flex-none mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(8,145,178,0.3)]">
                        <MessageSquarePlus className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        {/* Dynamic title for premium professionalism — changed text-zinc-900 to text-zinc-100 */}
                        <h1 className="text-xl font-heading font-black text-zinc-100 tracking-tight flex items-center gap-2">
                            {sessionActive ? (
                                <>
                                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">{sessionTitle}</span>
                                    <span className="text-zinc-400 font-normal text-sm ml-2">— {candidateName}</span>
                                </>
                            ) : (
                                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">AI Interview</span>
                            )}
                        </h1>
                        <p className="text-xs text-zinc-550 font-medium hidden sm:block">
                            Elevating technical standards with real-time adaptive feedback
                            {config?.useResume && (
                                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 tracking-wider font-mono">
                                    • RESUME ACTIVE
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-lg p-1 ml-6 border border-white/5">
                        <button className="px-3 py-1 rounded-md bg-zinc-800 text-white text-xs font-bold shadow-sm cursor-default">
                            Interview
                        </button>
                        <Link href="/assessments">
                            <button className="flex items-center gap-2 px-3 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all min-h-[44px] md:min-h-0">
                                <FileText className="w-3 h-3" />
                                Assessments
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Session Controls */}
                <div className="flex items-center gap-4">
                    {!sessionActive && (
                        <Link href="/feed" className="text-xs font-mono text-zinc-550 hover:text-white transition-colors flex items-center gap-2 min-h-[44px] md:min-h-0">
                            <LogOut className="w-3 h-3" /> EXIT
                        </Link>
                    )}
                    {sessionActive && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsVoiceActive(!isVoiceActive)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border min-h-[44px] md:min-h-0",
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
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border min-h-[44px] md:min-h-0",
                                    isCoding
                                        ? "bg-blue-650 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
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

            {/* Main Grid */}
            <div className="flex-1 min-h-0 container mx-auto">
                <div className={cn(
                    "grid gap-4 h-full transition-all duration-500 ease-in-out",
                    isCoding
                        ? "grid-cols-1 lg:grid-cols-12"
                        : "grid-cols-1 lg:grid-cols-3"
                )}>

                    {/* Chat Column */}
                    <div className={cn(
                        "h-full flex flex-col transition-all duration-500",
                        isCoding ? "lg:col-span-4" : "lg:col-span-2"
                    )}>
                        <ChatInterface
                            key={sessionId}
                            sessionActive={sessionActive}
                            config={config || { role: config?.role || 'General', persona: 'Standard' }}
                            onEndSession={handleEndSession}
                            isVoiceMode={isVoiceActive}
                            compactMode={isCoding}
                            onCodeTrigger={() => setIsCoding(true)}
                            onTelemetryUpdate={setTelemetry}
                        />
                    </div>

                    {/* Editor Column */}
                    {isCoding && (
                        <div className="lg:col-span-8 h-full animate-in fade-in slide-in-from-right-10 duration-500">
                            <CodeEditorPanel
                                language="javascript"
                                onRun={(code) => console.log("Run:", code)}
                            />
                        </div>
                    )}

                    {/* Analysis Column */}
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
                messages={interviewMessages}
                config={config}
                sessionSaved={sessionSaved}
                setSessionSaved={setSessionSaved}
                analysisData={analysisData}
                setAnalysisData={setAnalysisData}
                savedId={savedId}
                setSavedId={setSavedId}
                durationSeconds={interviewDuration}
            />
        </div>
    );
}
