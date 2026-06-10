
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Report, User } from '@prisma/client';
import {
    AlertTriangle, CheckCircle, XCircle, Shield, MessageSquare,
    ChevronDown, ChevronUp, Bug, Lightbulb, FileText, ArrowUpRight
} from 'lucide-react';
import { updateReportStatus, startReviewingReport, getAdminReportAlerts } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { REPORT_STATUSES, normalizeReportStatus, reportStatusLabel, reportStatusClasses, type ReportStatusKey } from '@/lib/reportStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageLightbox } from '@/components/admin/ImageLightbox';

type ExtendedReport = Report & {
    reporter: User;
    reportedUser: User | null;
};

interface ReportsTableProps {
    reports: ExtendedReport[];
}

export default function ReportsTable({ reports }: ReportsTableProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<'ALL' | ReportStatusKey>('ALL');
    // Unread USER thread replies per report (live), so the queue shows which
    // tickets a user has messaged that support hasn't opened yet.
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchAlerts = () => {
            getAdminReportAlerts().then(res => {
                if (res.success) setUnreadCounts(res.unreadCounts || {});
            });
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpand = async (id: string) => {
        const newSet = new Set(expandedIds);
        const willExpand = !newSet.has(id);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);

        if (willExpand) {
            const report = reports.find(r => r.id === id);
            if (report && report.status === 'PENDING') {
                try {
                    report.status = 'UNDER_REVIEW';
                    await startReviewingReport(id);
                    toast.info(`Inquiry #${id.substring(0, 8)} is now marked as UNDER REVIEW`);
                } catch (e) {
                    console.error("Failed to mark under review:", e);
                }
            }
        }
    };

    const handleSetStatus = async (reportId: string, status: ReportStatusKey) => {
        setIsLoading(reportId);
        const result = await updateReportStatus(reportId, status);
        setIsLoading(null);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
    };

    const visibleReports = statusFilter === 'ALL'
        ? reports
        : reports.filter(r => normalizeReportStatus(r.status) === statusFilter);

    const statusCount = (key: ReportStatusKey) => reports.filter(r => normalizeReportStatus(r.status) === key).length;

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-sc-purple-600 bg-sc-purple-50 border-sc-purple-200';
        }
    };

    const getTypeIcon = (type: string) => {
        if (type === 'SYSTEM_BUG') return <Bug className="w-4 h-4" />;
        if (type === 'SUGGESTION') return <Lightbulb className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">MODERATION QUEUE</span>
                </div>
                <div className="text-xs text-text-tertiary font-mono">
                    SHOWING: {visibleReports.length} / {reports.length}
                </div>
            </div>

            {/* Status filter / sort */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setStatusFilter('ALL')}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                        statusFilter === 'ALL' ? "bg-sc-purple-600 text-white border-sc-purple-600" : "bg-bg-card text-text-secondary border-border-default hover:bg-bg-sidebar-hover"
                    )}
                >
                    All <span className="opacity-70">({reports.length})</span>
                </button>
                {REPORT_STATUSES.map(s => (
                    <button
                        key={s.key}
                        onClick={() => setStatusFilter(s.key)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                            statusFilter === s.key ? "bg-sc-purple-600 text-white border-sc-purple-600" : "bg-bg-card text-text-secondary border-border-default hover:bg-bg-sidebar-hover"
                        )}
                    >
                        {s.label} <span className="opacity-70">({statusCount(s.key)})</span>
                    </button>
                ))}
            </div>

            <div className="bg-bg-secondary-panel border border-border-subtle rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border-subtle bg-bg-secondary-panel">
                                <th className="p-4 font-medium text-text-secondary w-10"></th>
                                <th className="p-4 font-medium text-text-secondary">Type</th>
                                <th className="p-4 font-medium text-text-secondary">Severity</th>
                                <th className="p-4 font-medium text-text-secondary">Reporter</th>
                                <th className="p-4 font-medium text-text-secondary">Subject</th>
                                <th className="p-4 font-medium text-text-secondary text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleReports.map((report) => {
                                const isExpanded = expandedIds.has(report.id);
                                const unread = unreadCounts[report.id] || 0;
                                let details: any = {};
                                try {
                                    details = JSON.parse(report.adminNotes || '{}');
                                } catch (e) { }

                                return (
                                    <>
                                        <tr
                                            key={report.id}
                                            onClick={() => toggleExpand(report.id)}
                                            className={cn(
                                                "border-b border-border-subtle transition-colors cursor-pointer",
                                                isExpanded ? "bg-bg-secondary-panel" : "hover:bg-bg-sidebar-hover"
                                            )}
                                        >
                                            <td className="p-4 text-text-tertiary">
                                                <div className="relative w-4 h-4">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    {unread > 0 && (
                                                        <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-badge-danger ring-2 ring-bg-secondary-panel" aria-label="Unread replies" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-text-secondary">
                                                    {getTypeIcon(report.targetType)}
                                                    <span className="capitalize">{report.targetType.replace(/_/g, ' ').toLowerCase()}</span>
                                                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide", reportStatusClasses(report.status))}>
                                                        {reportStatusLabel(report.status)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", getSeverityColor(report.severity))}>
                                                    {report.severity}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-bg-secondary-panel flex items-center justify-center text-xs">
                                                        {report.reporter.name?.charAt(0)}
                                                    </div>
                                                    <span className="text-text-secondary truncate max-w-[100px]">{report.reporter.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("max-w-xs truncate font-medium", unread > 0 ? "text-text-heading font-semibold" : "text-text-heading")}>
                                                        {report.reason}
                                                    </span>
                                                    {unread > 0 && (
                                                        <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-badge-danger text-white text-[10px] font-bold shadow-sc-sm">
                                                            <MessageSquare className="w-3 h-3" />
                                                            {unread > 99 ? "99+" : unread} new
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                                <Link
                                                    href={`/admin/reports/${report.id}`}
                                                    className="p-2 hover:bg-sc-purple-500/10 rounded-lg transition-colors text-text-secondary hover:text-sc-purple-600 disabled:opacity-50 inline-flex"
                                                    title="Open report (AI triage + reply thread)"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Link>
                                                <select
                                                    value={normalizeReportStatus(report.status)}
                                                    disabled={!!isLoading}
                                                    onChange={(e) => handleSetStatus(report.id, e.target.value as ReportStatusKey)}
                                                    className="text-xs font-semibold border border-border-default rounded-lg bg-bg-card text-text-body px-2 py-1.5 cursor-pointer disabled:opacity-50 align-middle"
                                                    title="Set ticket status"
                                                >
                                                    {REPORT_STATUSES.map(s => (
                                                        <option key={s.key} value={s.key}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>

                                        {/* EXPANDED DETAILS */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr className="bg-black/20">
                                                    <td colSpan={6} className="p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border-subtle">
                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-mono text-text-tertiary uppercase tracking-widest">Description</h4>
                                                                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                                                        {details.description || "No detailed description provided."}
                                                                    </p>

                                                                    <div className="pt-4 flex gap-4 text-xs text-text-tertiary font-mono">
                                                                        <span>ID: {report.id}</span>
                                                                        <span>CREATED: {new Date(report.createdAt).toLocaleString()}</span>
                                                                    </div>
                                                                </div>

                                                                {details.files && details.files.length > 0 && (
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-xs font-mono text-text-tertiary uppercase tracking-widest">Attachments</h4>
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            {details.files.map((file: string, i: number) => {
                                                                                const isVideo = file.startsWith('data:video/') || file.match(/\.(mp4|webm|mov)($|\?)/i);
                                                                                const isImage = file.startsWith('data:image/') || file.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i);

                                                                                return (
                                                                                    <div
                                                                                        key={i}
                                                                                        className="group relative bg-bg-secondary-panel border border-border-default rounded-xl overflow-hidden hover:border-sc-purple-300 transition-all duration-300"
                                                                                    >
                                                                                        {/* Preview */}
                                                                                        <div className="aspect-video bg-bg-input relative overflow-hidden">
                                                                                            {isVideo ? (
                                                                                                <video
                                                                                                    src={file}
                                                                                                    className="w-full h-full object-cover"
                                                                                                    muted
                                                                                                />
                                                                                            ) : isImage ? (
                                                                                                <img
                                                                                                    src={file}
                                                                                                    alt={`Attachment ${i + 1}`}
                                                                                                    className="w-full h-full object-cover"
                                                                                                />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                                    <FileText className="w-12 h-12 text-text-heading" />
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Overlay on hover */}
                                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        setExpandedIds(prev => {
                                                                                                            const newSet = new Set(prev);
                                                                                                            newSet.add(`lightbox-${report.id}-${i}`);
                                                                                                            return newSet;
                                                                                                        });
                                                                                                    }}
                                                                                                    className="w-full bg-gradient-to-r from-sc-purple-500 to-sc-purple-700 hover:from-sc-purple-600 hover:to-sc-purple-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sc-sm"
                                                                                                >
                                                                                                    <span className="w-4 h-4">🔍</span>
                                                                                                    Click to Enlarge
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Info bar */}
                                                                                        <div className="p-2 bg-bg-secondary-panel border-t border-border-subtle">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <FileText className="w-3 h-3 text-sc-purple-600" />
                                                                                                <span className="text-[10px] text-text-secondary truncate">Attachment {i + 1}</span>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Lightbox */}
                                                                                        {expandedIds.has(`lightbox-${report.id}-${i}`) && (
                                                                                            <ImageLightbox
                                                                                                isOpen={true}
                                                                                                onClose={() => {
                                                                                                    setExpandedIds(prev => {
                                                                                                        const newSet = new Set(prev);
                                                                                                        newSet.delete(`lightbox-${report.id}-${i}`);
                                                                                                        return newSet;
                                                                                                    });
                                                                                                }}
                                                                                                imageUrl={file}
                                                                                                title={`Attachment ${i + 1} - Report ${report.reason}`}
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {reports.length === 0 && (
                    <div className="p-12 text-center text-text-tertiary">
                        All quiet. No active reports.
                    </div>
                )}
            </div>
        </div>
    );
}
