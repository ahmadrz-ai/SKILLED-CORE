
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Report, User } from '@prisma/client';
import {
    AlertTriangle, CheckCircle, XCircle, Shield, MessageSquare,
    ChevronDown, ChevronUp, Bug, Lightbulb, FileText, ArrowUpRight
} from 'lucide-react';
import { updateReportStatus, startReviewingReport } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

    const handleAction = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
        setIsLoading(reportId);
        const result = await updateReportStatus(reportId, status);
        setIsLoading(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

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
                    ACTIVE REPORTS: {reports.length}
                </div>
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
                            {reports.map((report) => {
                                const isExpanded = expandedIds.has(report.id);
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
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-text-secondary">
                                                    {getTypeIcon(report.targetType)}
                                                    <span className="capitalize">{report.targetType.replace(/_/g, ' ').toLowerCase()}</span>
                                                    {report.status === 'UNDER_REVIEW' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border text-yellow-500 bg-yellow-500/10 border-yellow-500/20 uppercase tracking-widest font-mono animate-pulse">
                                                            Reviewing
                                                        </span>
                                                    )}
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
                                                <div className="max-w-xs truncate text-text-heading font-medium">
                                                    {report.reason}
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
                                                <button
                                                    onClick={() => handleAction(report.id, 'RESOLVED')}
                                                    disabled={!!isLoading}
                                                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-text-secondary hover:text-emerald-600 disabled:opacity-50"
                                                    title="Resolve"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(report.id, 'DISMISSED')}
                                                    disabled={!!isLoading}
                                                    className="p-2 hover:bg-bg-secondary-panel rounded-lg transition-colors text-text-secondary hover:text-text-heading disabled:opacity-50"
                                                    title="Dismiss"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
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
