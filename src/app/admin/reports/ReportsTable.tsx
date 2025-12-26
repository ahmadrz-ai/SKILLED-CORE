
'use client';

import { useState } from 'react';
import { Report, User } from '@prisma/client';
import {
    AlertTriangle, CheckCircle, XCircle, Shield, MessageSquare,
    ChevronDown, ChevronUp, Bug, Lightbulb, FileText
} from 'lucide-react';
import { updateReportStatus } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
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
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
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
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">MODERATION QUEUE</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    ACTIVE REPORTS: {reports.length}
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 font-medium text-zinc-400 w-10"></th>
                                <th className="p-4 font-medium text-zinc-400">Type</th>
                                <th className="p-4 font-medium text-zinc-400">Severity</th>
                                <th className="p-4 font-medium text-zinc-400">Reporter</th>
                                <th className="p-4 font-medium text-zinc-400">Subject</th>
                                <th className="p-4 font-medium text-zinc-400 text-right">Action</th>
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
                                                "border-b border-white/5 transition-colors cursor-pointer",
                                                isExpanded ? "bg-white/5" : "hover:bg-white/5"
                                            )}
                                        >
                                            <td className="p-4 text-zinc-500">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    {getTypeIcon(report.targetType)}
                                                    <span className="capitalize">{report.targetType.replace(/_/g, ' ').toLowerCase()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", getSeverityColor(report.severity))}>
                                                    {report.severity}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                                                        {report.reporter.name?.charAt(0)}
                                                    </div>
                                                    <span className="text-zinc-300 truncate max-w-[100px]">{report.reporter.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="max-w-xs truncate text-zinc-100 font-medium">
                                                    {report.reason}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleAction(report.id, 'RESOLVED')}
                                                    disabled={!!isLoading}
                                                    className="p-2 hover:bg-teal-500/10 rounded-lg transition-colors text-zinc-400 hover:text-teal-500 disabled:opacity-50"
                                                    title="Resolve"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(report.id, 'DISMISSED')}
                                                    disabled={!!isLoading}
                                                    className="p-2 hover:bg-zinc-500/10 rounded-lg transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
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
                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/5">
                                                                <div className="space-y-4">
                                                                    <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Description</h4>
                                                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                                        {details.description || "No detailed description provided."}
                                                                    </p>

                                                                    <div className="pt-4 flex gap-4 text-xs text-zinc-500 font-mono">
                                                                        <span>ID: {report.id}</span>
                                                                        <span>CREATED: {new Date(report.createdAt).toLocaleString()}</span>
                                                                    </div>
                                                                </div>

                                                                {details.files && details.files.length > 0 && (
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Attachments</h4>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {details.files.map((file: string, i: number) => (
                                                                                <a
                                                                                    key={i}
                                                                                    href={file}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="block p-3 bg-zinc-900 border border-white/10 rounded-lg hover:border-violet-500/50 transition-colors"
                                                                                >
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <FileText className="w-4 h-4 text-violet-400" />
                                                                                        <span className="text-xs truncate">Attachment {i + 1}</span>
                                                                                    </div>
                                                                                    {/* Use a proper image preview if possible, simplistic for now */}
                                                                                    <div className="h-20 bg-black/50 rounded flex items-center justify-center text-xs text-zinc-600">
                                                                                        PREVIEW
                                                                                    </div>
                                                                                </a>
                                                                            ))}
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
                    <div className="p-12 text-center text-zinc-500">
                        All quiet. No active reports.
                    </div>
                )}
            </div>
        </div>
    );
}
