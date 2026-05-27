"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Sparkles, AlertCircle, FileText, Clock, CheckCircle2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { applyDesignPartnerPilot } from "@/app/actions/partner";
import { cn } from "@/lib/utils";

export function DesignPartnerForm() {
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [teamSize, setTeamSize] = useState("");
    const [mistake, setMistake] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState<any>(null);

    // Live countdown timer for the 2-Hour Response Guarantee (7200 seconds)
    const [timeLeft, setTimeLeft] = useState(7200);
    useEffect(() => {
        if (!submittedData) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [submittedData]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !company.trim() || !teamSize || !mistake.trim()) {
            toast.error("Please fill in all 4 priority fields.");
            return;
        }

        const size = parseInt(teamSize);
        if (isNaN(size) || size < 1) {
            toast.error("Engineering team size must be a positive number.");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Transmitting pilot application to cortex...");

        try {
            const res = await applyDesignPartnerPilot({
                name: name.trim(),
                company: company.trim(),
                teamSize: size,
                mistake: mistake.trim()
            });

            toast.dismiss(loadingToast);
            if (res.success) {
                setSubmittedData(res);
                toast.success("Application successfully registered in the cohort!");
            } else {
                toast.error(res.message || "Failed to submit.");
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Client-side instant diagnostic analyst mapping the biggest mistake to a SkilledCore solution
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
                mitigation: "SkilledCore maps this failure mode directly to our isolated sandboxed coding execution environments. We compile and test raw candidate refactoring speeds, capacity scaling under load, and algorithms, bypassing static resume keywords or rehearsed verbal proxies entirely. You evaluate actual builds, not talks."
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
                mitigation: "We solve this with live concurrent load tracing. Our debugging challenge sandboxes measure pointer alignment correctness, CAS lock thread scheduling, and dynamic trace offsets. Candidate debugging depth is calculated directly before they can introduce critical regressions to your database pools."
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
                mitigation: "We solve this by evaluating cognitive translation structures. During interactive interview screens, candidates are asked to explain failovers using analogies. SkilledCore's cognitive analyzer maps their transcript clarity, strategic planning metrics, and jargon reduction ratios to prove operational leadership."
            };
        }
        
        return {
            pattern: "Resume Credentialing Bias (Inaccurate screening parameters)",
            mitigation: "We solve this by matching candidates directly through execution traces. Instead of evaluating keywords on a standard static resume, SkilledCore compares actual execution capabilities in coding, distributed systems, and real-world system debugging to locate authentic top-tier developers."
        };
    };

    const diagnostic = submittedData ? getDiagnosticMapping(submittedData.mistake) : null;

    return (
        <section id="apply-pilot" className="py-20 bg-zinc-50 border-t border-zinc-200/60 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        
                        {!submittedData ? (
                            /* --- STEP 2: 4-FIELD APPLICATION & SCARCITY GATE --- */
                            <motion.div 
                                key="dp-form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-xl relative"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-650" />

                                {/* Scarcity details */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-zinc-100">
                                    <div>
                                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Apply for Zero-Cost Design Partner seat</h3>
                                        <p className="text-xs text-zinc-500 font-medium mt-1">Capped at exactly 20 companies to maintain high-velocity onboarding</p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-650 uppercase tracking-wider mb-2">
                                            <span>Cohort Seat Allocation</span>
                                        </div>
                                        <div className="w-48 h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 shadow-inner flex">
                                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: "60%" }} /> {/* 12 claimed */}
                                        </div>
                                        <p className="text-[10px] font-bold text-zinc-400 mt-1.5">12/20 seats claimed · 8 available</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1 md:col-span-1">
                                            <Label>Full Name *</Label>
                                            <Input 
                                                value={name} 
                                                onChange={e => setName(e.target.value)} 
                                                placeholder="Engineering Manager" 
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-1">
                                            <Label>Company Entity *</Label>
                                            <Input 
                                                value={company} 
                                                onChange={e => setCompany(e.target.value)} 
                                                placeholder="e.g. Acme Inc." 
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-1">
                                            <Label>Engineering Team Size *</Label>
                                            <Input 
                                                type="number"
                                                value={teamSize} 
                                                onChange={e => setTeamSize(e.target.value)} 
                                                placeholder="e.g. 24" 
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>What is the biggest technical hiring mistake you've made? *</Label>
                                            <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider">Psychological Calibration Intake</span>
                                        </div>
                                        <textarea
                                            value={mistake}
                                            onChange={e => setMistake(e.target.value)}
                                            rows={4}
                                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner placeholder:text-zinc-300 leading-relaxed"
                                            placeholder="Describe the failure mode (e.g. Hired a verbal genius who failed to commit a single line of working code in 3 months)..."
                                            disabled={isSubmitting}
                                        />
                                        <p className="text-[10px] text-zinc-400">Answering this question signals genuine collaborative interest and qualifies your priority onboarding queue.</p>
                                    </div>

                                    <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-zinc-100">
                                        <p className="text-xs text-zinc-500 max-w-md font-medium text-left">
                                            We seek engineering teams who want to active-participate and co-define the benchmark for precision hiring. Free of charge.
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 duration-100 border-none shrink-0 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Transmitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Submit Pilot Application
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            /* --- STEP 3: TRUST CONFIRMATION & PERSONALIZED DIAGNOSTIC TICKET --- */
                            <motion.div 
                                key="dp-success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-2xl relative"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-650 animate-pulse" />

                                {/* Success Title */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                                            <Ticket className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Active Dispatch Ticket Registered</h3>
                                            <p className="text-xs text-zinc-450 font-medium mt-0.5">Application ID: <span className="font-bold text-indigo-600 font-mono">{submittedData.ticketId}</span></p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-2xl shadow-sm">
                                        <Clock className="w-4 h-4 text-indigo-650 animate-pulse" />
                                        <div>
                                            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-bold">2-Hour SLA Timer</p>
                                            <p className="text-sm font-black font-mono text-indigo-650 mt-0.5">{formatTime(timeLeft)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Confirmation message */}
                                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 shadow-inner">
                                        <h4 className="text-sm font-bold text-zinc-800 mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            Identity Validated: {submittedData.name} ({submittedData.company})
                                        </h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Thank you for registering. Our system has automatically mapped your priority cohort queue. 
                                            We guarantee a highly detailed engineering response directly to your secure contact email within exactly 2 hours.
                                        </p>
                                    </div>

                                    {/* Step 3: TRUST MOMENT — AI Mapping of Biggest Hiring Mistake */}
                                    {diagnostic && (
                                        <div className="border border-indigo-150 rounded-2xl overflow-hidden shadow-sm bg-indigo-50/10">
                                            <div className="bg-indigo-50/50 border-b border-indigo-100 px-5 py-3.5 flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-indigo-650 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4" /> SkilledCore Active Diagnostics
                                                </h4>
                                                <span className="text-[9px] font-bold font-mono text-indigo-550 border border-indigo-200 px-2 py-0.5 rounded-full bg-white shadow-sm">CALIBRATING</span>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hiring Mistake Pattern Analyzed</p>
                                                    <p className="text-sm font-bold text-zinc-800 mt-1">{diagnostic.pattern}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Architectural Solution Mapping</p>
                                                    <p className="text-xs text-zinc-650 leading-relaxed mt-1.5 bg-white p-4 rounded-xl border border-zinc-200/60 shadow-inner">
                                                        {diagnostic.mitigation}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">Skilled Core Protocol v2.4.9</p>
                                    <button 
                                        onClick={() => setSubmittedData(null)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-750 transition-colors uppercase"
                                    >
                                        Register Another Team
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

            </div>
        </section>
    );
}

// Reusable Helper Components
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("text-xs font-bold text-zinc-500 uppercase tracking-wider block", className)}>{children}</span>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={cn(
            "w-full bg-white border border-zinc-200 rounded-xl h-12 px-4 text-zinc-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner placeholder:text-zinc-300",
            className
        )}
        {...props}
    />
);
