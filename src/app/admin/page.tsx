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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-default pb-6">
                <div>
                    <h1 className="text-3xl font-sans font-extrabold text-text-heading tracking-tight">
                        Console Overview
                    </h1>
                    <p className="text-text-secondary font-sans text-sm mt-1">
                        Review system metrics, manage database assets, and resolve verification requests.
                    </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-bg-secondary-panel border border-border-default w-fit">
                    <p className="text-xs text-text-secondary font-mono">
                        System Time: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Storage Intelligence */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-sc-purple-600" />
                    <h2 className="text-lg font-bold text-text-heading tracking-tight font-sans">Storage Intelligence</h2>
                </div>
                {loading ? (
                    <div className="h-[250px] flex flex-col gap-3 items-center justify-center border border-border-default rounded-xl bg-bg-secondary-panel">
                        <Loader2 className="w-8 h-8 text-sc-purple-600 animate-spin" />
                        <p className="font-sans text-xs text-text-secondary font-medium">Fetching dashboard telemetry...</p>
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
                <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden flex flex-col h-full shadow-sc-card">
                    <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-secondary-panel">
                        <h2 className="font-bold text-text-heading flex items-center gap-2 font-sans tracking-tight">
                            <Shield className="w-4 h-4 text-sc-purple-500" />
                            Verification Queue
                        </h2>
                        <span className="text-xs font-mono text-text-secondary px-2 py-0.5 rounded bg-bg-card border border-border-default">{verifications.length} PENDING</span>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {verifications.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary italic text-sm">No pending requests.</div>
                        ) : verifications.map((item) => (
                            <div key={item.id} className="p-6 flex items-start justify-between group hover:bg-bg-card-hover transition-colors">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-text-heading text-sm">{item.company}</h3>
                                    <p className="text-xs text-text-secondary">{item.email}</p>
                                    <div className="text-xs text-sc-purple-600 flex items-center gap-1.5 font-sans pt-1">
                                        <FileText className="w-3.5 h-3.5 text-sc-purple-400" /> 
                                        <a href={item.doc} target="_blank" rel="noopener noreferrer" className="hover:underline transition-all">
                                            View Verification Doc
                                        </a>
                                    </div>
                                    <span className="text-[10px] text-text-secondary font-mono tracking-wider uppercase mt-1 block bg-bg-secondary-panel border border-border-default px-1.5 py-0.5 rounded w-fit">{item.type}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleVerify(item.id, true)}
                                        className="p-2 bg-sc-green-50 hover:bg-sc-green-100 text-sc-green-700 rounded-lg transition-colors border border-sc-green-100"
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleVerify(item.id, false)}
                                        className="p-2 bg-sc-red-50 hover:bg-sc-red-100 text-text-error rounded-lg transition-colors border border-sc-red-100"
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
                <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden flex flex-col h-full shadow-sc-card">
                    <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-secondary-panel">
                        <h2 className="font-bold text-text-heading flex items-center gap-2 font-sans tracking-tight">
                            <AlertTriangle className="w-4 h-4 text-sc-amber-600" />
                            Moderation Stream
                        </h2>
                        <span className="text-xs font-mono text-text-secondary px-2 py-0.5 rounded bg-bg-card border border-border-default">{reports.length} ACTIVE</span>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {reports.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary italic text-sm">All sectors clear. No reports.</div>
                        ) : reports.map((report) => (
                            <div key={report.id} className="p-6 space-y-3 hover:bg-bg-card-hover transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                        ${report.severity === 'CRITICAL' ? 'bg-sc-red-50 text-text-error border-sc-red-100' :
                                            report.severity === 'HIGH' ? 'bg-sc-amber-50 text-sc-amber-700 border-sc-amber-100' :
                                                'bg-bg-secondary-panel text-text-secondary border-border-default'}`}>
                                        {report.reason}
                                    </span>
                                    <span className="text-xs text-text-secondary font-sans">
                                        Reported by <span className="font-semibold text-text-body">{report.reporter}</span>
                                    </span>
                                </div>
                                <p className="text-sm text-text-body bg-bg-secondary-panel p-3 rounded border border-border-subtle font-mono truncate">
                                    "{report.content}"
                                </p>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        onClick={() => handleModeration(report.id, 'DISMISSED')}
                                        className="text-xs text-text-secondary hover:text-text-heading px-3 py-1.5 font-medium transition-all"
                                    >
                                        Ignore
                                    </button>
                                    <button
                                        onClick={() => handleModeration(report.id, 'RESOLVED')}
                                        className="text-xs bg-sc-red-50 hover:bg-sc-red-100 text-text-error border border-sc-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all"
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
