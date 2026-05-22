import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bookmark, Mail, Eye, MapPin, CheckCircle2, Users, Briefcase, Calendar, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleInterviewDialog } from "./ScheduleInterviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { unlockConversation } from "@/app/actions/chatActions";
import { toast } from "sonner";

interface CandidateCardProps {
    candidate: {
        id: string;
        name: string;
        username?: string; // Add username (optional to be safe with other usages)
        headline: string;
        location: string;
        role: string;
        company: string;
        skills: string[];
        matchScore: number;
        verified?: boolean;
        connections?: number;
        bio?: string;
        avatar?: string | null;
        yearsOfExperience?: number;
    };
    hasSearched?: boolean;
}

export function CandidateCard({ candidate, hasSearched = false }: CandidateCardProps) {
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);
    const [unlockPendingAction, setUnlockPendingAction] = useState<"MESSAGE" | "INTERVIEW" | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const router = useRouter();

    const handleMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUnlockPendingAction("MESSAGE");
        setIsUnlockOpen(true);
    };

    const handleInterview = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUnlockPendingAction("INTERVIEW");
        setIsUnlockOpen(true);
    };

    const handleConfirmUnlock = async () => {
        setIsUnlocking(true);
        try {
            const res = await unlockConversation(candidate.id);
            if (!res.success) {
                if (res.error === "Insufficient credits") {
                    toast.error("Not enough credits. Please top up to unlock this chat.");
                } else {
                    toast.error("Failed to unlock chat.");
                }
                setIsUnlocking(false);
                return;
            }

            toast.success(res.alreadyUnlocked ? "Chat already unlocked!" : "1 Credit deducted. Chat unlocked!");
            setIsUnlockOpen(false);

            if (unlockPendingAction === "MESSAGE") {
                router.push(`/messages?userId=${candidate.id}`);
            } else if (unlockPendingAction === "INTERVIEW") {
                setIsScheduleOpen(true);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsUnlocking(false);
            setUnlockPendingAction(null);
        }
    };

    const handleViewProfile = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Redirect to profile page
        const username = candidate.username || `user-${candidate.id}`; // Fallback if needed, though usually broken if no username
        if (candidate.username) {
            router.push(`/profile/${candidate.username}`);
        } else {
            // Try to use ID if username missing, but profile route expects username.
            // Hopefully username is always present now.
            console.warn("No username for profile redirect");
        }
    };

    return (
        <div className={cn(
            "group relative flex flex-col items-center bg-white border transition-all duration-300 rounded-[2rem] overflow-hidden p-6 shadow-sm border-[#E5E7EB] hover:border-[#7C3AED]/50 hover:shadow-lg hover:-translate-y-1"
        )}>

            {/* Match Score (Absolute Top Right) */}
            {hasSearched && (
                <div className="absolute top-4 right-4 flex flex-col items-end">
                    <span className="text-xl font-bold text-[#10B981] font-mono">{candidate.matchScore}%</span>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">Match</span>
                </div>
            )}

            {/* Avatar Section */}
            <div className="mt-4 mb-4 relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                    <AvatarImage src={candidate.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`} />
                    <AvatarFallback className="text-2xl font-bold bg-[#7C3AED]/10 text-[#7C3AED]">
                        {candidate.name.substring(0, 2)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Identity */}
            <div className="text-center w-full mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#7C3AED] transition-colors">
                        {candidate.name}
                    </h3>
                    {candidate.verified && (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] fill-[#10B981]/10" />
                    )}
                </div>
                <p className="text-xs text-[#6B7280] font-medium mb-1">{candidate.role} @ {candidate.company}</p>
                <div className="flex items-center justify-center gap-1 text-[10px] text-[#9CA3AF]">
                    <MapPin className="w-3 h-3" />
                    {candidate.location}
                </div>
            </div>

            {/* Bio / Description */}
            <div className="w-full bg-[#F9FAFB] rounded-xl p-3 mb-4 flex-1 border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] leading-relaxed text-center line-clamp-3">
                    {candidate.bio || candidate.headline}
                </p>
            </div>

            {/* Stats Implementation */}
            <div className="flex items-center gap-6 mb-6 text-[#9CA3AF]">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>{candidate.connections?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{candidate.yearsOfExperience || 0}y Exp</span>
                </div>
            </div>

            {/* Action Button */}
            <div className="w-full mt-auto">
                <Button
                    onClick={handleInterview}
                    className="w-full rounded-xl bg-[#111827] hover:bg-[#7C3AED] !text-white border-transparent transition-all duration-300 group-hover:shadow-md group-hover:shadow-[#7C3AED]/20 flex items-center gap-2"
                >
                    <Lock className="w-4 h-4 opacity-50" /> Book Interview
                </Button>
            </div>

            {/* Minimal Hover Actions Overlay */}
            <div className="absolute top-1/2 -right-12 group-hover:right-2 transition-all duration-300 opacity-0 group-hover:opacity-100 flex flex-col gap-2 z-20">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] shadow-sm"
                    onClick={handleMessage}
                >
                    <Mail className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] shadow-sm"
                    onClick={handleViewProfile}
                >
                    <Eye className="w-4 h-4" />
                </Button>
            </div>

            <ScheduleInterviewDialog
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
                candidateName={candidate.name}
                candidateId={candidate.id}
            />

            <Dialog open={isUnlockOpen} onOpenChange={setIsUnlockOpen}>
                <DialogContent className="sm:max-w-md bg-white text-[#111827]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[#7C3AED]" />
                            Unlock Profile
                        </DialogTitle>
                        <DialogDescription className="text-[#6B7280]">
                            To establish a connection and {unlockPendingAction === "MESSAGE" ? "message" : "interview"} {candidate.name}, you need to unlock their lifetime chatbox. This costs 1 Credit.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center p-6 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] my-4">
                        <Avatar className="w-16 h-16 border-2 border-white shadow-sm mb-3">
                            <AvatarImage src={candidate.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`} />
                            <AvatarFallback className="text-xl font-bold bg-[#7C3AED]/10 text-[#7C3AED]">
                                {candidate.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-[#111827]">{candidate.name}</p>
                        <p className="text-xs text-[#6B7280]">Lifetime Chat Access</p>
                        
                        <Badge variant="secondary" className="mt-4 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                            -1 Credit
                        </Badge>
                    </div>

                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsUnlockOpen(false)} disabled={isUnlocking}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-[#7C3AED] hover:bg-[#6D28D9] !text-white flex items-center gap-2" 
                            onClick={handleConfirmUnlock}
                            disabled={isUnlocking}
                        >
                            {isUnlocking ? "Unlocking..." : <><Unlock className="w-4 h-4" /> Unlock & Proceed</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
