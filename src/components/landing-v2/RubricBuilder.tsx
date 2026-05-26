"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Sparkles, Terminal, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TraceSample {
    candidate: string;
    scenario: string;
    logs: string[];
    inferences: string[];
    score: number;
    metric: string;
}

const TRACES: Record<string, TraceSample> = {
    "systems-design": {
        candidate: "Alex Mercer (Principal Event Architect Candidate)",
        scenario: "Scale event dispatcher to sustain 120,000 req/sec event load spike",
        logs: [
            "Initializing isolated sandbox container...",
            "Compiling bi-directional multiplexer pipeline...",
            "Simulating multi-node event traffic injection...",
            "TRACER DIAGNOSTIC: High thread contention detected on atomic queue registers.",
            "OBSERVATION: Candidate implemented adaptive back-off throttle at ingestion bottleneck.",
            "METRIC CHECK: Event delivery guarantees intact. Latency under 4ms stabilized."
        ],
        inferences: [
            "Evaluated low-level connection pooling behaviors under severe concurrent pressures.",
            "Verified zero thread deadlock anomalies under high-contention atomic registers.",
            "Evaluated memory allocator profiles: minimal heap allocation spikes detected."
        ],
        score: 94,
        metric: "Execution Parity & Scaling Depth"
    },
    "debugging": {
        candidate: "Sophia Vance (Senior Distributed Backend Candidate)",
        scenario: "Isolate a non-deterministic memory leak in dynamic concurrent thread pool",
        logs: [
            "Spawning isolated sandboxed execution matrix...",
            "Injecting concurrent pointer alignment load vectors...",
            "TRACER DIAGNOSTIC: Thread offset mismatch detected at line 147.",
            "OBSERVATION: Candidate isolated race conditions in volatile pointer alignments.",
            "METRIC CHECK: Volatile registers re-ordered using atomic Compare-And-Swap (CAS) instructions.",
            "MEMCHECK: Virtual memory leaks fully resolved. Leaks decreased to 0B."
        ],
        inferences: [
            "Demonstrated expert-level memory offset tracing in multi-threaded runtime environments.",
            "Identified concurrent writes mismatch without relying on standard log outputs.",
            "Optimized register scheduling blocks with lock-free atomic pointer synchronizations."
        ],
        score: 97,
        metric: "Volatile Register & Thread Debugging Depth"
    },
    "code-quality": {
        candidate: "Daniel Chen (Senior Systems Engineer Candidate)",
        scenario: "Refactor high-complexity monolithic routing loop into modular decoupled channels",
        logs: [
            "Analyzing monolith directory topology...",
            "Calculating cyclomatic complexity baseline (Original score: 42)...",
            "Evaluating modular decouple boundaries in candidate refactor...",
            "OBSERVATION: Monolithic branch restructured into asynchronous channels.",
            "METRIC CHECK: Cyclomatic complexity reduced from 42 to 4.",
            "TESTSUITE: Decoupled unit tests passed locally with 100% path coverage."
        ],
        inferences: [
            "Restructured highly coupled conditional branch blocks into modular event-driven patterns.",
            "Decreased overall system structural complexity by 90.4%.",
            "Added high-coverage isolated mock boundaries to assert side-effects independently."
        ],
        score: 91,
        metric: "Architecture Modularisation & Decoupling Quality"
    },
    "communication": {
        candidate: "Sarah Jenkins (Lead Site Reliability Candidate)",
        scenario: "Explain complex cluster partition and replication failovers to business stakeholders",
        logs: [
            "Activating audio/transcript cognitive parsing models...",
            "Analyzing explanation vocabulary and stakeholder resonance vectors...",
            "OBSERVATION: Candidate explained data split-brain scenarios using simple fluid analogies.",
            "METRIC CHECK: Avoided developer jargon inside initial executive summary.",
            "TACTICAL ASSIGNMENT: Mapping business impact: calculated recovery costs and prevention strategies."
        ],
        inferences: [
            "Exhibited exceptional cross-functional empathy, mapping technical issues directly to operational cost variables.",
            "Simplified highly complex replication boundaries using clean mental models.",
            "Proposed structured, actionable remediation plans to align stakeholder interests."
        ],
        score: 93,
        metric: "Business Alignment & Empathy Resonance"
    }
};

