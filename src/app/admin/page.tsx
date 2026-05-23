"use client";

import { useState, useEffect } from "react";
import {
    Activity, Shield, AlertTriangle, CheckCircle, XCircle, FileText, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { getDashboardData, updateVerificationStatus, updateReportStatus } from "./actions";
import StorageBrowser from "@/components/admin/StorageBrowser";

export default function AdminDashboard() {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ users: 0, jobs: 0, applications: 0, posts: 0 });
    const [uploadthingFiles, setUploadthingFiles] = useState<any[]>([]);
    const [cloudinaryFiles, setCloudinaryFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const res = await getDashboardData();
            if (res.success && res.data) {
                setVerifications(res.data.verifications);
                setReports(res.data.reports);
                setStats(res.data.stats);
                setUploadthingFiles([...res.data.uploadthingFiles]);
                setCloudinaryFiles([...res.data.cloudinaryFiles]);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleVerify = async (id: string, approved: boolean) => {
        const status = approved ? 'APPROVED' : 'REJECTED';
        const res = await updateVerificationStatus(id, status);

        if (res.success) {
            setVerifications(prev => prev.filter(v => v.id !== id));
            toast[approved ? 'success' : 'error'](res.message);
        } else {
            toast.error(res.message);
        }
    };

    const handleModeration = async (id: string, action: 'RESOLVED' | 'DISMISSED') => {
        const res = await updateReportStatus(id, action);
        if (res.success) {
            setReports(prev => prev.filter(r => r.id !== id));
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/40 pb-6">
                <div>
                    <h1 className="text-3xl font-sans font-extrabold text-white tracking-tight">
                        Console Overview
                    </h1>
                    <p className="text-zinc-400 font-sans text-sm mt-1">
                        Review system metrics, manage database assets, and resolve verification requests.
                    </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80 w-fit">
                    <p className="text-xs text-zinc-500 font-mono">
                        System Time: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Storage Intelligence */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-violet-500" />
                    <h2 className="text-lg font-bold text-white tracking-tight font-sans">Storage Intelligence</h2>
                </div>
                {loading ? (
                    <div className="h-[250px] flex flex-col gap-3 items-center justify-center border border-zinc-800/80 rounded-xl bg-zinc-900/20 backdrop-blur-md">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        <p className="font-sans text-xs text-zinc-400 font-medium">Fetching dashboard telemetry...</p>
                    </div>
                ) : (
                    <StorageBrowser 
                        uploadthingFiles={uploadthingFiles} 
                        cloudinaryFiles={cloudinaryFiles} 
                        dbStats={stats} 
                    />
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Verification Queue */}
                <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col h-full backdrop-blur-md">
                    <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-900/30">
                        <h2 className="font-bold text-white flex items-center gap-2 font-sans tracking-tight">
                            <Shield className="w-4 h-4 text-violet-400" />
                            Verification Queue
                        </h2>
                        <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-900/50 border border-zinc-800/60">{verifications.length} PENDING</span>
                    </div>
                    <div className="divide-y divide-zinc-800/60">
                        {verifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 italic text-sm">No pending requests.</div>
                        ) : verifications.map((item) => (
                            <div key={item.id} className="p-6 flex items-start justify-between group hover:bg-zinc-900/30 transition-colors">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-white text-sm">{item.company}</h3>
                                    <p className="text-xs text-zinc-400">{item.email}</p>
                                    <div className="text-xs text-violet-400 flex items-center gap-1.5 font-sans pt-1">
                                        <FileText className="w-3.5 h-3.5 text-violet-400/70" /> 
                                        <a href={item.doc} target="_blank" rel="noopener noreferrer" className="hover:underline transition-all">
                                            View Verification Doc
                                        </a>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-1 block bg-zinc-900/40 border border-zinc-800/40 px-1.5 py-0.5 rounded w-fit">{item.type}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleVerify(item.id, true)}
                                        className="p-2 bg-green-500/10 hover:bg-green-500/25 text-green-400 rounded-lg transition-colors border border-green-500/20"
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleVerify(item.id, false)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                        title="Reject"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Moderation Stream */}
                <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col h-full backdrop-blur-md">
                    <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-900/30">
                        <h2 className="font-bold text-white flex items-center gap-2 font-sans tracking-tight">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            Moderation Stream
                        </h2>
                        <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-900/50 border border-zinc-800/60">{reports.length} ACTIVE</span>
                    </div>
                    <div className="divide-y divide-zinc-800/60">
                        {reports.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 italic text-sm">All sectors clear. No reports.</div>
                        ) : reports.map((report) => (
                            <div key={report.id} className="p-6 space-y-3 hover:bg-zinc-900/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                        ${report.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                        {report.reason}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-sans">
                                        Reported by <span className="font-semibold text-zinc-400">{report.reporter}</span>
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-300 bg-zinc-950/40 p-3 rounded border border-zinc-800/40 font-mono truncate">
                                    "{report.content}"
                                </p>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        onClick={() => handleModeration(report.id, 'DISMISSED')}
                                        className="text-xs text-zinc-500 hover:text-white px-3 py-1.5 font-medium transition-all"
                                    >
                                        Ignore
                                    </button>
                                    <button
                                        onClick={() => handleModeration(report.id, 'RESOLVED')}
                                        className="text-xs bg-red-900/10 hover:bg-red-900/25 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
