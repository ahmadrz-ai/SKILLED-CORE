"use client";

import { useState, useEffect } from "react";
import {
    Activity, Shield, AlertTriangle, CheckCircle, XCircle, FileText, Trash2, Ban
} from "lucide-react";
import { toast } from "sonner";
import { getDashboardData, updateVerificationStatus, updateReportStatus } from "./actions";
import StorageBrowser from "@/components/admin/StorageBrowser";

export default function AdminDashboard() {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ users: 0, jobs: 0, applications: 0, posts: 0 });
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const res = await getDashboardData();
            if (res.success && res.data) {
                setVerifications(res.data.verifications);
                setReports(res.data.reports);
                setStats(res.data.stats);
                setFiles([...res.data.files]);
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
            <div>
                <h1 className="text-3xl font-heading font-black text-white tracking-tight">
                    COMMAND <span className="text-red-600">OVERVIEW</span>
                </h1>
                <p className="text-zinc-500 font-mono text-xs">
                    System Time: {new Date().toISOString()} | Node: ALPHA-1
                </p>
            </div>

            {/* Storage Intelligence */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-violet-500" />
                    <h2 className="text-xl font-bold text-white">SYSTEM INTELLIGENCE</h2>
                </div>
                {loading ? (
                    <div className="h-[200px] flex items-center justify-center border border-white/5 rounded-xl bg-zinc-900/30">
                        <p className="font-mono text-zinc-500 animate-pulse">ESTABLISHING DATALINK...</p>
                    </div>
                ) : (
                    <StorageBrowser files={files} dbStats={stats} />
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Verification Queue */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-500" />
                            VERIFICATION QUEUE
                        </h2>
                        <span className="text-xs font-mono text-zinc-500">{verifications.length} PENDING</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {verifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 italic text-sm">No pending requests.</div>
                        ) : verifications.map((item) => (
                            <div key={item.id} className="p-6 flex items-start justify-between group hover:bg-white/5 transition-colors">
                                <div>
                                    <h3 className="font-bold text-white text-sm">{item.company}</h3>
                                    <p className="text-xs text-zinc-500 mb-2">{item.email}</p>
                                    <div className="text-xs text-blue-400 flex items-center gap-1 font-mono">
                                        <FileText className="w-3 h-3" /> {item.doc}
                                    </div>
                                    <span className="text-[10px] text-zinc-600 uppercase mt-1 block">{item.type}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleVerify(item.id, true)}
                                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors border border-green-500/20"
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleVerify(item.id, false)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                                        title="Reject"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Moderation Stream */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            MODERATION STREAM
                        </h2>
                        <span className="text-xs font-mono text-zinc-500">{reports.length} ACTIVE</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {reports.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 italic text-sm">All sectors clear.</div>
                        ) : reports.map((report) => (
                            <div key={report.id} className="p-6 space-y-3 hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                        ${report.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {report.reason}
                                    </span>
                                    <span className="text-xs text-zinc-600 font-mono">
                                        Reported by {report.reporter}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-300 bg-black/40 p-3 rounded border border-white/5 font-mono truncate">
                                    "{report.content}"
                                </p>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        onClick={() => handleModeration(report.id, 'DISMISSED')}
                                        className="text-xs text-zinc-500 hover:text-white px-3 py-1.5"
                                    >
                                        Ignore
                                    </button>
                                    <button
                                        onClick={() => handleModeration(report.id, 'RESOLVED')}
                                        className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 px-3 py-1.5 rounded flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" /> Resolve
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
