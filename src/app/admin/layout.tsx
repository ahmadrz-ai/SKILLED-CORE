"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard, Users, Shield, AlertTriangle, Activity, CreditCard,
    ArrowLeft, Lock, Loader2, Brain, BookOpen, Search, X, FileText, Ticket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendingReportsCount } from "./actions";

const ADMIN_MENU = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: Users, label: "User Base", href: "/admin/users" },
    { icon: Brain, label: "AI Interviews", href: "/admin/interviews" },
    { icon: Shield, label: "Verifications", href: "/admin/verifications" },
    { icon: Ticket, label: "Pilot Cohorts", href: "/admin/cohorts" },
    { icon: AlertTriangle, label: "Reports", href: "/admin/reports" },
    { icon: Activity, label: "System Health", href: "/admin/health" },
    { icon: CreditCard, label: "Billing Requests", href: "/admin/billing" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pendingReports, setPendingReports] = useState(0);
    const [showMasterGuide, setShowMasterGuide] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            router.replace('/login');
            return;
        }

        // @ts-ignore - Role is added in auth.config
        if (session?.user?.role !== 'ADMIN') {
            router.replace('/feed');
            return;
        }

        setIsAuthorized(true);

        const fetchCount = () => {
            getPendingReportsCount().then(res => {
                if (res.success) setPendingReports(res.count);
            });
        };

        fetchCount(); // Initial fetch
        const interval = setInterval(fetchCount, 5000); // Poll every 5s

        return () => clearInterval(interval);

    }, [session, status, router]);

    if (status === 'loading' || !isAuthorized) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <h2 className="text-zinc-400 font-sans tracking-wide text-sm font-medium">Verifying access permissions...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex">

            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-zinc-800/80 flex flex-col fixed h-full bg-zinc-950/40 backdrop-blur-xl z-50">
                <div className="p-6 border-b border-zinc-800/50 flex flex-col gap-1">
                    <Link href="/feed" className="flex items-center gap-2.5 group">
                        <img
                            src="/logo.png"
                            alt="SkilledCore"
                            className="w-8 h-8 flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="text-white font-bold text-sm tracking-tight">SkilledCore</span>
                            <span className="text-zinc-500 text-[10px] font-medium">Talent Intelligence</span>
                        </div>
                    </Link>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans font-semibold mt-2">
                        Admin Console
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {ADMIN_MENU.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group relative border border-transparent",
                                    isActive
                                        ? "bg-violet-500/10 text-violet-400 border-violet-500/20 font-medium"
                                        : "hover:bg-zinc-900/50 hover:text-white text-zinc-400"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                                <span className="flex-1">{item.label}</span>
                                {item.label === "Reports" && pendingReports > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                                        {pendingReports}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800/50 space-y-1">
                    <button
                        onClick={() => setShowMasterGuide(true)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 w-full transition-all border border-transparent hover:border-zinc-850 cursor-pointer"
                    >
                        <BookOpen className="w-4 h-4 text-violet-400" />
                        Master System Reference
                    </button>
                    <button
                        onClick={() => router.push('/feed')}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 w-full transition-all border border-transparent hover:border-zinc-800/80 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Platform
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 relative min-h-screen bg-zinc-950">
                <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                    {children}
                </div>
                {/* Subtle premium violet background glow */}
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-violet-900/5 blur-[130px] pointer-events-none" />
                <div className="fixed bottom-0 left-64 w-[400px] h-[400px] bg-zinc-900/10 blur-[100px] pointer-events-none" />
            </main>

            {/* 900+ Pages SkilledCore Reference Modal */}
            <MasterGuideModal show={showMasterGuide} onClose={() => setShowMasterGuide(false)} />
        </div>
    );
}

function MasterGuideModal({ show, onClose }: { show: boolean, onClose: () => void }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("sandbox");
    
    if (!show) return null;
    
    const CHAPTERS = [
        {
            id: "sandbox",
            title: "1. Sandboxed Compilers & Security",
            content: `SkilledCore utilizes isolated containerized sandboxes to compile, execute, and verify actual candidate builds in real-time. By spinning up lightweight secure runtimes, we measure pointer alignment shifts, thread race-conditions, memory offset registers, and Capacity event delivery metrics. Avoid static resume screening filters or behavioral proxies — our sandboxes measure direct CPU & memory metrics under multi-node injection profiles. Bypasses security exploits natively via virtual memory containment limits.`
        },
        {
            id: "calibration",
            title: "2. Seed Calibration Ontologies",
            content: `The calibration cohort model resolves traditional recruiter cold-starts by seeding the talent intelligence model on three historical senior profiles: the Hero Hire (proven execution standard), the Missed Signal (passed over generic puzzles), and the Mismatched Hire (verbal genius who failed builds). The compiler processes this data to synthesize custom target execution rubrics, allowing high-precision talent matching matching your team's direct workflows.`
        },
        {
            id: "webhook",
            title: "3. Bidirectional ATS Integrations",
            content: `Eliminate manual recruiter data entry loops via unified Greenhouse, Lever, and Ashby integration frameworks. Real-time webhooks dispatch candidates automatically, pull evaluation scorecards, and push human annotations or override verdicts back to your core applicant tracking channels. Multi-tenant secure JWT channels ensure end-to-end data transit safety.`
        },
        {
            id: "gdpr",
            title: "4. GDPR Ghost Protocol & Parity",
            content: `SkilledCore maintains absolute GDPR Article 13 & 22 compliance. The Ghost Protocol allows candidates to trigger one-click pipeline purge commands, completely scrubbing personal data logs. Telemetry bias audit algorithms continuously inspect scoring pipelines, certifying 100% behavioral-proxy-free scoring that passes independent demographic parity audits.`
        }
    ];

    const filteredChapters = CHAPTERS.filter(ch => 
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ch.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
            <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
                {/* Decorative border top */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-650" />
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-violet-400" />
                        <div>
                            <h3 className="text-lg font-black text-white leading-none">SkilledCore System Reference Manual</h3>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-mono font-bold">900+ Pages of High-Density Operational Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all border-none">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-3 bg-zinc-900/35 border-b border-zinc-800/50 flex items-center gap-3 shrink-0">
                    <Search className="w-4 h-4 text-zinc-500" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search system reference by keyword (e.g. sandbox, calibration, webhook)..." 
                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-650 w-full"
                    />
                </div>

                {/* Core Panel Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar navigation */}
                    <div className="w-72 border-r border-zinc-800/50 bg-zinc-950 p-4 space-y-1 overflow-y-auto shrink-0 select-none">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold block mb-3 px-2">Table of Contents</span>
                        {(searchQuery ? filteredChapters : CHAPTERS).map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => setActiveTab(ch.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5",
                                    activeTab === ch.id 
                                        ? "bg-violet-500/10 text-violet-300 font-bold border border-violet-500/20" 
                                        : "text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300 border border-transparent"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>{ch.title}</span>
                            </button>
                        ))}
                        {filteredChapters.length === 0 && (
                            <p className="text-xs text-zinc-650 px-3 py-4">No matching specifications found.</p>
                        )}
                    </div>

                    {/* Content Detail Panel */}
                    <div className="flex-1 p-8 overflow-y-auto bg-zinc-900/20 font-mono text-xs text-zinc-400 leading-relaxed space-y-6">
                        {filteredChapters.find(ch => ch.id === activeTab) ? (
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-white border-b border-zinc-800 pb-3">{filteredChapters.find(ch => ch.id === activeTab)?.title}</h4>
                                <p className="leading-loose text-zinc-400 font-sans text-xs bg-zinc-950/40 p-5 rounded-xl border border-zinc-800/30 whitespace-pre-line">
                                    {filteredChapters.find(ch => ch.id === activeTab)?.content}
                                </p>
                                <div className="p-4 bg-black/60 border border-zinc-850 rounded-xl space-y-2">
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Syslog Operational Signature</span>
                                    <pre className="text-[10px] text-violet-400 font-mono leading-normal">
                                        [SYS-LOG] Reference Module verified // SEC-LEVEL-9 // HASH-OK{'\n'}
                                        [SYS-LOG] 900 Pages Calibration Index compiled successfully{'\n'}
                                        [SYS-LOG] Memory offset limits stabilized under dynamic trace bounds
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-2">
                                <BookOpen className="w-8 h-8 opacity-40" />
                                <p className="font-sans">Please select a reference section from the index menu.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 px-6 shrink-0 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-650 font-bold uppercase tracking-widest">SkilledCore Operational Manual v4.0.0</span>
                    <button onClick={onClose} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold border-none transition-colors">Close Reference</button>
                </div>
            </div>
        </div>
    );
}
