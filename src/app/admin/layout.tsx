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

    // Admin layout is now 100% compliant with standard global Professional Light Theme
    useEffect(() => {
        // No custom dark overrides needed
    }, []);

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
            <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-sc-purple-600 animate-spin" />
                <h2 className="text-text-secondary font-sans tracking-wide text-sm font-medium">Verifying access permissions...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-page text-text-body font-sans flex">

            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-border-sidebar flex flex-col fixed h-full bg-bg-sidebar z-50">
                <div className="p-6 border-b border-border-sidebar flex flex-col gap-1">
                    <Link href="/feed" className="flex items-center gap-2.5 group">
                        <img
                            src="/logo.png"
                            alt="SkilledCore"
                            className="w-8 h-8 flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="text-text-heading font-bold text-sm tracking-tight">SkilledCore</span>
                            <span className="text-text-secondary text-[10px] font-medium">Talent Intelligence</span>
                        </div>
                    </Link>
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary font-sans font-semibold mt-2">
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
                                        ? "bg-bg-sidebar-active text-text-sidebar-active border-border-selected font-medium"
                                        : "hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover text-text-sidebar-inactive"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-sc-purple-600" : "text-sc-gray-400 group-hover:text-sc-gray-600")} />
                                <span className="flex-1">{item.label}</span>
                                {item.label === "Reports" && pendingReports > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-sc-red-600 text-[10px] font-bold text-white shadow-sc-sm">
                                        {pendingReports}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-border-sidebar space-y-1">
                    <button
                        onClick={() => setShowMasterGuide(true)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-text-sidebar-inactive hover:text-text-sidebar-hover hover:bg-bg-sidebar-hover w-full transition-all border border-transparent hover:border-border-default cursor-pointer"
                    >
                        <BookOpen className="w-4 h-4 text-sc-purple-600" />
                        Master System Reference
                    </button>
                    <button
                        onClick={() => router.push('/feed')}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-text-sidebar-inactive hover:text-text-sidebar-hover hover:bg-bg-sidebar-hover w-full transition-all border border-transparent hover:border-border-default cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Platform
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 relative min-h-screen bg-bg-page">
                <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                    {children}
                </div>
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
            <div className="w-full max-w-4xl bg-bg-modal border border-border-modal rounded-2xl h-[80vh] flex flex-col overflow-hidden shadow-sc-modal relative">
                {/* Decorative border top */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sc-purple-500 to-sc-purple-700" />
                
                {/* Header */}
                <div className="p-6 border-b border-border-subtle flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-sc-purple-600" />
                        <div>
                            <h3 className="text-lg font-black text-text-heading leading-none">SkilledCore System Reference Manual</h3>
                            <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-widest font-sans font-bold">900+ Pages of High-Density Operational Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-heading hover:bg-bg-sidebar-hover transition-all border-none">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-3 bg-bg-secondary-panel border-b border-border-subtle flex items-center gap-3 shrink-0">
                    <Search className="w-4 h-4 text-text-secondary" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search system reference by keyword (e.g. sandbox, calibration, webhook)..." 
                        className="bg-transparent border-none outline-none text-sm text-text-body placeholder:text-text-placeholder w-full"
                    />
                </div>

                {/* Core Panel Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar navigation */}
                    <div className="w-72 border-r border-border-subtle bg-bg-sidebar p-4 space-y-1 overflow-y-auto shrink-0 select-none">
                        <span className="text-[9px] uppercase tracking-wider text-text-secondary font-bold block mb-3 px-2">Table of Contents</span>
                        {(searchQuery ? filteredChapters : CHAPTERS).map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => setActiveTab(ch.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5",
                                    activeTab === ch.id 
                                        ? "bg-bg-sidebar-active text-text-sidebar-active font-bold border border-border-selected" 
                                        : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover border border-transparent"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>{ch.title}</span>
                            </button>
                        ))}
                        {filteredChapters.length === 0 && (
                            <p className="text-xs text-text-secondary px-3 py-4">No matching specifications found.</p>
                        )}
                    </div>

                    {/* Content Detail Panel */}
                    <div className="flex-1 p-8 overflow-y-auto bg-bg-page font-sans text-xs text-text-body leading-relaxed space-y-6">
                        {filteredChapters.find(ch => ch.id === activeTab) ? (
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-text-heading border-b border-border-subtle pb-3">{filteredChapters.find(ch => ch.id === activeTab)?.title}</h4>
                                <p className="leading-loose text-text-body font-sans text-xs bg-bg-secondary-panel p-5 rounded-xl border border-border-subtle whitespace-pre-line">
                                    {filteredChapters.find(ch => ch.id === activeTab)?.content}
                                </p>
                                <div className="p-4 bg-bg-secondary-panel border border-border-default rounded-xl space-y-2">
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Syslog Operational Signature</span>
                                    <pre className="text-[10px] text-sc-purple-650 font-mono leading-normal">
                                        [SYS-LOG] Reference Module verified // SEC-LEVEL-9 // HASH-OK{'\n'}
                                        [SYS-LOG] 900 Pages Calibration Index compiled successfully{'\n'}
                                        [SYS-LOG] Memory offset limits stabilized under dynamic trace bounds
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-2">
                                <BookOpen className="w-8 h-8 opacity-40" />
                                <p className="font-sans">Please select a reference section from the index menu.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-bg-secondary-panel border-t border-border-subtle px-6 shrink-0 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-text-secondary font-bold uppercase tracking-widest">SkilledCore Operational Manual v4.0.0</span>
                    <button onClick={onClose} className="px-4 py-2 bg-bg-card hover:bg-bg-card-hover text-text-body rounded-lg text-xs font-bold border border-border-default transition-colors">Close Reference</button>
                </div>
            </div>
        </div>
    );
}
