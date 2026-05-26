"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Flag, User, Briefcase, Shield, ChevronDown, ChevronUp,
    MessageSquare, Send, X, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const CATEGORIES = [
    { title: "Getting Started", icon: Flag, desc: "Account creation, identity setup, and initial configuration." },
    { title: "For Candidates", icon: User, desc: "Job search strategies, profile optimization, and application tracking." },
    { title: "For Recruiters", icon: Briefcase, desc: "Posting bounties, managing pipelines, and billing operations." },
    { title: "Trust & Safety", icon: Shield, desc: "Reporting scams, verification badges, and community guidelines." },
];

const FAQS = [
    { q: "How do I switch between Candidate and Recruiter profiles?", a: "You cannot switch a single account between these fundamental roles. You must register separate accounts for hiring and working due to our strict conflict-of-interest protocols." },
    { q: "What is the Ghost Protocol?", a: "It is a privacy setting available in your dashboard (Profile > Edit). When active, it completely hides your profile from all search results and public viewing, allowing you to browse anonymously." },
    { q: "Are salaries mandatory on Job Posts?", a: "Yes. SkilledCore mandates salary transparency for all listings to ensure market efficiency. Posts without ranges are automatically deprioritized." },
    { q: "How do I verify my company?", a: "Company verification requires a manual review. Go to Settings > Company > Request Verification and upload your business registration documents." },
    { q: "What is the 'Skilled Score'?", a: "Your Skilled Score is an aggregate metric of your activity, reliability, and peer reviews. Higher scores unlock exclusive opportunities and premium features." },
];

const SUGGESTIONS = [
    "Reset Password", "Passport Verification", "Delete Account", "API Keys", "Billing History"
];

// --- Components ---

const SuggestionBox = ({ query, onSelect }: { query: string, onSelect: (s: string) => void }) => {
    if (!query) return null;
    const filtered = SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()));
    if (filtered.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full lg:left-0 left-4 right-4 lg:w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-50 py-2"
        >
            {filtered.map(s => (
                <button
                    key={s}
                    onClick={() => onSelect(s)}
                    className="w-full text-left px-4 py-2 text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50 flex items-center gap-3 transition-colors text-sm font-semibold"
                >
                    <Search className="w-4 h-4 text-zinc-400" />
                    {s}
                </button>
            ))}
        </motion.div>
    );
};

const TicketModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <div
                    className="absolute inset-0"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden text-zinc-800"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 p-1.5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                                    <MessageSquare className="w-5 h-5 text-indigo-650" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">Open Dispatch Ticket</h3>
                                    <p className="text-xs text-zinc-450">Our engineers usually respond in &lt;2 hours.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-mono text-zinc-400 font-bold mb-1">SUBJECT</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner placeholder:text-zinc-300"
                                        placeholder="e.g. Billing Error"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-zinc-400 font-bold mb-1">DESCRIPTION</label>
                                    <textarea
                                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner min-h-[100px] placeholder:text-zinc-300"
                                        placeholder="Describe the anomaly..."
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                                <Send className="w-4 h-4" />
                                Transmit Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner mx-auto mb-4">
                                <FileText className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Ticket #9402 Received</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                A confirmation has been sent to your secure inbox. You can track status in the Command Center.
                            </p>
                            <button
                                onClick={onClose}
                                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    return (
        <div 
            className="w-full min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden font-sans rounded-2xl text-zinc-805"
            style={{ background: "linear-gradient(165deg, #FAFAFE 0%, #F1EEFF 40%, #EDE9FE 70%, #FAFAFE 100%)" }}
        >
            {/* Subtle mesh background */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #6366F1 1px, transparent 1px), radial-gradient(circle at 75% 75%, #6366F1 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* HERO SECTION */}
            <div className="relative h-[35vh] flex flex-col items-center justify-center text-center p-6 border-b border-zinc-200/60 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-650/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-2xl w-full space-y-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-650">
                            SYSTEM DOCUMENTATION
                        </h1>
                        <p className="text-zinc-500 font-mono text-sm max-w-lg mx-auto">
                            Search the archives or browse protocols below.
                        </p>
                    </div>

                    <div className="relative max-w-xl mx-auto w-full group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                            <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/85 backdrop-blur-xl border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-md relative z-0"
                            placeholder="Type keywords (e.g. 'password', 'verification')..."
                        />
                        <SuggestionBox query={searchQuery} onSelect={setSearchQuery} />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-16 relative z-10">

                {/* CATEGORY GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CATEGORIES.map((cat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="p-6 rounded-2xl border border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-indigo-200 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                        >
                            <div className="w-12 h-12 rounded-lg bg-zinc-150 flex items-center justify-center mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-zinc-200/40 shadow-inner">
                                <cat.icon className="w-6 h-6 text-zinc-500 group-hover:text-indigo-650 transition-colors" />
                            </div>
                            <h3 className="font-bold text-zinc-850 mb-2">{cat.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                {cat.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ ACCORDION */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-heading font-black mb-8 text-center text-zinc-850">FREQUENTLY ACCESSED DATA</h2>
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors font-bold text-zinc-800"
                                >
                                    <span>{faq.q}</span>
                                    {openIndex === i ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                                </button>
                                <motion.div
                                    initial={false}
                                    animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 pb-6 pt-2 text-zinc-650 text-sm leading-relaxed border-t border-zinc-100">
                                        {faq.a}
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TICKET SUBMISSION */}
                <div className="border-t border-zinc-200 pt-16 text-center">
                    <p className="text-zinc-400 mb-6 font-mono text-xs font-bold tracking-wider">STILL ENCOUNTERING ERRORS?</p>
                    <button
                        onClick={() => setIsTicketOpen(true)}
                        className="bg-white hover:bg-indigo-50 border border-zinc-200 hover:border-indigo-250 text-indigo-650 hover:text-indigo-750 font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all tracking-wider text-sm active:scale-95 duration-100"
                    >
                        OPEN SUPPORT TICKET
                    </button>
                </div>

            </div>

            <TicketModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />

        </div>
    );
}
