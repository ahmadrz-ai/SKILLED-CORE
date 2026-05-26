"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Ticket, Clock, AlertTriangle, Users, Search, ChevronRight, 
    X, Sparkles, CheckCircle2, ShieldCheck, Mail, Send
} from "lucide-react";
import { getDesignPartnerApplications, updateApplicationCohort, dispatchSlaResponse } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Application {
    id: string;
    name: string;
    company: string;
    teamSize: number;
    mistake: string;
    status: string;
    cohort?: string;
    createdAt: string;
    slaResponse?: string;
}

export default function CohortsAdminPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "cohort1" | "cohort2" | "all">("pending");
    const [slaReply, setSlaReply] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchApps = async () => {
        const res = await getDesignPartnerApplications();
        if (res.success) {
            setApplications(res.applications);
        }
    };

    useEffect(() => {
        fetchApps();
        const interval = setInterval(fetchApps, 5000);
        return () => clearInterval(interval);
    }, []);

    // Set draft reply automatically when app selection changes
    useEffect(() => {
        if (selectedApp) {
            const diag = getDiagnosticMapping(selectedApp.mistake);
            setSlaReply(
                `Hi ${selectedApp.name},\n\nThank you for applying for a SkilledCore Zero-Cost Design Partner seat on behalf of ${selectedApp.company}.\n\nI reviewed your biggest hiring challenge regarding "${selectedApp.mistake}". In our precision calibration benchmarks, we classify this failure mode as a "${diag.pattern}".\n\nTo solve this, ${diag.mitigation}\n\nI would love to set up a brief onboarding call this week to co-define your sandbox criteria.\n\nBest regards,\nSkilledCore Support Team`
            );
        }
    }, [selectedApp]);

    const getDiagnosticMapping = (mistakeText: string) => {
        const text = mistakeText.toLowerCase();
        if (
            text.includes("talker") || 
            text.includes("code") || 
            text.includes("coding") || 
            text.includes("technical") || 
            text.includes("skills") || 
            text.includes("fake") || 
            text.includes("build") ||
            text.includes("cv") ||
            text.includes("resume")
        ) {
            return {
                pattern: "Verbal Proxy Deception (Talker who cannot build)",
                mitigation: "SkilledCore maps this failure mode directly to our isolated sandboxed coding execution environments. We compile and test raw candidate refactoring speeds, capacity scaling under load, and algorithms, bypassing static resume keywords or rehearsed verbal proxies entirely."
            };
        }
        if (
            text.includes("leak") || 
            text.includes("bug") || 
            text.includes("memory") || 
            text.includes("pointer") || 
            text.includes("race") || 
            text.includes("lock") ||
            text.includes("production") ||
            text.includes("crash") ||
            text.includes("performance")
        ) {
            return {
                pattern: "Volatile Runtime Mismatch (Production debugging deficit)",
                mitigation: "We solve this with live concurrent load tracing. Our debugging challenge sandboxes measure pointer alignment correctness, CAS lock thread scheduling, and dynamic trace offsets. Candidate debugging depth is calculated directly before they can introduce critical regressions."
            };
        }
        if (
            text.includes("culture") || 
            text.includes("empathy") || 
            text.includes("communication") || 
            text.includes("collaborate") || 
            text.includes("team") || 
            text.includes("toxic") ||
            text.includes("fit")
        ) {
            return {
                pattern: "Cross-Functional Friction (Communication deficits)",
                mitigation: "We solve this by evaluating cognitive translation structures. During interactive interview screens, candidates explain failovers using analogies. SkilledCore's cognitive analyzer maps their transcript clarity and jargon reduction ratios to prove leadership."
            };
        }
        return {
            pattern: "Resume Credentialing Bias (Inaccurate screening parameters)",
            mitigation: "We solve this via ATS greenhouse/lever auto sync calibration cohorts. By ingesting historical success profiles (Hero Hires vs. Regret Passes), SkilledCore establishes a custom precision screening baseline calibrated directly from your existing top developers."
        };
    };

    const handleAssignCohort = async (cohort: string, status: string = "ACCEPTED") => {
        if (!selectedApp) return;
        setIsSubmitting(true);
        const loading = toast.loading(`Assigning ${selectedApp.company} to ${cohort}...`);
        
        const res = await updateApplicationCohort(selectedApp.id, cohort, status);
        toast.dismiss(loading);
        setIsSubmitting(false);
        
        if (res.success) {
            toast.success(`Assigned to ${cohort} successfully.`);
            fetchApps();
            setSelectedApp(prev => prev ? { ...prev, cohort, status } : null);
        } else {
            toast.error(res.message);
        }
    };

    const handleSendSlaReply = async () => {
        if (!selectedApp || !slaReply.trim()) return;
        setIsSubmitting(true);
        const loading = toast.loading("Sending personalized SLA response...");
        
        const res = await dispatchSlaResponse(selectedApp.id, slaReply.trim());
        toast.dismiss(loading);
        setIsSubmitting(false);
        
        if (res.success) {
            toast.success("SLA Response Sent!");
            fetchApps();
            setSelectedApp(prev => prev ? { ...prev, status: "RESPONDED", slaResponse: slaReply.trim() } : null);
        } else {
            toast.error(res.message);
        }
    };

    // Calculate dynamic stats
    const totalApps = applications.length;
    const cohort1Seats = 12 + applications.filter(a => a.cohort === "COHORT_1" && a.status === "ACCEPTED").length;
    const pendingReview = applications.filter(a => a.status === "PENDING").length;

    // SLA warnings count: Pending requests approaching 2-Hour SLA limit
    const getSlaTimeRemaining = (createdAtStr: string) => {
        const createdTime = new Date(createdAtStr).getTime();
        const twoHoursMs = 7200 * 1000;
        const elapsedTime = Date.now() - createdTime;
        const remaining = Math.max(0, twoHoursMs - elapsedTime);
        return remaining;
    };

    const activeSlaWarnings = applications.filter(a => {
        if (a.status !== "PENDING") return false;
        const remaining = getSlaTimeRemaining(a.createdAt);
        return remaining > 0 && remaining < 3600 * 1000; // less than 1 hour remaining
    }).length;

    const filteredApps = applications.filter(app => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            app.name.toLowerCase().includes(query) || 
            app.company.toLowerCase().includes(query) || 
            app.mistake.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        if (activeTab === "pending") return app.status === "PENDING";
        if (activeTab === "cohort1") return app.cohort === "COHORT_1";
        if (activeTab === "cohort2") return app.cohort === "COHORT_2";
        return true;
    });

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-violet-400 uppercase">Design Partner Management</span>
                <h1 className="text-3xl font-black text-white tracking-tight mt-1">Pilot Cohort Administrator</h1>
                <p className="text-zinc-500 text-xs mt-1">Manage zero-cost design partner applications, seat availability, SLA responses, and stack calibration.</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Registrations */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-850 flex items-center justify-center border border-zinc-800">
                        <Users className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Total Registrations</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">{totalApps}</h3>
                    </div>
                </div>

                {/* Cohort 1 seats */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-950/20 flex items-center justify-center border border-violet-500/10">
                            <Ticket className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Cohort 1 Seats Capped</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <h3 className="text-2xl font-black text-white">{cohort1Seats}/20</h3>
                                <span className="text-[10px] text-emerald-450 font-bold">ACTIVE</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${(cohort1Seats / 20) * 100}%` }} />
                    </div>
                </div>

                {/* Active SLA Alarms */}
                <div className={cn(
                    "border rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all duration-300",
                    activeSlaWarnings > 0
                        ? "bg-red-950/20 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                        : "bg-zinc-900/30 border-zinc-800/80"
                )}>
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                        activeSlaWarnings > 0 
                            ? "bg-red-900/10 border-red-500/20" 
                            : "bg-zinc-850 border-zinc-800"
                    )}>
                        <AlertTriangle className={cn("w-5 h-5", activeSlaWarnings > 0 ? "text-red-400 animate-pulse" : "text-zinc-500")} />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Active SLA Warnings</span>
                        <h3 className={cn("text-2xl font-black mt-0.5", activeSlaWarnings > 0 ? "text-red-400" : "text-white")}>
                            {activeSlaWarnings}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* List Panel */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                    
                    {/* Filters & Search */}
                    <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 select-none">
                            {[
                                { id: "pending", label: `Pending (${pendingReview})` },
                                { id: "cohort1", label: "Cohort 1" },
                                { id: "cohort2", label: "Cohort 2" },
                                { id: "all", label: "All" }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0",
                                        activeTab === tab.id
                                            ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                            : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-850 px-3.5 py-2 rounded-xl w-full md:w-64 text-zinc-400">
                            <Search className="w-4 h-4 text-zinc-650" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search applicants..."
                                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-650 w-full"
                            />
                        </div>
                    </div>

                    {/* Applications List */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {filteredApps.map(app => {
                            const remainingSla = getSlaTimeRemaining(app.createdAt);
                            const minutesLeft = Math.floor(remainingSla / 60000);
                            const isPending = app.status === "PENDING";
                            const isSelected = selectedApp?.id === app.id;

                            return (
                                <button
                                    key={app.id}
                                    onClick={() => setSelectedApp(app)}
                                    className={cn(
                                        "w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 shadow-sm",
                                        isSelected
                                            ? "bg-violet-500/5 border-violet-500/30 text-white"
                                            : "bg-zinc-900/10 border-zinc-800/80 hover:bg-zinc-900/20 hover:border-zinc-800"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-zinc-200">{app.company}</h4>
                                            {app.cohort && (
                                                <span className="px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-[9px] font-bold text-violet-300">
                                                    {app.cohort}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-450 font-normal">EM: {app.name} · Team: {app.teamSize} developers</p>
                                        <p className="text-[11px] text-zinc-500 line-clamp-1 italic mt-1 font-normal">Challenge: "{app.mistake}"</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {isPending && remainingSla > 0 && (
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-xl text-[9px] font-black font-mono border flex items-center gap-1.5",
                                                minutesLeft < 60
                                                    ? "bg-red-950/20 border-red-500/20 text-red-400 animate-pulse"
                                                    : "bg-violet-950/15 border-violet-500/20 text-violet-300"
                                            )}>
                                                <Clock className="w-3 h-3" />
                                                {minutesLeft}m SLA Left
                                            </span>
                                        )}
                                        {app.status === "RESPONDED" && (
                                            <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold border bg-emerald-950/10 border-emerald-500/20 text-emerald-450 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> RESPONDED
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                                    </div>
                                </button>
                            );
                        })}
                        {filteredApps.length === 0 && (
                            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl p-10 text-center text-zinc-550 text-xs leading-normal">
                                No applications registered in this category matching search filters.
                            </div>
                        )}
                    </div>

                </div>

                {/* Detail sheet / side panel */}
                <div className="lg:col-span-5 flex flex-col">
                    <AnimatePresence mode="wait">
                        {selectedApp ? (
                            <motion.div
                                key={selectedApp.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full space-y-6 shadow-sm relative overflow-hidden"
                            >
                                <div className="space-y-6 flex-1 overflow-y-auto max-h-[480px] pr-1">
                                    {/* Subtitle */}
                                    <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                                        <div>
                                            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Applicant Assessment Matrix</span>
                                            <h3 className="text-base font-black text-white tracking-tight mt-1">{selectedApp.company}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">Application ID: {selectedApp.id}</p>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedApp(null)}
                                            className="p-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors border-none"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Application Profile */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">Engineering Director</span>
                                                <span className="text-xs font-semibold text-zinc-200">{selectedApp.name}</span>
                                            </div>
                                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">Team Developers</span>
                                                <span className="text-xs font-semibold text-zinc-200">{selectedApp.teamSize} members</span>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 space-y-1">
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">EM reported hiring failure</span>
                                            <p className="text-xs text-zinc-350 leading-relaxed italic">"{selectedApp.mistake}"</p>
                                        </div>
                                    </div>

                                    {/* AI Diagnostic match mapping blueprint */}
                                    <div className="bg-violet-950/10 border border-violet-500/20 rounded-xl overflow-hidden p-4 space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between border-b border-violet-500/10 pb-2">
                                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" /> Diagnostic match blueprint
                                            </span>
                                            <span className="text-[9px] font-bold font-mono text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full bg-violet-500/5">CALIBRATED</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Failure Mode Pattern</p>
                                            <p className="text-xs font-bold text-zinc-300 mt-0.5">{getDiagnosticMapping(selectedApp.mistake).pattern}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Mitigation System Action</p>
                                            <p className="text-[11px] text-zinc-450 leading-relaxed mt-1">
                                                {getDiagnosticMapping(selectedApp.mistake).mitigation}
                                            </p>
                                        </div>
                                    </div>

                                    {/* SLA Response Dispatcher */}
                                    {selectedApp.status === "PENDING" ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">SLA Confirmation Composer</span>
                                                <span className="text-[9px] text-violet-400 font-bold uppercase flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> Auto-Draft Generated
                                                </span>
                                            </div>
                                            <textarea
                                                value={slaReply}
                                                onChange={e => setSlaReply(e.target.value)}
                                                rows={6}
                                                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
                                                placeholder="Draft your personalized EM SLA confirmation here..."
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                onClick={handleSendSlaReply}
                                                disabled={isSubmitting}
                                                className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all duration-150 border-none hover:shadow-violet-600/20 active:scale-95"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                Send SLA Response & Resolve SLA
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 space-y-2">
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">Dispatched SLA Response</span>
                                            <p className="text-[11px] font-mono text-zinc-450 leading-relaxed whitespace-pre-line bg-zinc-900/50 p-3 rounded-lg border border-zinc-850/60 max-h-[180px] overflow-y-auto">
                                                {selectedApp.slaResponse}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Operational Action Footer */}
                                <div className="border-t border-zinc-800 pt-4 flex gap-3 select-none">
                                    <button
                                        onClick={() => handleAssignCohort("COHORT_1")}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "flex-1 py-3 text-xs font-bold rounded-xl transition-all h-11 border border-zinc-800 shadow-sm shrink-0 active:scale-95",
                                            selectedApp.cohort === "COHORT_1"
                                                ? "bg-violet-500/10 text-violet-300 font-black border-violet-500/20"
                                                : "bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                        )}
                                    >
                                        {selectedApp.cohort === "COHORT_1" ? "Active In Cohort 1" : "Assign Cohort 1"}
                                    </button>
                                    <button
                                        onClick={() => handleAssignCohort("COHORT_2")}
                                        disabled={isSubmitting}
                                        className={cn(
                                            "flex-1 py-3 text-xs font-bold rounded-xl transition-all h-11 border border-zinc-800 shadow-sm shrink-0 active:scale-95",
                                            selectedApp.cohort === "COHORT_2"
                                                ? "bg-violet-500/10 text-violet-300 font-black border-violet-500/20"
                                                : "bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                        )}
                                    >
                                        {selectedApp.cohort === "COHORT_2" ? "Active In Cohort 2" : "Assign Cohort 2"}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-zinc-900/10 border border-zinc-800/80 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center text-zinc-550 text-xs h-full min-h-[400px] space-y-3">
                                <ShieldCheck className="w-8 h-8 opacity-30" />
                                <div>
                                    <p className="font-bold text-zinc-400">No Application Selected</p>
                                    <p className="text-[11px] text-zinc-550 mt-0.5">Select a design partner application request from the left panel index list to activate operational matrix controls.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