export function RubricBuilder() {
    const [selectedCategory, setSelectedCategory] = useState<string>("systems-design");
    const [simulating, setSimulating] = useState<boolean>(false);
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
    const currentTrace = TRACES[selectedCategory];

    // Trigger log typing simulation when category changes
    useEffect(() => {
        setSimulating(true);
        setVisibleLogs([]);
        
        let logIndex = 0;
        const logs = TRACES[selectedCategory]?.logs || [];
        
        const interval = setInterval(() => {
            if (logIndex < logs.length) {
                const nextLog = logs[logIndex];
                if (nextLog !== undefined) {
                    setVisibleLogs(prev => [...prev, nextLog]);
                }
                logIndex++;
            } else {
                clearInterval(interval);
                setSimulating(false);
            }
        }, 300);

        return () => clearInterval(interval);
    }, [selectedCategory]);

    const scrollToApply = () => {
        const el = document.getElementById("apply-pilot");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section id="rubric-builder" className="py-20 border-t border-zinc-200/60 relative bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-650 uppercase mb-4 tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Interactive Sandbox Demo
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-3">
                        What's the most critical engineering skill for your next hire?
                    </h2>
                    <p className="text-zinc-500 max-w-lg mx-auto text-sm leading-relaxed">
                        Select a target evaluation rubric below to compile a simulated candidate sandbox trace trace in real-time. No code required.
                    </p>
                </div>

                {/* Main Interactive Split */}
                <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
                    
                    {/* Left Panel: Category Selector */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                            <Label className="text-zinc-400 uppercase tracking-widest text-[10px] font-bold block mb-2">Target Rubric Categories</Label>
                            {[
                                { id: "systems-design", title: "Systems Design Depth", desc: "Pooling, atomics, thread contention, and capacity scaling." },
                                { id: "debugging", title: "Debugging Precision", desc: "Volatile register checks, race conditions, and memory trace." },
                                { id: "code-quality", title: "Code Modularisation", desc: "Refactoring, complex cyclomatics, and decoupled architecture." },
                                { id: "communication", title: "EM-Stakeholder Alignment", desc: "Translating splits, analogies, and strategic recover maps." }
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 shadow-sm",
                                        selectedCategory === cat.id
                                            ? "bg-indigo-50/50 border-indigo-600 text-indigo-600 font-bold"
                                            : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                                        selectedCategory === cat.id
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-zinc-50 text-zinc-400 border-zinc-200"
                                    )}>
                                        {cat.id === "systems-design" && "01"}
                                        {cat.id === "debugging" && "02"}
                                        {cat.id === "code-quality" && "03"}
                                        {cat.id === "communication" && "04"}
                                    </div>
                                    <div>
                                        <h4 className={cn("text-sm font-bold", selectedCategory === cat.id ? "text-indigo-650" : "text-zinc-800")}>
                                            {cat.title}
                                        </h4>
                                        <p className="text-xs text-zinc-450 mt-1 font-normal leading-relaxed">{cat.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Scarcity-CTA box directly below selector */}
                        <div className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-5 shadow-inner">
                            <h4 className="text-xs font-bold text-indigo-650 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" /> EM Verification Seals Active
                            </h4>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                                This live scorecard telemetry is independent and 100% free of demographic bias proxies, fully GDPR Article 22 compliant.
                            </p>
                            <button
                                onClick={scrollToApply}
                                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm hover:shadow active:scale-95 duration-100 border-none transition-all"
                            >
                                See how your full team would evaluate
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Simulated Sandboxed Execution Trace */}
                    <div className="lg:col-span-7 flex flex-col">
                        <div className="w-full bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 flex-1 flex flex-col overflow-hidden min-h-[480px]">
                            
                            {/* Terminal Header */}
                            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-mono text-zinc-500 font-bold ml-2 uppercase tracking-widest flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5 text-zinc-400" /> Sandbox-Compile-Trace // {selectedCategory.toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600 font-bold select-none">
                                    UPLINK ACTIVE
                                </div>
                            </div>

                            {/* Terminal Logs & Output */}
                            <div className="p-5 font-mono text-[11px] leading-relaxed text-zinc-400 flex-1 overflow-y-auto space-y-4 max-h-[380px]">
                                
                                {/* Target info */}
                                <div className="border-b border-zinc-900 pb-3">
                                    <p className="text-zinc-500"><span className="text-zinc-650 font-bold">CANDIDATE:</span> {currentTrace?.candidate}</p>
                                    <p className="text-zinc-500 mt-1"><span className="text-zinc-650 font-bold">CHALLENGE:</span> {currentTrace?.scenario}</p>
                                </div>

                                {/* Simulation Logs */}
                                <div className="space-y-1">
                                    {visibleLogs.map((log, idx) => {
                                        const isAlert = log?.includes("DIAGNOSTIC") || log?.includes("OBSERVATION");
                                        const isPassed = log?.includes("CHECK") || log?.includes("MEMCHECK");
                                        return (
                                            <p 
                                                key={idx} 
                                                className={cn(
                                                    "transition-all duration-300",
                                                    isAlert ? "text-indigo-400" : isPassed ? "text-emerald-450 font-bold" : "text-zinc-450"
                                                )}
                                            >
                                                &gt; {log}
                                            </p>
                                        );
                                    })}
                                    {simulating && (
                                        <div className="flex items-center gap-2 text-indigo-500 animate-pulse mt-2">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>COMPILING neural ontology traces...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Cognitive Inferences Section */}
                                <AnimatePresence>
                                    {!simulating && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="pt-4 border-t border-zinc-900 space-y-2 animate-in fade-in duration-300"
                                        >
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Observable Inferences & Evidences</p>
                                            <div className="space-y-1.5 pl-2 border-l border-indigo-500/20">
                                                {currentTrace.inferences.map((inf, idx) => (
                                                    <p key={idx} className="text-zinc-400 text-xs flex items-start gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                                        <span>{inf}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Trace Scorecard Footer */}
                            <div className="bg-zinc-900 border-t border-zinc-800 p-4 shrink-0 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Verification Index</p>
                                    <p className="text-xs font-bold text-white mt-0.5">{currentTrace.metric}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Trace Score</p>
                                    <div className="flex items-baseline gap-1.5 justify-end">
                                        <span className="text-2xl font-black text-white font-mono">{currentTrace.score}%</span>
                                        <span className="text-[10px] text-emerald-450 font-bold font-mono">PASS</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}

// Helper Label
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("text-xs font-semibold text-zinc-500", className)}>{children}</span>
);
