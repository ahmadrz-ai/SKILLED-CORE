import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bookmark, Mail, Eye, MapPin, CheckCircle2, Users, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleInterviewDialog } from "./ScheduleInterviewDialog";

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
    isSelected: boolean;
    onToggle: (id: string) => void;
}

export function CandidateCard({ candidate, isSelected, onToggle }: CandidateCardProps) {
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const router = useRouter();

    const handleMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Redirect to messages with this user selected
        router.push(`/messages?userId=${candidate.id}`);
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
            "group relative flex flex-col items-center bg-zinc-900 border transition-all duration-300 rounded-[2rem] overflow-hidden p-6",
            isSelected
                ? "border-violet-500/50 shadow-[0_0_25px_rgba(139,92,246,0.15)] bg-zinc-800/80"
                : "border-white/5 hover:border-white/10 hover:shadow-xl hover:-translate-y-1"
        )}>
            {/* Selection Checkbox (Absolute Top Left) */}
            <div className="absolute top-4 left-4 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(candidate.id)}
                    className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500 border-zinc-600 bg-black/40 backdrop-blur-sm"
                />
            </div>

            {/* Match Score (Absolute Top Right) */}
            <div className="absolute top-4 right-4 flex flex-col items-end">
                <span className="text-xl font-bold text-emerald-400 font-mono">{candidate.matchScore}%</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Match</span>
            </div>

            {/* Avatar Section */}
            <div className="mt-4 mb-4 relative">
                <Avatar className="w-24 h-24 border-4 border-zinc-800 shadow-lg">
                    <AvatarImage src={candidate.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`} />
                    <AvatarFallback className="text-2xl font-bold bg-violet-900/20 text-violet-300">
                        {candidate.name.substring(0, 2)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Identity */}
            <div className="text-center w-full mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                        {candidate.name}
                    </h3>
                    {candidate.verified && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/10" />
                    )}
                </div>
                <p className="text-xs text-zinc-400 font-medium mb-1">{candidate.role} @ {candidate.company}</p>
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    {candidate.location}
                </div>
            </div>

            {/* Bio / Description */}
            <div className="w-full bg-black/20 rounded-xl p-3 mb-4 flex-1">
                <p className="text-xs text-zinc-400 leading-relaxed text-center line-clamp-3">
                    {candidate.bio || candidate.headline}
                </p>
            </div>

            {/* Stats Implementation */}
            <div className="flex items-center gap-6 mb-6 text-zinc-500">
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
                    onClick={() => setIsScheduleOpen(true)}
                    className="w-full rounded-xl bg-zinc-800 hover:bg-violet-600 text-white border border-white/5 hover:border-transparent transition-all duration-300 group-hover:shadow-lg group-hover:shadow-violet-500/20 flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" /> Book Interview
                </Button>
            </div>

            {/* Minimal Hover Actions Overlay (Optional aesthetic touch) */}
            <div className="absolute top-1/2 -right-12 group-hover:right-2 transition-all duration-300 opacity-0 group-hover:opacity-100 flex flex-col gap-2 z-20">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-zinc-900 border border-white/10 hover:bg-white text-zinc-400 hover:text-black shadow-lg"
                    onClick={handleMessage}
                >
                    <Mail className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-zinc-900 border border-white/10 hover:bg-white text-zinc-400 hover:text-black shadow-lg"
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
        </div>
    );
}
