'use client';

import { useState } from 'react';
import Image from 'next/image';
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
            <div className="flex items-center justify-between bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-2 text-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">PENDING REVIEW</span>
                </div>
                <div className="text-xs text-text-tertiary font-mono">
                    QUEUE SIZE: {requests.length}
                </div>
            </div>

            <div className="bg-bg-secondary-panel border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border-subtle bg-bg-secondary-panel">
                            <th className="p-4 font-medium text-text-secondary">Applicant</th>
                            <th className="p-4 font-medium text-text-secondary">Type</th>
                            <th className="p-4 font-medium text-text-secondary">Document</th>
                            <th className="p-4 font-medium text-text-secondary text-right">Verdict</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req.id} className="border-b border-border-subtle hover:bg-bg-sidebar-hover transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-8 h-8 rounded-full bg-bg-secondary-panel flex items-center justify-center overflow-hidden border border-border-default">
                                            {req.user.image ? <Image src={req.user.image} alt="" fill sizes="32px" className="object-cover" /> : req.user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-text-heading">{req.user.name}</div>
                                            <div className="text-xs text-text-tertiary">{req.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-bg-secondary-panel text-text-secondary border-border-default">
                                        {req.type}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {req.type === 'ROLE_CHANGE' ? (
                                        <a
                                            href={`mailto:${req.documentUrl}`}
                                            className="flex items-center gap-2 text-sc-purple-600 hover:text-sc-purple-700 hover:underline font-mono text-xs"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Work Email: {req.documentUrl}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <a
                                            href={req.user.username ? `/profile/${req.user.username}` : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sc-purple-600 hover:text-sc-purple-700 hover:underline"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>View Profile</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                        disabled={!!isLoading}
                                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-text-secondary hover:text-emerald-600 disabled:opacity-50"
                                        title="Approve"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                        disabled={!!isLoading}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-secondary hover:text-red-500 disabled:opacity-50"
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
                    <div className="p-12 text-center text-text-tertiary">
                        No pending verifications. The queue is clear.
                    </div>
                )}
            </div>
        </div>
    );
}
