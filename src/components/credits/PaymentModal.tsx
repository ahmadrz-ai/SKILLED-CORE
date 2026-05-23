'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Check, Copy, CreditCard, Loader2, Sparkles, Wallet, 
    Building2, Smartphone, ChevronLeft, ChevronRight, Lock, 
    ShieldCheck, CheckCircle2, History, Coins, ArrowRight, Info
} from "lucide-react";
import { toast } from "sonner";
import { createPaymentRequest, getTransactions, approveTransaction } from "@/app/actions/billing";
import { processDirectCardPayment } from "@/app/actions/checkoutActions";
import { cn } from "@/lib/utils";

const Slider = (props: any) => {
    return (
        <div className="relative w-full h-6 flex items-center">
            <input
                type="range"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
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
    { id: 'CARD', label: 'Credit Card', icon: CreditCard, color: 'text-blue-500', desc: 'Instant activation' },
    { id: 'PAYONEER', label: 'Payoneer', icon: Wallet, color: 'text-indigo-500', desc: 'Manual review' },
    { id: 'ALFALAH', label: 'Bank Account', icon: Building2, color: 'text-emerald-500', desc: 'Manual review' },
    { id: 'JAZZCASH', label: 'JazzCash', icon: Smartphone, color: 'text-amber-500', desc: 'Manual review' }
];

export function PaymentModal({ children, mode = 'CREDITS', planName, fixedPrice, onSuccess }: PaymentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'CHECKOUT' | 'HISTORY'>('CHECKOUT');
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    
    // Core inputs
    const [creditAmount, setCreditAmount] = useState(50);
    const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'PAYONEER' | 'ALFALAH' | 'JAZZCASH'>('CARD');
    
    // Form variables
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");
    
    // Manual deposits
    const [trxId, setTrxId] = useState("");
    
    // Verification & loading
    const [loadingText, setLoadingText] = useState("Establishing secure tunnel...");
    const [completedRef, setCompletedRef] = useState("");
    const [history, setHistory] = useState<any[]>([]);

    // Calculate Price
    const price = mode === 'PLAN' && fixedPrice ? fixedPrice : Math.floor(creditAmount / 5);

    // Sync history
    useEffect(() => {
        if (isOpen) {
            loadHistory();
            // Reset to step 1
            setStep(1);
            setView('CHECKOUT');
        }
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const res = await getTransactions();
            if (res.success) setHistory(res.transactions);
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };

    // Card Input handlers
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ""); 
        if (value.length > 16) value = value.slice(0, 16);
        const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ""); 
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length > 2) {
            setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
        } else {
            setCardExpiry(value);
        }
    };

    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 3) value = value.slice(0, 3);
        setCardCvc(value);
    };

    // Validations
    const validateForm = () => {
        if (selectedMethod === 'CARD') {
            if (!cardholderName.trim()) {
                toast.error("Please enter the cardholder name.");
                return false;
            }
            if (cardNumber.replace(/\s/g, "").length !== 16) {
                toast.error("Card number must be exactly 16 digits.");
                return false;
            }
            if (cardExpiry.length !== 5 || !cardExpiry.includes("/")) {
                toast.error("Expiration date must be in MM/YY format.");
                return false;
            }
            const [month, year] = cardExpiry.split("/").map(Number);
            if (month < 1 || month > 12) {
                toast.error("Expiration month is invalid.");
                return false;
            }
            if (cardCvc.length !== 3) {
                toast.error("CVC security code must be 3 digits.");
                return false;
            }
            return true;
        } else {
            if (!trxId.trim()) {
                toast.error("Please enter the transaction Reference ID.");
                return false;
            }
            return true;
        }
    };

    // Trigger process animation step
    const handleProceedToVerify = () => {
        if (!validateForm()) return;
        setStep(4); // Initiate Loader
    };

    // Hype animation and server-side processing
    useEffect(() => {
        if (step === 4) {
            const logs = [
                "Establishing secure gateway TLS 1.3 tunnel...",
                "Encrypting card credentials via AES-256...",
                "Authorizing transaction balance ledger...",
                "Securing SkilledCore reserve deposit...",
                "Confirming final payment settlement status..."
            ];
            
            let logIdx = 0;
            setLoadingText(logs[0]);
            
            const logInterval = setInterval(() => {
                logIdx++;
                if (logIdx < logs.length) {
                    setLoadingText(logs[logIdx]);
                }
            }, 550);

            const timer = setTimeout(async () => {
                clearInterval(logInterval);
                try {
                    let res;
                    if (selectedMethod === 'CARD') {
                        res = await processDirectCardPayment(
                            price * 100,
                            mode === 'PLAN' ? 0 : creditAmount,
                            mode,
                            planName
                        );
                    } else {
                        // Manual verification
                        res = await createPaymentRequest(
                            price * 100,
                            mode === 'PLAN' ? 0 : creditAmount,
                            trxId,
                            selectedMethod,
                            mode,
                            planName
                        );
                    }

                    if (res.success) {
                        setCompletedRef(res.refId || trxId);
                        setStep(5); // Receipt
                        loadHistory();
                    } else {
                        toast.error(res.message);
                        setStep(3); // Fallback
                    }
                } catch (err) {
                    toast.error("Secure gateway timeout. Check your connection.");
                    setStep(3);
                }
            }, 2850);

            return () => {
                clearInterval(logInterval);
                clearTimeout(timer);
            };
        }
    }, [step]);

    const handleSimulateApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toast.loading("Processing Admin Approval simulation...");
        try {
            const res = await approveTransaction(id);
            if (res.success) {
                toast.dismiss();
                toast.success("Transaction successfully approved!");
                loadHistory();
                if (onSuccess) onSuccess();
            } else {
                toast.dismiss();
                toast.error(res.message);
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Verification connection error.");
        }
    };

    const renderManualPaymentDetails = () => {
        switch (selectedMethod) {
            case 'PAYONEER':
                return (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-sm text-[#111827]">
                        <span>billing@skilledcore.com</span>
                        <button onClick={() => { navigator.clipboard.writeText("billing@skilledcore.com"); toast.success("Payoneer Email copied!"); }} 
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-950">
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            case 'ALFALAH':
                return (
                    <div className="space-y-2 bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-xs text-[#374151]">
                        <div className="flex justify-between border-b border-gray-200/50 pb-1"><span className="text-gray-400">Bank Name:</span> <span className="font-bold text-gray-900">Bank Alfalah Ltd</span></div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-1"><span className="text-gray-400">Account Number:</span> <span className="font-bold text-gray-900">5520-4123-4567-8</span></div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-1"><span className="text-gray-400">Account Title:</span> <span className="font-bold text-gray-900">Skilled Core</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Branch Name:</span> <span className="font-bold text-gray-900">Lahore Main HQ</span></div>
                    </div>
                );
            case 'JAZZCASH':
                return (
                    <div className="space-y-2 bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-xs text-[#374151]">
                        <div className="flex justify-between border-b border-gray-200/50 pb-1"><span className="text-gray-400">Mobile Account:</span> <span className="font-bold text-gray-900">0300-1234-567</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Account Title:</span> <span className="font-bold text-gray-900">Skilled Core</span></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button variant="ghost" size="sm" className="bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 border border-[#6366F1]/20 rounded-full font-bold">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Add Credits
                    </Button>
                )}
            </DialogTrigger>
            
            <DialogContent className="bg-white/95 backdrop-blur-xl border border-gray-200 text-gray-900 sm:max-w-md p-6 rounded-2xl shadow-2xl focus:outline-none">
                <DialogHeader className="pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-bold font-heading text-gray-900">
                                {mode === 'PLAN' ? `Upgrade to ${planName}` : 'Add Credits'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 font-sans mt-0.5">
                                Secure transaction checkout panel
                            </DialogDescription>
                        </div>
                        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1 border border-gray-200/50">
                            <button onClick={() => setView('CHECKOUT')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", view === 'CHECKOUT' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                                Checkout
                            </button>
                            <button onClick={() => setView('HISTORY')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", view === 'HISTORY' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                                History
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {view === 'CHECKOUT' ? (
                    <div className="pt-4">
                        {/* STEP 1: SUMMARY BREAKDOWN */}
                        {step === 1 && (
                            <div className="space-y-6">
                                {mode === 'CREDITS' ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-200/60">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Top-Up Amount</p>
                                                <div className="flex items-end gap-1.5">
                                                    <Input
                                                        type="number"
                                                        value={creditAmount}
                                                        onChange={(e) => setCreditAmount(Math.max(5, parseInt(e.target.value) || 0))}
                                                        className="w-20 bg-transparent border-none text-2xl font-bold font-heading p-0 h-auto focus-visible:ring-0 text-gray-900"
                                                        min={5}
                                                        step={5}
                                                    />
                                                    <span className="text-gray-500 font-semibold mb-1 text-sm">Credits</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Amount Due</p>
                                                <p className="text-2xl font-bold text-[#10B981] font-heading">${price}.00</p>
                                            </div>
                                        </div>
                                        <div className="px-2">
                                            <Slider min={5} max={1000} step={5} value={creditAmount} onChange={(e: any) => setCreditAmount(Number(e.target.value))} />
                                            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                                                <span>5 Credits ($1)</span>
                                                <span>1000 Credits ($200)</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] p-6 rounded-2xl text-center space-y-2 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-400/10 blur-xl rounded-full pointer-events-none" />
                                        <p className="text-xs text-[#6366F1] font-bold uppercase tracking-widest">SUBTier Subscription Upgrade</p>
                                        <h4 className="text-3xl font-heading font-black text-gray-900">{planName} PACKAGE</h4>
                                        <p className="text-4xl font-heading font-black text-[#6366F1] pt-1">${price}.00<span className="text-sm font-sans font-medium text-gray-400">/mo</span></p>
                                    </div>
                                )}

                                {/* Bill invoice preview */}
                                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200/50">
                                    <h5 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Pricing invoice summary</h5>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span className="font-semibold text-gray-900">${price}.00 USD</span></div>
                                        <div className="flex justify-between text-gray-600"><span>V.A.T / Processing Taxes (0%):</span> <span className="font-semibold text-gray-900">$0.00 USD</span></div>
                                        <div className="flex justify-between text-gray-800 border-t border-gray-200/60 pt-2 font-bold text-sm"><span>Total Due:</span> <span className="text-[#10B981]">${price}.00 USD</span></div>
                                    </div>
                                </div>

                                <Button onClick={() => setStep(2)} className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white h-11 font-bold rounded-xl shadow-lg shadow-[#6366F1]/10 flex items-center justify-center gap-1.5 group">
                                    Proceed to payment method
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </div>
                        )}

                        {/* STEP 2: PAYMENT METHOD CHOICE */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Choose payment method</h5>
                                    <button onClick={() => setStep(1)} className="text-[#6366F1] text-xs font-bold flex items-center hover:underline"><ChevronLeft className="w-3.5 h-3.5" /> Back</button>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    {PROVIDERS.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedMethod(p.id as any)}
                                            className={cn(
                                                "flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-sm",
                                                selectedMethod === p.id 
                                                    ? "bg-white border-[#6366F1] shadow-[0_0_15px_rgba(99,102,241,0.06)]"
                                                    : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg border", selectedMethod === p.id ? "bg-[#6366F1]/10 border-[#6366F1]/20" : "bg-white border-gray-200")}>
                                                <p.icon className={cn("w-5 h-5", selectedMethod === p.id ? p.color : "text-gray-400")} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-900 leading-none">{p.label}</div>
                                                <div className="text-[10px] text-gray-400 mt-1 leading-none">{p.desc}</div>
                                            </div>
                                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", selectedMethod === p.id ? "border-[#6366F1] bg-[#6366F1]" : "border-gray-300")}>
                                                {selectedMethod === p.id && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <Button onClick={() => setStep(3)} className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white h-11 font-bold rounded-xl shadow-lg shadow-[#6366F1]/10">
                                    Proceed with {PROVIDERS.find(p => p.id === selectedMethod)?.label}
                                </Button>
                            </div>
                        )}

                        {/* STEP 3: PAYMENT FORM INPUT */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                                        {selectedMethod === 'CARD' ? "Enter Credit Card Details" : "Manual deposit verification"}
                                    </h5>
                                    <button onClick={() => setStep(2)} className="text-[#6366F1] text-xs font-bold flex items-center hover:underline"><ChevronLeft className="w-3.5 h-3.5" /> Back</button>
                                </div>

                                {selectedMethod === 'CARD' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Cardholder Name</label>
                                            <Input
                                                value={cardholderName}
                                                onChange={(e) => setCardholderName(e.target.value)}
                                                placeholder="e.g. Ahmad Raza"
                                                className="bg-gray-50 border-gray-200 text-sm h-10 focus-visible:ring-[#6366F1] rounded-lg"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Card Number</label>
                                            <div className="relative">
                                                <Input
                                                    value={cardNumber}
                                                    onChange={handleCardNumberChange}
                                                    placeholder="4000 1234 5678 9010"
                                                    className="bg-gray-50 border-gray-200 text-sm h-10 pr-9 focus-visible:ring-[#6366F1] rounded-lg font-mono"
                                                />
                                                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase text-gray-400">Expiration Date</label>
                                                <Input
                                                    value={cardExpiry}
                                                    onChange={handleExpiryChange}
                                                    placeholder="MM/YY"
                                                    className="bg-gray-50 border-gray-200 text-sm h-10 text-center focus-visible:ring-[#6366F1] rounded-lg font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase text-gray-400">CVC Code</label>
                                                <Input
                                                    value={cardCvc}
                                                    onChange={handleCvcChange}
                                                    placeholder="•••"
                                                    className="bg-gray-50 border-gray-200 text-sm h-10 text-center focus-visible:ring-[#6366F1] rounded-lg font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 p-2.5 rounded-lg border border-gray-200/50 bg-gray-50/50 mt-1 font-mono">
                                            <Lock className="w-3.5 h-3.5 text-[#6366F1]" />
                                            <span>GALACTIC AES-256 SECURED CLIENT PAYMENT</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2.5 bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase font-bold tracking-wider">
                                                <Wallet className="w-3.5 h-3.5 text-[#6366F1]" />
                                                Send Payment to Account:
                                            </div>
                                            {renderManualPaymentDetails()}
                                            <p className="text-[10px] text-gray-500 leading-normal font-sans pt-1">
                                                * Please send exactly <span className="font-bold text-gray-900">${price}.00 USD</span>. After sending, enter your Reference Transaction ID below to submit for verification.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-gray-400">Transaction ID (Reference)</label>
                                            <Input
                                                value={trxId}
                                                onChange={(e) => setTrxId(e.target.value)}
                                                placeholder="e.g. TRX9548231..."
                                                className="bg-gray-50 border-gray-200 text-sm h-10 focus-visible:ring-[#6366F1] rounded-lg font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button onClick={handleProceedToVerify} className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white h-11 font-bold rounded-xl shadow-lg shadow-[#6366F1]/10 flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    {selectedMethod === 'CARD' ? `Authorize $${price}.00 Payment` : "Submit Deposit Request"}
                                </Button>
                            </div>
                        )}

                        {/* STEP 4: PROCESSING LOADING ANIMATION */}
                        {step === 4 && (
                            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center select-none">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center" />
                                    <Loader2 className="w-16 h-16 text-[#6366F1] animate-spin absolute inset-0 stroke-[2px]" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="font-heading font-black text-lg text-gray-900 tracking-tight animate-pulse">AUTHORIZING CHECKS</h4>
                                    <p className="text-xs text-[#6366F1] font-mono leading-none h-4">{loadingText}</p>
                                </div>
                                <p className="text-[10px] text-gray-400 max-w-[280px] font-sans">
                                    Do not close or refresh this dialog panel. Your checkout is protected by secure banking encryptions.
                                </p>
                            </div>
                        )}

                        {/* STEP 5: SUCCESS INVOICE RECEIPT */}
                        {step === 5 && (
                            <div className="space-y-6 select-none animate-in fade-in duration-300">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-[#10B981] fill-emerald-50" />
                                    </div>
                                    <h4 className="font-heading font-black text-[#10B981] text-lg tracking-tight">TRANSACTION SUCCESS</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">Your payment was completed successfully!</p>
                                </div>

                                <div className="border border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-4 font-mono text-[11px] text-[#374151] space-y-2">
                                    <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Order Status:</span> <span className="font-bold text-[#10B981] uppercase">COMPLETED</span></div>
                                    <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Transaction ID:</span> <span className="font-bold text-gray-900">{completedRef}</span></div>
                                    <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Payment Gateway:</span> <span className="font-bold text-gray-900">{PROVIDERS.find(p => p.id === selectedMethod)?.label}</span></div>
                                    <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Amount Charged:</span> <span className="font-bold text-gray-900">${price}.00 USD</span></div>
                                    {mode === 'PLAN' ? (
                                        <div className="flex justify-between"><span className="text-gray-400">Plan Upgraded:</span> <span className="font-bold text-[#6366F1]">{planName}</span></div>
                                    ) : (
                                        <div className="flex justify-between"><span className="text-gray-400">Balance Awarded:</span> <span className="font-bold text-[#6366F1]">+{creditAmount} Credits</span></div>
                                    )}
                                </div>

                                <Button onClick={() => setIsOpen(false)} className="w-full bg-[#111827] hover:bg-black text-white h-11 font-bold rounded-xl shadow-md">
                                    Close & Sync Account
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* TRANSACTION HISTORY TAB */
                    <div className="space-y-4 pt-4 max-h-[360px] overflow-y-auto custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-xs font-sans">
                                <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                No payment transaction history found.
                            </div>
                        ) : (
                            history.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 hover:shadow-sm transition-all">
                                    <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {tx.type === 'PLAN' ? (
                                                <span className="font-bold text-gray-900 text-xs">Tier: {tx.planName}</span>
                                            ) : (
                                                <span className="font-bold text-gray-900 text-xs">+{tx.credits} Credits</span>
                                            )}
                                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border leading-none uppercase", 
                                                tx.status === 'COMPLETED' ? "bg-emerald-50 text-[#10B981] border-emerald-100" : 
                                                tx.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                                                "bg-rose-50 text-rose-600 border-rose-100")}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-1 flex items-center gap-1.5">
                                            <span>${tx.amount / 100} USD</span>
                                            <span>•</span>
                                            <span>{tx.provider}</span>
                                            <span>•</span>
                                            <span className="text-gray-300">{tx.refId.length > 12 ? tx.refId.substring(0, 10) + '...' : tx.refId}</span>
                                        </div>
                                    </div>
                                    
                                    {tx.status === 'PENDING' ? (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <div className="text-[9px] text-gray-400 italic">
                                                Reviewing...
                                            </div>
                                            {/* Dev Fast-Approve Action */}
                                            <button
                                                onClick={(e) => handleSimulateApprove(tx.id, e)}
                                                title="Simulate Admin Review Approval"
                                                className="p-1 hover:bg-[#10B981]/10 text-gray-300 hover:text-[#10B981] rounded-md transition-all"
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 font-mono flex-shrink-0">
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
