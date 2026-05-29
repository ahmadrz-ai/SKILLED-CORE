import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, MapPin, CheckCircle2, Users, Briefcase, Lock, Unlock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleInterviewDialog } from "./ScheduleInterviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { unlockConversation } from "@/app/actions/chatActions";
import { toast } from "sonner";

interface SkillDetail {
    name: string;
    type: 'professional' | 'learning';
    details: string;
}

function cleanSkillName(name: string): string {
    if (!name) return '';
    return name
        .replace(/[\[\]"']/g, '') // Remove [ ] " ' characters
        .trim();
}

function parseSkillsWithDetails(skillsData: any): SkillDetail[] {
    if (!skillsData) return [];
    
    // If it's a string:
    if (typeof skillsData === 'string') {
        const trimmed = skillsData.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                return parseSkillsWithDetails(parsed);
            } catch (e) {
                // fall through to comma separated
            }
        }
        return trimmed.split(',').map((s: string) => cleanSkillName(s)).filter(Boolean).map((name: string) => ({
            name,
            type: 'professional',
            details: `Experienced in ${name} based on professional profile.`
        }));
    }
    
    // If it's an array:
    if (Array.isArray(skillsData)) {
        return skillsData.map((item: any) => {
            if (item && typeof item === 'object' && 'name' in item) {
                const name = cleanSkillName(item.name || '');
                return {
                    name,
                    type: item.type === 'learning' ? 'learning' : 'professional',
                    details: item.details || `Experienced in ${name}.`
                };
            } else if (typeof item === 'string') {
                const name = cleanSkillName(item);
                return {
                    name,
                    type: 'professional',
                    details: `Experienced in ${name}.`
                };
            }
            return null;
        }).filter((item): item is SkillDetail => item !== null && item.name !== '');
    }
    
    return [];
}

interface CandidateCardProps {
    candidate: {
        id: string;
        name: string;
        username?: string;
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
        avatarUrl?: string | null; // Support API response names
        yearsOfExperience?: number;
        // Scored AI parameters:
        plan?: 'ULTRA' | 'PRO' | 'BASIC';
        totalScore?: number;
        requirementScores?: { requirementLabel: string; score: number }[];
        matchedTerms?: string[];
        verifiedBadges?: string[];
        experienceCount?: number;
        projectCount?: number;
    };
    hasSearched?: boolean;
    layout?: 'grid' | 'row';
}

