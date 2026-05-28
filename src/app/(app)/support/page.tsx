"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Flag, User, Briefcase, Shield, ChevronDown, ChevronUp,
    MessageSquare, Send, X, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QodeeLogo } from "@/components/QodeeLogo";

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
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-dropdown)] border border-[var(--border-dropdown)] rounded-xl shadow-[var(--shadow-dropdown)] overflow-hidden z-50 py-2 text-left"
        >
            {filtered.map(s => (
                <button
                    key={s}
                    onClick={() => onSelect(s)}
                    className="w-full text-left px-4 py-2 text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary-panel)] flex items-center gap-3 transition-colors text-xs font-semibold border-none bg-transparent cursor-pointer"
                >
                    <Search className="w-3.5 h-3.5 text-[var(--icon-muted)] shrink-0" />
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
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
            >
                <div
                    className="absolute inset-0"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-[var(--bg-modal)] border border-[var(--border-modal)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-modal)] overflow-hidden text-[var(--text-body)]"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--icon-default)] hover:text-[var(--icon-strong)] p-1.5 transition-colors border-none bg-transparent cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>

                    {step === 1 ? (
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-[var(--sc-purple-50)] flex items-center justify-center border border-[var(--sc-purple-200)] shadow-inner">
                                    <MessageSquare className="w-5 h-5 text-[var(--text-brand)] shrink-0" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[var(--text-heading)]">Open Dispatch Ticket</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-medium">Our engineers usually respond in &lt;2 hours.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-mono text-[var(--text-secondary)] font-bold mb-1">SUBJECT</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] transition-all placeholder:text-[var(--text-placeholder)]"
                                        placeholder="e.g. Billing Error"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-[var(--text-secondary)] font-bold mb-1">DESCRIPTION</label>
                                    <textarea
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] transition-all min-h-[100px] placeholder:text-[var(--text-placeholder)] resize-none"
                                        placeholder="Describe the anomaly..."
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold py-3 rounded-lg flex items-center justify-center gap-2 border-none shadow-sm cursor-pointer mt-2 text-xs uppercase tracking-wider"
                            >
                                <Send className="w-3.5 h-3.5 shrink-0" />
                                Transmit Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-14 h-14 rounded-full bg-[var(--sc-green-50)] flex items-center justify-center border border-[var(--sc-green-200)] shadow-inner mx-auto mb-2">
                                <FileText className="w-7 h-7 text-[var(--sc-green-700)]" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-heading)]">Ticket #9402 Received</h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold max-w-xs mx-auto">
                                A confirmation has been sent to your secure inbox. You can track status in the Command Center.
                            </p>
                            <button
                                onClick={onClose}
                                className="bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-bg-hover)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] px-6 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-sm border-solid"
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
            className="w-full min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden font-sans rounded-2xl text-[var(--text-body)] shadow-sm border border-[var(--border-card)]"
            style={{ background: "linear-gradient(165deg, var(--bg-page) 0%, var(--bg-secondary-panel) 100%)" }}
        >
            {/* Subtle background pattern */}
            <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, var(--sc-purple-600) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--sc-purple-600) 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* HERO SECTION */}
            <div className="relative h-[28vh] flex flex-col items-center justify-center text-center p-6 border-b border-[var(--border-strong)] overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--sc-purple-650)]/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-xl w-full space-y-4">
                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[var(--text-heading)] to-[var(--text-secondary)] leading-none uppercase">
                            SYSTEM DOCUMENTATION
                        </h1>
                        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
                            Search the archives or browse protocols below.
                        </p>
                    </div>

                    <div className="relative max-w-md mx-auto w-full group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                            <Search className="w-4 h-4 text-[var(--icon-default)] group-focus-within:text-[var(--sc-purple-600)] transition-colors shrink-0" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl pl-11 pr-4 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-input-focus)] transition-all shadow-sm relative z-0"
                            placeholder="Type keywords (e.g. 'password', 'verification')..."
                        />
                        <SuggestionBox query={searchQuery} onSelect={setSearchQuery} />
                    </div>
                </div>
            </div>

            {/* Content Wrapper restricted to Pattern C max-w-2xl */}
            <div className="max-w-2xl mx-auto px-6 py-10 space-y-10 relative z-10 w-full">

                {/* CATEGORY GRID */}
                <div className="space-y-4 text-left">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 block">
                        Documentation Archives
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CATEGORIES.map((cat, i) => (
                            <div
                                key={i}
                                className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 shadow-sm hover:border-[var(--border-selected)] hover:-translate-y-0.5 transition-all duration-250 flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--sc-purple-50)] flex items-center justify-center border border-[var(--sc-purple-200)] shadow-xs">
                                        <cat.icon className="w-4 h-4 text-[var(--text-brand)] shrink-0" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <h3 className="text-sm font-bold text-[var(--text-heading)]">{cat.title}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">{cat.desc}</p>
                                    </div>
                                </div>
                                <button className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[var(--text-brand)] uppercase tracking-wider hover:underline border-none bg-transparent cursor-pointer select-none text-left">
                                    Browse Protocols →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ SECTION */}
                <div className="space-y-4 text-left">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 block">
                        Frequently Asked Questions
                    </span>
                    <div className="space-y-3">
                        {FAQS.map((faq, i) => {
                            const isOpen = openIndex === i;
                            return (
                                <div
                                    key={i}
                                    className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl overflow-hidden shadow-xs"
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                        className="w-full text-left p-4 flex justify-between items-center hover:bg-[var(--bg-card-hover)] transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                        <span className="text-xs font-bold text-[var(--text-heading)]">{faq.q}</span>
                                        {isOpen ? (
                                            <ChevronUp className="w-4 h-4 text-[var(--icon-strong)] shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-[var(--icon-default)] shrink-0" />
                                        )}
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary-panel)] overflow-hidden"
                                            >
                                                <div className="p-4 text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FOOTER CTA CALLOUT */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--sc-purple-50)] blur-3xl rounded-full pointer-events-none" />
                    <div className="space-y-1 relative z-10">
                        <h3 className="text-sm font-bold text-[var(--text-heading)] font-heading uppercase">STILL HAVE QUESTIONS?</h3>
                        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed font-medium">
                            If you're facing an active system anomaly, open a direct priority ticket to our engineering dispatch.
                        </p>
                    </div>
                    <div className="relative z-10 pt-2">
                        <button
                            onClick={() => setIsTicketOpen(true)}
                            className="bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg border-none shadow-sm cursor-pointer select-none"
                        >
                            Open Dispatch Ticket
                        </button>
                    </div>
                </div>

            </div>

            <TicketModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />
        </div>
    );
}
