'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, CreditCard, History, Loader2, Sparkles, Wallet, Building2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { createPaymentRequest, getTransactions, approveTransaction } from "@/app/actions/billing";
import { cn } from "@/lib/utils";

const Slider = (props: any) => {
    return (
        <div className="relative w-full h-6 flex items-center">
            <input
                type="range"
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                {...props}
            />
        </div>
    );
};

interface PaymentModalProps {
    children?: React.ReactNode;
    mode?: 'CREDITS' | 'PLAN';
    planName?: string;
    fixedPrice?: number; // In Dollars
    onSuccess?: () => void;
}

const PROVIDERS = [
    { id: 'PAYONEER', label: 'Payoneer', icon: Wallet, color: 'text-violet-400' },
    { id: 'ALFALAH', label: 'Bank', icon: Building2, color: 'text-red-500' },
    { id: 'JAZZCASH', label: 'JazzCash', icon: Smartphone, color: 'text-amber-500' }
];

export function PaymentModal({ children, mode = 'CREDITS', planName, fixedPrice, onSuccess }: PaymentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [creditAmount, setCreditAmount] = useState(50);
    const [trxId, setTrxId] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [view, setView] = useState<'BUY' | 'HISTORY'>('BUY');
    const [provider, setProvider] = useState('PAYONEER');

    // Calculate Price
    const price = mode === 'PLAN' && fixedPrice ? fixedPrice : Math.floor(creditAmount / 5);

    // Load history when opening
    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const res = await getTransactions();
            if (res.success) setHistory(res.transactions);
        } catch (error) {
            console.error("Failed to load history:", error);
            // Silent fail or optional toast for history load
        }
    };

    const handleSubmit = async () => {
        if (!trxId.trim()) {
            toast.error("Please enter the Transaction ID");
            return;
        }
        setLoading(true);
        try {
            const res = await createPaymentRequest(
                price * 100,
                mode === 'PLAN' ? 0 : creditAmount, // Valid credits only if mode is CREDITS
                trxId,
                provider,
                mode,
                planName
            );

            if (res.success) {
                toast.success("Request Submitted! Admin will approve shortly.");
                setTrxId("");
                setView('HISTORY');
                loadHistory();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Payment Request Error:", error);
            toast.error("Connection failed. Please check your internet or try again.");
        }
        setLoading(false);
    };

    const handleSimulateApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toast.loading("Simulating Admin Approval...");
        try {
            const res = await approveTransaction(id);
            if (res.success) {
                toast.dismiss();
                toast.success("Approved!");
                loadHistory();
                if (onSuccess) onSuccess();
            } else {
                toast.dismiss();
                toast.error(res.message);
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Connection failed. Could not approve.");
        }
    };

    const renderPaymentDetails = () => {
        switch (provider) {
            case 'PAYONEER':
                return (
                    <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-white/10">
                        <span className="font-mono text-violet-300">billing@skilledcore.com</span>
                        <button onClick={() => toast.success("Copied")} className="p-1.5 hover:bg-white/10 rounded transition-colors text-zinc-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                    </div>
                );
            case 'ALFALAH':
                return (
                    <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-white/10 font-mono text-sm">
                        <div className="flex justify-between"><span className="text-zinc-500">Bank:</span> <span className="text-white">Bank Alfalah</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Account No:</span> <span className="text-white">5520412345678</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Title:</span> <span className="text-white">Skilled Core</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Branch:</span> <span className="text-white">Lahore Main</span></div>
                    </div>
                );
            case 'JAZZCASH':
                return (
                    <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-white/10 font-mono text-sm">
                        <div className="flex justify-between"><span className="text-zinc-500">Mobile No:</span> <span className="text-white">03001234567</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Title:</span> <span className="text-white">Skilled Core</span></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button variant="ghost" size="sm" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20">
                        <Sparkles className="w-3 h-3 mr-2" />
                        Add Credits
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-heading text-white">
                            {mode === 'PLAN' ? `Upgrade to ${planName}` : 'Add Credits'}
                        </DialogTitle>
                        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-white/5">
                            <button onClick={() => setView('BUY')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", view === 'BUY' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
                                Payment
                            </button>
                            <button onClick={() => setView('HISTORY')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", view === 'HISTORY' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
                                History
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {view === 'BUY' ? (
                    <div className="space-y-6 pt-2">
                        {/* 1. Amount / Plan Info */}
                        {mode === 'CREDITS' ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Credits Amount</p>
                                        <div className="flex items-end gap-2">
                                            <Input
                                                type="number"
                                                value={creditAmount}
                                                onChange={(e) => setCreditAmount(Math.max(5, parseInt(e.target.value) || 0))}
                                                className="w-24 bg-transparent border-none text-3xl font-bold font-heading p-0 h-auto focus-visible:ring-0"
                                                min={5}
                                                step={5}
                                            />
                                            <span className="text-zinc-500 font-bold mb-1.5">Credits</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Price</p>
                                        <p className="text-3xl font-bold text-green-400 font-heading">${price}</p>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <Slider min={5} max={1000} step={5} value={creditAmount} onChange={(e: any) => setCreditAmount(Number(e.target.value))} />
                                    <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-2">
                                        <span>5 Credits ($1)</span>
                                        <span>1000 Credits ($200)</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 text-center">
                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-2">Upgrade to {planName}</p>
                                <p className="text-4xl font-bold text-white font-heading">${price}</p>
                                <p className="text-zinc-600 text-xs mt-2">One-time payment for monthly subscription</p>
                            </div>
                        )}

                        {/* 2. Provider Selection */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-zinc-400 uppercase">Select Payment Method</p>
                            <div className="grid grid-cols-3 gap-2">
                                {PROVIDERS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setProvider(p.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                                            provider === p.id
                                                ? "bg-zinc-800 border-white/20 shadow-lg"
                                                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/10 text-zinc-500"
                                        )}
                                    >
                                        <p.icon className={cn("w-5 h-5", provider === p.id ? p.color : "text-zinc-600")} />
                                        <span className={cn("text-[10px] font-bold", provider === p.id ? "text-white" : "text-zinc-500")}>{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Payment Details */}
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                                <Wallet className="w-3 h-3" />
                                Send Payment To
                            </div>
                            {renderPaymentDetails()}
                            <p className="text-[10px] text-zinc-500">
                                * Send exactly <span className="text-white font-bold">${price}.00 USD</span> (or equivalent in PKR).
                            </p>
                        </div>

                        {/* 4. Verify */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Transaction ID</label>
                            <div className="flex gap-2">
                                <Input
                                    value={trxId}
                                    onChange={(e) => setTrxId(e.target.value)}
                                    placeholder="e.g. 56294821..."
                                    className="bg-zinc-900 border-white/10 focus-visible:ring-violet-500"
                                />
                                <Button onClick={handleSubmit} disabled={loading || !trxId} className="bg-violet-600 hover:bg-violet-500 text-white font-bold">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">No transaction history.</div>
                        ) : (
                            history.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {tx.type === 'PLAN' ? (
                                                <span className="font-bold text-white text-sm">Plan: {tx.planName}</span>
                                            ) : (
                                                <span className="font-bold text-white text-sm">+{tx.credits} Credits</span>
                                            )}
                                            <span className={cn("text-[10px] font-bold px-1.5 rounded-full border", tx.status === 'COMPLETED' ? "bg-green-500/10 text-green-400 border-green-500/20" : tx.status === 'PENDING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500 font-mono mt-1">
                                            ${tx.amount / 100} • {tx.provider}
                                        </div>
                                    </div>
                                    {tx.status === 'PENDING' ? (
                                        <div className="flex items-center gap-2">
                                            <div className="text-[10px] text-zinc-500 italic">
                                                Wait for approval...
                                            </div>
                                            {/* DEV ACTION */}
                                            <button
                                                onClick={(e) => handleSimulateApprove(tx.id, e)}
                                                title="Dev: Check to auto-approve"
                                                className="p-1 hover:bg-green-500/20 text-zinc-600 hover:text-green-500 rounded transition-colors"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-zinc-500">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
