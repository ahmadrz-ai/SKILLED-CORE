"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Check, CreditCard, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { processDirectCardPayment } from "@/app/actions/checkoutActions";
import { toast } from "sonner";

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchaseComplete: () => void;
}

export function PurchaseCreditsModal({ isOpen, onClose, onPurchaseComplete }: PurchaseModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input Form, 2: Processing, 3: Success
    const [cardholderName, setCardholderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");
    const [loadingText, setLoadingText] = useState("Establishing connection...");
    const [completedRef, setCompletedRef] = useState("");

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCardholderName("");
            setCardNumber("");
            setCardExpiry("");
            setCardCvc("");
        }
    }, [isOpen]);

    // Formatters
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
    const handlePurchase = async () => {
        if (!cardholderName.trim()) {
            toast.error("Please enter the cardholder name.");
            return;
        }
        if (cardNumber.replace(/\s/g, "").length !== 16) {
            toast.error("Card number must be exactly 16 digits.");
            return;
        }
        if (cardExpiry.length !== 5 || !cardExpiry.includes("/")) {
            toast.error("Expiration date must be in MM/YY format.");
            return;
        }
        if (cardCvc.length !== 3) {
            toast.error("CVC security code must be 3 digits.");
            return;
        }

        setStep(2); // Show Hype Loader
    };

    // Processing timers
    useEffect(() => {
        if (step === 2) {
            const logs = [
                "Establishing secure gateway TLS 1.3 tunnel...",
                "Encrypting card credentials via AES-256...",
                "Authorizing galactic bank credit vault...",
                "Confirming final payment settlement..."
            ];

            let logIdx = 0;
            setLoadingText(logs[0]);

            const logInterval = setInterval(() => {
                logIdx++;
                if (logIdx < logs.length) {
                    setLoadingText(logs[logIdx]);
                }
            }, 600);

            const timer = setTimeout(async () => {
                clearInterval(logInterval);
                try {
                    // Purchase of 10 credits is $2.00
                    const res = await processDirectCardPayment(200, 10, 'CREDITS');
                    if (res.success) {
                        setCompletedRef(res.refId || "REF_MOCK");
                        setStep(3);
                        onPurchaseComplete();
                    } else {
                        toast.error(res.message);
                        setStep(1);
                    }
                } catch (err) {
                    toast.error("Transaction connection failed. Try again.");
                    setStep(1);
                }
            }, 2600);

            return () => {
                clearInterval(logInterval);
                clearTimeout(timer);
            };
        }
    }, [step]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white/95 backdrop-blur-xl border border-gray-200 text-gray-900 sm:max-w-md p-6 rounded-2xl shadow-2xl focus:outline-none">
                {step === 1 && (
                    <div className="space-y-5">
                        <DialogHeader className="text-center pb-2 border-b border-gray-100">
                            <div className="mx-auto w-12 h-12 rounded-full bg-[#5B35D5]/10 flex items-center justify-center mb-2 border border-[#5B35D5]/20">
                                <Coins className="w-6 h-6 text-[#5B35D5]" />
                            </div>
                            <DialogTitle className="text-lg font-bold font-heading text-gray-900">TOP UP CREDITS</DialogTitle>
                            <DialogDescription className="text-xs text-gray-400 font-sans">
                                Complete payment to instantly add 10 simulation credits.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Summary */}
                        <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-base font-bold text-gray-900">10 Credits</div>
                                <div className="text-[10px] text-gray-400 font-sans">Galactic Simulation Top-up</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-[#10B981] font-heading">$2.00</div>
                                <div className="text-[9px] text-gray-400 font-mono">USD</div>
                            </div>
                        </div>

                        {/* Card Input fields */}
                        <div className="space-y-3.5">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-gray-400">Cardholder Name</label>
                                <Input
                                    value={cardholderName}
                                    onChange={(e) => setCardholderName(e.target.value)}
                                    placeholder="e.g. Ahmad Raza"
                                    className="bg-gray-50 border-gray-200 text-xs h-9 focus-visible:ring-[#5B35D5] rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-gray-400">Card Number</label>
                                <div className="relative">
                                    <Input
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="4000 1234 5678 9010"
                                        className="bg-gray-50 border-gray-200 text-xs h-9 pr-8 focus-visible:ring-[#5B35D5] rounded-lg font-mono"
                                    />
                                    <CreditCard className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">Expiration Date</label>
                                    <Input
                                        value={cardExpiry}
                                        onChange={handleExpiryChange}
                                        placeholder="MM/YY"
                                        className="bg-gray-50 border-gray-200 text-xs h-9 text-center focus-visible:ring-[#5B35D5] rounded-lg font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">CVC Code</label>
                                    <Input
                                        value={cardCvc}
                                        onChange={handleCvcChange}
                                        placeholder="•••"
                                        className="bg-gray-50 border-gray-200 text-xs h-9 text-center focus-visible:ring-[#5B35D5] rounded-lg font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 p-2.5 rounded-lg border border-gray-200/50 bg-gray-50/50 font-mono">
                            <Lock className="w-3.5 h-3.5 text-[#5B35D5]" />
                            <span>GALACTIC AES-256 SECURED CLIENT PAYMENT</span>
                        </div>

                        <Button
                            onClick={handlePurchase}
                            className="w-full h-11 bg-[#5B35D5] hover:bg-[#4A28C9] text-white font-bold rounded-xl shadow-lg shadow-[#5B35D5]/10 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            AUTHORIZE $2.00 PURCHASE
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center select-none animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center" />
                            <Loader2 className="w-14 h-14 text-[#5B35D5] animate-spin absolute inset-0 stroke-[2px]" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-heading font-black text-base text-gray-900 tracking-tight animate-pulse">GALACTIC PAYGATEWAY</h4>
                            <p className="text-[10px] text-[#5B35D5] font-mono leading-none h-4">{loadingText}</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5 select-none animate-in fade-in duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-6 h-6 text-[#10B981] fill-emerald-50" />
                            </div>
                            <h4 className="font-heading font-black text-[#10B981] text-lg tracking-tight">PURCHASE SECURED</h4>
                            <p className="text-xs text-gray-400 mt-0.5">10 simulation credits have been loaded!</p>
                        </div>

                        <div className="border border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-4 font-mono text-[11px] text-[#374151] space-y-2">
                            <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Order Status:</span> <span className="font-bold text-[#10B981]">COMPLETED</span></div>
                            <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Reference Code:</span> <span className="font-bold text-gray-900">{completedRef}</span></div>
                            <div className="flex justify-between border-b border-gray-200/50 pb-1.5"><span className="text-gray-400">Total Price:</span> <span className="font-bold text-gray-900">$2.00 USD</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Item Loaded:</span> <span className="font-bold text-[#5B35D5]">+10 Credits</span></div>
                        </div>

                        <Button onClick={onClose} className="w-full bg-[#111827] hover:bg-black text-white h-11 font-bold rounded-xl shadow-md">
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
