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
            const result = await deductCredits(1);
            if (result.success) {
                setCredits(result.remaining);
                onStart({ role, difficulty: difficulty[0], persona, useResume });
            } else {
                toast.error("Failed to start session. Please try again.");
            }
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
                <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-cyan-500" />
                                <DialogTitle className="text-xl tracking-wide font-heading">CONFIGURE INTERVIEW</DialogTitle>
                            </div>
                            {/* Credit Badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full">
                                <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="text-xs font-bold font-mono text-zinc-300">
                                    {isLoadingCredits ? "..." : credits ?? "-"} CR
                                </span>
                            </div>
                        </div>
                        <DialogDescription className="text-zinc-400">
                            Initialize neural link parameters. Cost: 1 Credit/Session.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Role Input */}
                        <div className="space-y-2">
                            <Label>Target Role Protocol</Label>
                            <Input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="bg-zinc-900 border-white/10 focus:border-cyan-500"
                                placeholder="e.g. Senior AI Engineer"
                            />
                        </div>

                        {/* Difficulty Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Intensity Level</Label>
                                <span className="text-xs font-mono text-cyan-400">
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
                                className="py-4"
                            />
                            <p className="text-xs text-zinc-500 italic">
                                {difficulty[0] === 1 && "Kind, forgiving. Walk in the park."}
                                {difficulty[0] === 2 && "Professional and balanced."}
                                {difficulty[0] === 3 && "High standards. Strict but fair."}
                                {difficulty[0] === 4 && "Arrogant. Challenges assumptions. Nitpicky."}
                                {difficulty[0] === 5 && "God Complex. Extremely Angry. Impossible Standards."}
                            </p>
                        </div>

                        {/* Persona Selection */}
                        <div className="space-y-2">
                            <Label>Interviewer Persona</Label>
                            <div className="grid grid-cols-1 gap-2">
                                <div
                                    onClick={() => setPersona("technologist")}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${persona === "technologist" ? "bg-cyan-900/20 border-cyan-500/50" : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900"}`}
                                >
                                    <div className="p-2 rounded bg-blue-500/10"><Target className="w-4 h-4 text-blue-400" /></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">The Technologist</h4>
                                        <p className="text-xs text-zinc-500">Drills into implementation details.</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setPersona("visionary")}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${persona === "visionary" ? "bg-cyan-900/20 border-cyan-500/50" : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900"}`}
                                >
                                    <div className="p-2 rounded bg-purple-500/10"><Zap className="w-4 h-4 text-purple-400" /></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">The Visionary</h4>
                                        <p className="text-xs text-zinc-500">Focuses on high-level architecture & product.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Context Injection - HIDDEN FOR RECRUITERS */}
                        {isCandidate && (
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <Label>Context Data Source</Label>
                                <div className="flex items-center space-x-2 bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                    <Switch
                                        id="resume-mode"
                                        checked={useResume}
                                        onCheckedChange={setUseResume}
                                        className="data-[state=checked]:bg-cyan-500"
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="resume-mode" className="text-sm font-bold text-white cursor-pointer">Inject My Resume</Label>
                                        <p className="text-xs text-zinc-500">AI will challenge you on specific bullet points ("Grill Mode").</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleStart}
                        disabled={isStarting}
                        className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest text-sm flex items-center justify-center gap-2"
                    >
                        {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {credits !== null && credits < 1 ? "Purchase Credits" : "Start Interview"}
                        {credits !== null && credits >= 1 && <span className="text-xs opacity-70 font-normal">(1 Credit)</span>}
                    </Button>
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