export function CandidateCard({ candidate, hasSearched = false, layout = 'grid' }: CandidateCardProps) {
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

    const handleViewProfile = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const username = candidate.username || `user-${candidate.id}`;
        router.push(`/profile/${username}`);
    };

    const displayAvatar = candidate.avatarUrl || candidate.avatar;

    // Premium Row Layout for Horizontal scroll lists (AI Search Specific)
    if (layout === 'row') {
        const isUltra = candidate.plan === 'ULTRA';
        const isPro = candidate.plan === 'PRO';

        return (
            <div 
                onClick={() => handleViewProfile()}
                className={cn(
                    "flex-shrink-0 w-64 bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#9278EA]/40 transition-all duration-150 cursor-pointer flex flex-col justify-between relative",
                    isUltra && "border-t-2 border-t-[#9278EA]"
                )}
            >
                {/* Header info */}
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <Avatar className="w-12 h-12 rounded-full object-cover flex-shrink-0">
                            <AvatarImage src={displayAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`} />
                            <AvatarFallback className="text-base font-bold bg-[#EAE6FD] text-[#5B35D5]">
                                {candidate.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Plan premium badge */}
                        {(isUltra || isPro) && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                                isUltra ? "bg-[#5B35D5] text-white" : "bg-[#2563EB] text-white"
                            )}>
                                {candidate.plan}
                            </span>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="mb-3">
                        <h4 className="text-sm font-semibold text-[#111827] truncate group-hover:text-[#5B35D5] transition-colors" title={candidate.name}>
                            {candidate.name}
                        </h4>
                        <span className="text-xs text-[#9CA3AF] truncate block">
                            @{candidate.username || `user-${candidate.id}`}
                        </span>
                        <p className="text-xs text-[#4B5563] mt-0.5 truncate" title={candidate.headline}>
                            {candidate.headline || candidate.role || "Software Engineer"}
                        </p>
                    </div>

                    {/* Progress Match Strength Bar */}
                    {hasSearched && (
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-[#4B5563]">Match Strength</span>
                                <span className="text-[10px] font-semibold text-[#4A28C9]">{candidate.matchScore}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#5B35D5] rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${candidate.matchScore}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Matched skills chips */}
                    {candidate.matchedTerms && candidate.matchedTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {candidate.matchedTerms.slice(0, 3).map((term, i) => (
                                <span 
                                    key={i}
                                    className="bg-[#F5F3FF] text-[#4A28C9] border border-[#D4CCF8] text-[9px] font-medium px-1.5 py-0.5 rounded-md uppercase"
                                >
                                    {term}
                                </span>
                            ))}
                            {candidate.matchedTerms.length > 3 && (
                                <span className="bg-[#F3F4F6] text-[#4B5563] text-[9px] font-medium px-1.5 py-0.5 rounded-md">
                                    +{candidate.matchedTerms.length - 3} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Verified Badges */}
                    {candidate.verifiedBadges && candidate.verifiedBadges.length > 0 && (
                        <div className="flex items-center gap-1 mt-2.5">
                            {candidate.verifiedBadges.slice(0, 2).map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-0.5 text-[#059669]" title={`${badge} Verified`}>
                                    <Shield className="w-3.5 h-3.5 fill-[#10B981]/10 text-[#059669]" />
                                    <span className="text-[9px] font-semibold truncate max-w-[80px]">{badge}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer section */}
                <div className="border-t border-[#F3F4F6] mt-4 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-[#9CA3AF]">
                        {candidate.experienceCount ?? candidate.yearsOfExperience ?? 0} roles · {candidate.projectCount ?? 0} projects
                    </span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile();
                        }}
                        className="text-[10px] font-semibold text-[#5B35D5] hover:underline cursor-pointer"
                    >
                        View Profile
                    </button>
                </div>
            </div>
        );
    }

    // Default Grid Layout for the standard non-AI filters search
    const displayCompany = candidate.company === 'Open to opportunities' || !candidate.company
        ? 'Seeking Opportunities'
        : candidate.company;

    const parsedSkills = parseSkillsWithDetails(candidate.skills);
    const professionalSkills = parsedSkills.filter(s => s.type === 'professional');
    const learningSkills = parsedSkills.filter(s => s.type === 'learning');

    return (
        <div className={cn(
            "group relative flex flex-col items-center bg-white border transition-all duration-300 rounded-2xl overflow-hidden p-5 shadow-sm border-[var(--sc-gray-150)] hover:border-[var(--sc-purple-400)] hover:shadow-lg hover:-translate-y-1 w-full"
        )}>

            {/* Match Score (Absolute Top Right) */}
            {hasSearched && (
                <div className="absolute top-4 right-4 flex flex-col items-end">
                    <span className="text-xl font-bold text-[#10B981] font-mono">{candidate.matchScore}%</span>
                    <span className="text-[10px] text-[var(--sc-gray-500)] uppercase tracking-wider font-medium">Match</span>
                </div>
            )}

            {/* Avatar Section */}
            <div className="mt-4 mb-4 relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                    <AvatarImage src={displayAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`} />
                    <AvatarFallback className="text-2xl font-bold bg-[var(--sc-purple-100)] text-[var(--sc-purple-600)]">
                        {candidate.name.substring(0, 2)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Identity */}
            <div className="text-center w-full mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 
                        onClick={handleViewProfile}
                        className="text-base font-bold text-[var(--sc-gray-900)] group-hover:text-[var(--sc-purple-600)] transition-colors cursor-pointer"
                    >
                        {candidate.name}
                    </h3>
                    {(candidate.verified || (candidate.verifiedBadges && candidate.verifiedBadges.length > 0)) && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--sc-green-600)] fill-[var(--sc-green-100)]" />
                    )}
                </div>
                <p className="text-xs text-[var(--sc-gray-600)] font-medium mb-1 truncate px-2" title={`${candidate.role} @ ${displayCompany}`}>
                    {candidate.role} @ {displayCompany}
                </p>
                <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--sc-gray-400)]">
                    <MapPin className="w-3 h-3" />
                    {candidate.location}
                </div>
            </div>

            {/* Bio / Description */}
            <div className="w-full bg-[var(--sc-gray-50)] rounded-xl p-3 mb-3 border border-[var(--sc-gray-150)]">
                <p className="text-xs text-[var(--sc-gray-600)] leading-relaxed text-center line-clamp-2">
                    {candidate.bio || candidate.headline}
                </p>
            </div>

            {/* Structured Skills Container */}
            <div className="w-full flex flex-col gap-2.5 mb-3 flex-1">
                {/* Professional Skills */}
                {professionalSkills.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-[var(--sc-gray-400)] uppercase tracking-wider text-left">
                            Professional
                        </span>
                        <div className="flex flex-wrap gap-1 justify-start">
                            {professionalSkills.slice(0, 5).map((skill, idx) => (
                                <span 
                                    key={idx} 
                                    className="inline-block bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] text-[10px] font-medium px-2 py-0.5 rounded transition-colors"
                                >
                                    {skill.name}
                                </span>
                            ))}
                            {professionalSkills.length > 5 && (
                                <span className="bg-[var(--sc-gray-100)] text-[var(--sc-gray-500)] text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                    +{professionalSkills.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Others / Learning Skills */}
                {learningSkills.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-[var(--sc-gray-400)] uppercase tracking-wider text-left">
                            Others
                        </span>
                        <div className="flex flex-wrap gap-1 justify-start">
                            {learningSkills.slice(0, 5).map((skill, idx) => (
                                <span 
                                    key={idx} 
                                    className="inline-block bg-[var(--sc-gray-50)] text-[var(--sc-gray-600)] border border-[var(--sc-gray-200)] text-[10px] font-medium px-2 py-0.5 rounded transition-colors"
                                >
                                    {skill.name}
                                </span>
                            ))}
                            {learningSkills.length > 5 && (
                                <span className="bg-[var(--sc-gray-100)] text-[var(--sc-gray-500)] text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                    +{learningSkills.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Implementation */}
            <div className="flex items-center gap-6 mb-3 text-[var(--sc-gray-400)]">
                <div className="flex items-center gap-1.5 font-medium text-[10px]">
                    <Users className="w-3.5 h-3.5" />
                    <span>{candidate.connections?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[10px]">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{candidate.yearsOfExperience || 0}y Exp</span>
                </div>
            </div>

            {/* Action Button */}
            <div className="w-full mt-auto">
                <Button
                    onClick={handleInterview}
                    className="w-full rounded-xl bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-700)] !text-white border-transparent transition-all duration-300 group-hover:shadow-md group-hover:shadow-[var(--sc-purple-600)]/20 flex items-center justify-center gap-2 cursor-pointer animate-none"
                >
                    <Lock className="w-4 h-4 opacity-50" /> Book Interview
                </Button>
            </div>

            {/* Relocated Hover Actions Overlay */}
            <div className="absolute top-3 right-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1.5 z-20">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg bg-white border border-[var(--sc-gray-150)] hover:bg-[var(--sc-gray-100)] text-[var(--sc-gray-500)] hover:text-[var(--sc-gray-900)] shadow-sm cursor-pointer"
                    onClick={handleMessage}
                >
                    <Mail className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg bg-white border border-[var(--sc-gray-150)] hover:bg-[var(--sc-gray-100)] text-[var(--sc-gray-500)] hover:text-[var(--sc-gray-900)] shadow-sm cursor-pointer"
                    onClick={() => handleViewProfile()}
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
                            <AvatarImage src={displayAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`} />
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
