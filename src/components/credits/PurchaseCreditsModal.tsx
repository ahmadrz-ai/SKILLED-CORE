"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Check } from "lucide-react";
import { addCredits } from "@/app/actions/credits";
import { toast } from "sonner";

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchaseComplete: () => void;
}

export function PurchaseCreditsModal({ isOpen, onClose, onPurchaseComplete }: PurchaseModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePurchase = async () => {
        setIsLoading(true);
        try {
            // Mock purchase of 10 credits
            await addCredits(10);
            toast.success("Credits purchased successfully!", {
                icon: <Check className="w-4 h-4 text-green-500" />
            });
            onPurchaseComplete();
            onClose();
        } catch (error) {
            toast.error("Purchase failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/30">
                        <Coins className="w-6 h-6 text-yellow-500" />
                    </div>
                    <DialogTitle className="text-xl font-heading tracking-wide">TOP UP CREDITS</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        You need more neural link credits to start a new simulation session.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 my-2 flex items-center justify-between">
                    <div>
                        <div className="text-lg font-bold text-white">10 Credits</div>
                        <div className="text-xs text-zinc-500">Standard Pack</div>
                    </div>
                    <div className="text-xl font-bold text-white">$5.00</div>
                </div>

                <div className="text-xs text-center text-zinc-500 mb-4">
                    Secure payment via Galactic Stripe (Mock)
                </div>

                <Button
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold tracking-wide"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isLoading ? "PROCESSING..." : "PURCHASE CREDITS"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
