'use client';

import { useState } from 'react';
import { VerificationRequest, User } from '@prisma/client';
import { Check, X, FileText, ExternalLink, Clock } from 'lucide-react';
import { updateVerificationStatus } from '../actions';
import { toast } from 'sonner';

type ExtendedRequest = VerificationRequest & {
    user: User;
};

interface VerificationsTableProps {
    requests: ExtendedRequest[];
}

export default function VerificationsTable({ requests }: VerificationsTableProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return;

        setIsLoading(requestId);
        const result = await updateVerificationStatus(requestId, status);
        setIsLoading(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">PENDING REVIEW</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    QUEUE SIZE: {requests.length}
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 font-medium text-zinc-400">Applicant</th>
                            <th className="p-4 font-medium text-zinc-400">Type</th>
                            <th className="p-4 font-medium text-zinc-400">Document</th>
                            <th className="p-4 font-medium text-zinc-400 text-right">Verdict</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                                            {req.user.image ? <img src={req.user.image} alt="" className="w-full h-full object-cover" /> : req.user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{req.user.name}</div>
                                            <div className="text-xs text-zinc-500">{req.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-800 text-zinc-300 border-zinc-700">
                                        {req.type}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <a
                                        href={req.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-violet-400 hover:text-violet-300 hover:underline"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View Document
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                        disabled={!!isLoading}
                                        className="p-2 hover:bg-teal-500/10 rounded-lg transition-colors text-zinc-400 hover:text-teal-500 disabled:opacity-50"
                                        title="Approve"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                        disabled={!!isLoading}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-400 hover:text-red-500 disabled:opacity-50"
                                        title="Reject"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {requests.length === 0 && (
                    <div className="p-12 text-center text-zinc-500">
                        No pending verifications. The queue is clear.
                    </div>
                )}
            </div>
        </div>
    );
}
