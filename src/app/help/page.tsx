"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    ArrowLeft, Search, User, Shield, CreditCard, LifeBuoy, FileText, 
    Send, CheckCircle, Loader2, Sparkles, AlertCircle, PhoneCall, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitSupportTicket, SupportTicketInput, getUserSupportTickets } from "@/app/actions/support";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";

const KNOWLEDGE_ARTICLES = [
    {
        category: "Account & Profile",
        icon: User,
        color: "bg-indigo-50 text-indigo-600 border-indigo-100",
        articles: [
            { q: "How do I change my profile role?", a: "If you are currently a Candidate and wish to transition your role to a Recruiter, you must navigate to Settings -> Account Access and apply for the Recruiter role. You will be required to submit a verified corporate/work email address (public email providers like Gmail, Yahoo, or Outlook are restricted). Upon domain validation, your onboarding application will go to the Admin Panel queue for review. You will be promoted to Recruiter status once approved." },
            { q: "What is Ghost Mode?", a: "Ghost Mode allows you to browse other candidate profiles and job listings completely anonymously. No view telemetries will be dispatched while Ghost Mode is enabled." }
        ]
    },
    {
        category: "AI Interview",
        icon: Sparkles,
        color: "bg-violet-50 text-violet-600 border-violet-100",
        articles: [
            { q: "How does the AI grading system work?", a: "Our AI grades your interview based on code correctness, runtime efficiency, communication skills, and architectural reasoning. A complete feedback scorecard is generated immediately after completion." },
            { q: "Can I retake an interview session?", a: "Yes, you can retake active interview sessions. Your dashboard preserves your highest scorecard, but you can review transcripts of all historical runs." }
        ]
    },
    {
        category: "Billing & Credits",
        icon: CreditCard,
        color: "bg-emerald-50 text-emerald-600 border-emerald-100",
        articles: [
            { q: "How do I top up my credits?", a: "Navigate to the Credits tab in your sidebar. You can choose a subscription tier or top up immediately (5 credits for $1) via our secure billing portal." },
            { q: "Do unused credits expire?", a: "No! Credits bought via top-up never expire. Credits granted from subscription packages remain active for the duration of the billing cycle." }
        ]
    },
    {
        category: "Privacy & Security",
        icon: Shield,
        color: "bg-cyan-50 text-cyan-600 border-cyan-100",
        articles: [
            { q: "Is my personal data encrypted?", a: "Absolutely. SkilledCore uses industry-standard AES-256 encryption at rest and TLS 1.3 in transit to keep your profile data, sandboxed code, and scores secure." },
            { q: "How do I enable 2FA?", a: "Go to Settings -> Security tab, click Enable Two-Factor Authentication, and scan the QR code with your preferred authenticator app." }
        ]
    }
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);
    const [ticketDetails, setTicketDetails] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("General Support");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>("LOW");

    // Tickets telemetry states
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);

    const loadTickets = async () => {
        try {
            const res = await getUserSupportTickets();
            if (res.success) {
                setMyTickets(res.tickets);
            }
        } catch (e) {
            console.error("[Help Page] Failed to fetch tickets:", e);
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, [ticketSubmitted]);

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !subject || !description) {
            toast.error("Please fill in all ticket details.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await submitSupportTicket({
                name,
                email,
                subject,
                category,
                description,
                severity
            });

            if (res.success) {
                setTicketSubmitted(true);
                setTicketDetails(res);
                toast.success("Support Ticket Raised!");
                
                // Clear form
                setName("");
                setEmail("");
                setSubject("");
                setDescription("");
                setSeverity("LOW");
            } else {
                toast.error(res.error || "Failed to submit ticket.");
            }
        } catch (error) {
            toast.error("Pipeline failure raising ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Simple search filtering
    const filteredCategories = KNOWLEDGE_ARTICLES.filter(cat => 
        cat.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.articles.some(art => 
            art.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
            art.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <AppShell>
            <div className="space-y-12">

                {/* Hero Header */}
                <div className="text-center max-w-2xl mx-auto space-y-6">
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight leading-none">
                        How can we <span className="text-indigo-600">help</span> you?
                    </h1>
                    <p className="text-slate-500 font-medium">Search our knowledge base or submit a high-priority support ticket below.</p>
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm font-medium"
                        />
                    </div>
                </div>

                {/* Knowledge Accordion / Search Results */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 px-1">Self-Service Knowledge Hub</h2>
                        <div className="space-y-4">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((cat, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                            <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm", cat.color)}>
                                                <cat.icon className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-base">{cat.category}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {cat.articles.map((art, aIdx) => {
                                                const accordionId = `${idx}-${aIdx}`;
                                                const isOpen = activeAccordion === accordionId;
                                                return (
                                                    <div key={aIdx} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                                        <button 
                                                            onClick={() => setActiveAccordion(isOpen ? null : accordionId)}
                                                            className="w-full text-left font-bold text-sm text-slate-800 hover:text-indigo-600 transition-colors flex items-center justify-between py-1"
                                                        >
                                                            <span>{art.q}</span>
                                                            <span className="text-slate-400 font-normal">{isOpen ? "−" : "+"}</span>
                                                        </button>
                                                        <AnimatePresence initial={false}>
                                                            {isOpen && (
                                                                <motion.div 
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-medium">
                                                                        {art.a}
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 italic">
                                    No matching knowledge articles found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Support Ticket Console */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 px-1">Support Ticket Console</h2>
                        
                        <AnimatePresence mode="wait">
                            {!ticketSubmitted ? (
                                <motion.form
                                    key="ticket-form"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    onSubmit={handleSubmitTicket}
                                    className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Name</label>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Your Name"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-semibold shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                                            <input 
                                                type="email" 
                                                required
                                                placeholder="you@domain.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-semibold shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                                            <select 
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-semibold shadow-sm"
                                            >
                                                <option>Account & Profile</option>
                                                <option>AI Interview</option>
                                                <option>Billing & Credits</option>
                                                <option>Security & Privacy</option>
                                                <option>General Support</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Severity</label>
                                            <select 
                                                value={severity}
                                                onChange={e => setSeverity(e.target.value as any)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-bold shadow-sm"
                                            >
                                                <option value="LOW">LOW</option>
                                                <option value="MEDIUM">MEDIUM</option>
                                                <option value="HIGH">HIGH</option>
                                                <option value="CRITICAL">CRITICAL</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="What's going on?"
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-semibold shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                        <textarea 
                                            rows={4}
                                            required
                                            placeholder="Explain the anomaly..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-semibold resize-none shadow-sm"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> DISPATCHING UPLINK...
                                            </>
                                        ) : (
                                            <>
                                                RAISE SUPPORT TICKET <Send className="w-4 h-4 text-white" />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success-card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                                    
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900">Uplink Confirmed!</h3>
                                        <p className="text-sm text-slate-500 font-medium">Ticket <strong>#{ticketDetails?.ticketId}</strong> has been logged in our mainframe.</p>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-3">
                                        <div className="flex items-start gap-2 text-xs">
                                            <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-800">Email Notification Dispatched</p>
                                                <p className="text-slate-500 font-medium mt-0.5">A complete diagnostic summary has been sent to our core queue: <span className="font-semibold text-slate-700">support@skilledcore.com</span>.</p>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-200" />

                                        <div className="flex items-start gap-2 text-xs">
                                            <PhoneCall className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-800">WhatsApp Alert Dispatched</p>
                                                <p className="text-slate-500 font-medium mt-0.5">Secure SMS/WhatsApp notifications were sent directly to the personal numbers of our duty roster: <span className="font-semibold text-slate-700">{ticketDetails?.notifiedContacts?.join(", ")}</span> for immediate triage.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setTicketSubmitted(false)}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm border border-slate-200"
                                    >
                                        Submit Another Ticket
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* YOUR ACTIVE INQUIRIES TERMINAL */}
                {myTickets.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Your Active Support Uplinks</h3>
                                <p className="text-xs text-slate-500 font-medium">Real-time connection telemetry to our Core Operations queue.</p>
                            </div>
                            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-650 px-2.5 py-1.5 rounded-full border border-indigo-100">
                                ACTIVE TICKETS: {myTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'DISMISSED').length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {myTickets.map((ticket) => {
                                const isPending = ticket.status === 'PENDING';
                                const isReviewing = ticket.status === 'UNDER_REVIEW';
                                const isResolved = ticket.status === 'RESOLVED';
                                
                                return (
                                    <div key={ticket.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 max-w-xl">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-mono font-bold bg-slate-200/60 text-slate-650 px-2 py-0.5 rounded">
                                                    {ticket.id}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 font-mono">
                                                    {ticket.category}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-mono font-black px-1.5 py-0.5 rounded border leading-none",
                                                    ticket.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    ticket.severity === 'HIGH' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    ticket.severity === 'MEDIUM' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                )}>
                                                    {ticket.severity}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900">{ticket.subject}</h4>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {ticket.details?.description || "No description provided."}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 self-start md:self-auto">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">Dispatched</p>
                                                <p className="text-xs font-semibold text-slate-600">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm",
                                                isPending ? "bg-slate-100 text-slate-650 border-slate-200" :
                                                isReviewing ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" :
                                                isResolved ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                "bg-zinc-100 text-zinc-650 border-zinc-200"
                                            )}>
                                                {isPending && (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-450" /> PENDING TRIAGE
                                                    </>
                                                )}
                                                {isReviewing && (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> TEAM REVIEWING
                                                    </>
                                                )}
                                                {isResolved && "✅ COMPLETED / RESOLVED"}
                                                {ticket.status === 'DISMISSED' && "📋 DISMISSED"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* Footer Info */}
                <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-slate-400 font-medium">Need immediate system status?</p>
                    <a href="mailto:support@skilledcore.com" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-colors mt-1 block">
                        support@skilledcore.com
                    </a>
                </div>

            </div>
        </AppShell>
    );
}
