"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Target, Zap } from "lucide-react";
import { useSession } from "next-auth/react";

import { Switch } from "@/components/ui/switch";

interface ConfigProps {
    isOpen: boolean;
    onStart: (config: any) => void;
    onClose: () => void;
}

import { getCredits, deductCredits } from "@/app/actions/credits";
import { PurchaseCreditsModal } from "@/components/credits/PurchaseCreditsModal";
import { toast } from "sonner";
import { Loader2, Coins } from "lucide-react";

export function ConfigurationModal({ isOpen, onStart, onClose }: ConfigProps) {
    const { data: session } = useSession();
    const isCandidate = session?.user?.role === "CANDIDATE";

    const [role, setRole] = useState("frontend");
    const [difficulty, setDifficulty] = useState([3]);
    const [persona, setPersona] = useState("technologist");
    const [useResume, setUseResume] = useState(false);

    // Credit System State
    const [credits, setCredits] = useState<number | null>(null);
    const [isLoadingCredits, setIsLoadingCredits] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    // Fetch credits on open
    useEffect(() => {
        if (isOpen) {
            setIsLoadingCredits(true);
            getCredits().then(credits => {
                setCredits(credits);
                setIsLoadingCredits(false);
            });
        }
    }, [isOpen]);

    const handleStart = async () => {
        if (credits !== null && credits < 1) {
            setShowPurchaseModal(true);
            return;
        }

        setIsStarting(true);
        try {
            onStart({ role, difficulty: difficulty[0], persona, useResume });
        } catch (err) {
            toast.error("An error occurred.");
        } finally {
            setIsStarting(false);
        }
    };

    const handlePurchaseComplete = () => {
        // Refresh credits
        getCredits().then(credits => setCredits(credits));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent showCloseButton={true} className="md:max-w-5xl lg:max-w-6xl w-[95vw] md:w-full bg-bg-modal text-text-body border-border-modal p-0 rounded-2xl overflow-y-auto md:overflow-hidden shadow-sc-modal max-h-[95vh] flex flex-col md:flex-row [&_button[data-slot=dialog-close]]:z-50 [&_button[data-slot=dialog-close]]:text-text-secondary [&_button[data-slot=dialog-close]]:hover:text-text-heading">
                    <div className="grid grid-cols-1 md:grid-cols-12 w-full max-h-[95vh] overflow-y-auto md:overflow-visible">
                        
                        {/* Left Side: Compliance Protocol & Instructions */}
                        <div className="md:col-span-5 bg-sc-gray-50 p-6 border-r border-border-default flex flex-col justify-between select-none">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-mono tracking-widest uppercase font-extrabold text-sc-purple-650 block">
                                        INTERVIEW COMPLIANCE PROTOCOL
                                    </span>
                                    <h3 className="text-2xl font-heading font-black text-text-heading tracking-tight leading-tight">
                                        Before You Begin
                                    </h3>
                                </div>

                                <div className="space-y-5">
                                    {/* Voice Intro Rule */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-sc-purple-100 flex items-center justify-center shrink-0 border border-sc-purple-200 mt-0.5">
                                            <ShieldCheck className="w-4 h-4 text-text-brand" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-text-heading">Mandatory Voice Intro</h4>
                                            <p className="text-xs md:text-[13px] text-text-secondary leading-relaxed">
                                                At session startup, you must complete a voice introduction between **45 seconds** and **90 seconds** to calibrate acoustic assessment models.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Cheating Warning */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-sc-red-100 flex items-center justify-center shrink-0 border border-sc-red-200 mt-0.5">
                                            <ShieldCheck className="w-4 h-4 text-text-error" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-text-error">Tab Switching Warning</h4>
                                            <p className="text-xs md:text-[13px] text-text-secondary leading-relaxed">
                                                Losing window focus, switching tabs, or changing screens will trigger an automatic compliance flag. **One warning is granted;** a second infraction permanently records a **"Cheated / Non-Compliant"** status on your profile.
                                            </p>
                                            <p className="text-[11px] md:text-xs text-sc-red-700 font-extrabold mt-1 select-none leading-normal">
                                                ⚠ CRITICAL WARNING: If your interview session is voided due to non-compliant behavior, the 1 credit used to start the interview will be permanently lost.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Copy Paste Restrictions */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-sc-amber-100 flex items-center justify-center shrink-0 border border-sc-amber-200 mt-0.5">
                                            <ShieldCheck className="w-4 h-4 text-sc-amber-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-text-warning">Revoked Interactions</h4>
                                            <p className="text-xs md:text-[13px] text-text-secondary leading-relaxed">
                                                Copy and paste actions are **strictly disabled** within both the chat input field and the Monaco coding sandbox.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Screenshot Restriction */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-sc-red-100 flex items-center justify-center shrink-0 border border-sc-red-200 mt-0.5">
                                            <ShieldCheck className="w-4 h-4 text-text-error" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-text-error">Screenshot Prohibited</h4>
                                            <p className="text-xs md:text-[13px] text-text-secondary leading-relaxed">
                                                Don't try to take a screenshot during the interview. Screen capture and print screen triggers are strictly monitored and will void your session.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Coding Sandbox */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-sc-purple-100 flex items-center justify-center shrink-0 border border-sc-purple-200 mt-0.5">
                                            <ShieldCheck className="w-4 h-4 text-text-brand" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-text-heading">Interactive Sandbox</h4>
                                            <p className="text-xs md:text-[13px] text-text-secondary leading-relaxed">
                                                The AI will grill you with hands-on algorithm challenges. You will be required to open the integrated code sandbox, write clean solutions, and execute compilations.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Attestation */}
                            <div className="pt-4 border-t border-border-subtle flex items-center gap-2.5">
                                <div className="w-2 h-2 bg-sc-green-600 rounded-full animate-pulse shrink-0" />
                                <div className="text-[10px] text-text-secondary font-mono leading-tight">
                                    <span className="font-bold text-text-success uppercase">SECURE SANDBOX LINK ACTIVE</span>
                                    <p className="text-text-tertiary">Enterprise Grade Integrity Guard v3.2</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Configurations */}
                        <div className="md:col-span-7 p-6 flex flex-col justify-between bg-bg-modal">
                            <div>
                                <DialogHeader className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DialogTitle className="text-xl font-heading font-black text-text-heading tracking-tight">
                                                CONFIGURE INTERVIEW
                                            </DialogTitle>
                                        </div>
                                        
                                        {/* Credit Badge (Shifted left to prevent close-button collision!) */}
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-sc-purple-50 border border-sc-purple-150 rounded-full mr-12 shrink-0">
                                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                            <span className="text-xs font-bold font-mono text-sc-purple-700 leading-none">
                                                {isLoadingCredits ? "..." : credits ?? "-"} CR
                                            </span>
                                        </div>
                                    </div>
                                    <DialogDescription className="text-text-secondary text-xs mt-1">
                                        Calibrate the neural evaluator parameters for your assessment session. Cost: 1 Credit.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-5">
                                    {/* Role Protocol */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-text-heading uppercase tracking-wide">Target Role Protocol</Label>
                                        <Input
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="bg-bg-input border-border-input hover:border-border-input-hover focus:border-border-focus focus:ring-1 focus:ring-border-focus text-sm"
                                            placeholder="e.g. FrontEnd Engineer"
                                        />
                                    </div>

                                    {/* Difficulty Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold text-text-heading uppercase tracking-wide">Intensity Level</Label>
                                            <span className="text-[10px] font-mono font-bold text-sc-purple-650 bg-sc-purple-50 border border-sc-purple-200 px-2 py-0.5 rounded uppercase">
                                                {difficulty[0] === 1 && "INTERN SENSITIVITY"}
                                                {difficulty[0] === 2 && "STANDARD HR"}
                                                {difficulty[0] === 3 && "TEAM LEAD"}
                                                {difficulty[0] === 4 && "STAFF ENGINEER"}
                                                {difficulty[0] === 5 && "FOUNDER MODE"}
                                            </span>
                                        </div>
                                        <Slider
                                            value={difficulty}
                                            onValueChange={setDifficulty}
                                            max={5}
                                            min={1}
                                            step={1}
                                            className="py-2 cursor-pointer [&_[data-slot=slider-range]]:bg-sc-purple-600 [&_[data-slot=slider-thumb]]:bg-sc-purple-600 [&_[data-slot=slider-thumb]]:border-sc-purple-700"
                                        />
                                        <p className="text-[11px] text-text-secondary italic pl-1 leading-relaxed">
                                            {difficulty[0] === 1 && "Kind, forgiving. A gentle walk in the park."}
                                            {difficulty[0] === 2 && "Balanced, professional corporate behavioral evaluation."}
                                            {difficulty[0] === 3 && "High standards. Strict, direct, and production-driven assessment."}
                                            {difficulty[0] === 4 && "Arrogant and nitpicky. Challenges every software design pattern."}
                                            {difficulty[0] === 5 && "God Complex. Savagely blunt. zero tolerance for mediocre logic."}
                                        </p>
                                    </div>

                                    {/* Persona Selector */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-text-heading uppercase tracking-wide block">Interviewer Persona</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => setPersona("technologist")}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 select-none ${
                                                    persona === "technologist"
                                                        ? "bg-sc-purple-50 border-sc-purple-200 shadow-sm"
                                                        : "bg-sc-gray-50 border-border-default hover:bg-sc-gray-100"
                                                }`}
                                            >
                                                <div className="p-2 rounded-lg bg-sc-purple-100 shrink-0 border border-sc-purple-200">
                                                    <Target className="w-4 h-4 text-text-brand" />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <h4 className="text-xs font-extrabold text-text-heading leading-tight">The Technologist</h4>
                                                    <p className="text-[10px] text-text-secondary truncate mt-0.5">Drills into codebase execution details.</p>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => setPersona("visionary")}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 select-none ${
                                                    persona === "visionary"
                                                        ? "bg-sc-purple-50 border-sc-purple-200 shadow-sm"
                                                        : "bg-sc-gray-50 border-border-default hover:bg-sc-gray-100"
                                                }`}
                                            >
                                                <div className="p-2 rounded-lg bg-sc-purple-100 shrink-0 border border-sc-purple-200">
                                                    <Zap className="w-4 h-4 text-text-brand" />
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <h4 className="text-xs font-extrabold text-text-heading leading-tight">The Visionary</h4>
                                                    <p className="text-[10px] text-text-secondary truncate mt-0.5">Focuses on high-level design & scale.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context Switch */}
                                    <div className="space-y-1.5 pt-3 border-t border-border-subtle">
                                        <div className="flex items-start space-x-3 bg-sc-gray-50/70 p-3.5 rounded-xl border border-border-default hover:border-sc-purple-200/50 transition-all duration-300">
                                            <Switch
                                                id="resume-mode"
                                                checked={useResume}
                                                onCheckedChange={setUseResume}
                                                className="data-[state=checked]:bg-sc-purple-600 mt-0.5 shrink-0"
                                            />
                                            <div className="flex-1 space-y-0.5">
                                                <Label htmlFor="resume-mode" className="text-xs font-extrabold text-text-heading cursor-pointer hover:text-sc-purple-650 transition-colors">
                                                    Add Resume context
                                                </Label>
                                                <p className="text-[11px] text-text-secondary leading-relaxed">
                                                    Enable Grill Mode: The AI will fetch your profile resume and challenge you on your skills, demanding you write code inside the integrated **Sandbox**.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleStart}
                                disabled={isStarting}
                                className="w-full h-11 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded-xl mt-6 shadow-md shadow-sc-purple-500/10 cursor-pointer"
                            >
                                {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {credits !== null && credits < 1 ? "Purchase Credits" : "Start Interview"}
                                {credits !== null && credits >= 1 && <span className="text-[10px] opacity-75 font-normal lowercase">(1 credit required)</span>}
                            </Button>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>

            <PurchaseCreditsModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                onPurchaseComplete={handlePurchaseComplete}
            />
        </>
    );
}
