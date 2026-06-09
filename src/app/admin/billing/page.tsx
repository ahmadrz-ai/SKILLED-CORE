'use client';

import { useState, useEffect } from "react";
import { getAdminTransactions, approveTransaction, rejectTransaction } from "@/app/actions/billing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, RefreshCcw, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminBillingPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'HISTORY'>('PENDING');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getAdminTransactions();
            if (res.success) {
                setTransactions(res.transactions);
            } else {
                toast.error(res.message || "Failed to load transactions");
            }
        } catch (error) {
            console.error("Load Data Error:", error);
            toast.error("Failed to connect to server");
        }
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        setActionLoading(id);
        try {
            if (action === 'APPROVE') {
                const res = await approveTransaction(id);
                if (res.success) {
                    toast.success("Transaction Approved");
                    loadData();
                } else {
                    toast.error(res.message);
                }
            } else {
                const res = await rejectTransaction(id);
                if (res.success) {
                    toast.success("Transaction Rejected");
                    loadData();
                } else {
                    toast.error(res.message);
                }
            }
        } catch (error) {
            toast.error("Action failed. Check connection.");
        }
        setActionLoading(null);
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return t.status === 'PENDING';
        if (filter === 'HISTORY') return t.status !== 'PENDING';
        return true;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-heading text-text-heading">Billing Requests</h1>
                    <p className="text-text-secondary">Manage incoming payments and plan upgrades.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-bg-secondary-panel border border-border-default p-1 rounded-lg">
                        {(['PENDING', 'HISTORY', 'ALL'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    filter === f ? "bg-sc-purple-600 text-white shadow-sm" : "text-text-tertiary hover:text-text-body"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <Button onClick={loadData} variant="outline" size="sm">
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-bg-secondary-panel text-text-secondary border-b border-border-subtle">
                        <tr>
                            <th className="p-4 font-medium uppercase text-xs">User</th>
                            <th className="p-4 font-medium uppercase text-xs">Request</th>
                            <th className="p-4 font-medium uppercase text-xs">Amount / Provider</th>
                            <th className="p-4 font-medium uppercase text-xs">Transaction ID</th>
                            <th className="p-4 font-medium uppercase text-xs">Date</th>
                            <th className="p-4 font-medium uppercase text-xs">Status</th>
                            <th className="p-4 font-medium uppercase text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-bg-sidebar-hover transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 rounded-lg border border-border-default">
                                            <AvatarImage src={tx.user?.image} />
                                            <AvatarFallback>{tx.user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-text-heading max-w-[150px] truncate">{tx.user?.name}</p>
                                            <p className="text-xs text-text-tertiary max-w-[150px] truncate">{tx.user?.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {tx.type === 'PLAN' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-sc-purple-50 text-sc-purple-600 border border-sc-purple-200 text-xs font-bold">
                                            UPGRADE: {tx.planName}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                                            +{tx.credits} Credits
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-text-heading">${tx.amount / 100}</div>
                                    <div className="text-xs text-text-tertiary uppercase">{tx.provider}</div>
                                </td>
                                <td className="p-4 font-mono text-text-secondary text-xs">
                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { navigator.clipboard.writeText(tx.refId || ''); toast.success("Copied ID"); }}>
                                        {tx.refId}
                                        <Copy className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </td>
                                <td className="p-4 text-text-tertiary text-xs">
                                    {new Date(tx.createdAt).toLocaleDateString()} <br />
                                    {new Date(tx.createdAt).toLocaleTimeString()}
                                </td>
                                <td className="p-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-bold",
                                        tx.status === 'COMPLETED' ? "bg-green-500/10 text-green-500" :
                                            tx.status === 'REJECTED' ? "bg-red-500/10 text-red-500" :
                                                "bg-yellow-500/10 text-yellow-500 animate-pulse"
                                    )}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {tx.status === 'PENDING' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction(tx.id, 'REJECT')}
                                                className="h-8 w-8 p-0 text-text-tertiary hover:text-red-500 hover:bg-red-500/10"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction(tx.id, 'APPROVE')}
                                                className="h-8 w-8 p-0 text-text-tertiary hover:text-green-500 hover:bg-green-500/10"
                                            >
                                                {actionLoading === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-text-tertiary italic">No transactions found in this filter.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
