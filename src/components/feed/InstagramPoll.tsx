"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface PollData {
    id: string;
    question: string;
    options: PollOption[];
}

interface InstagramPollProps {
    poll: PollData;
    onVote: (pollId: string, optionId: string) => Promise<{ success: boolean; poll?: PollData; message?: string }>;
}

export function InstagramPoll({ poll, onVote }: InstagramPollProps) {
    const [isVoting, setIsVoting] = useState(false);
    const [localPoll, setLocalPoll] = useState(poll);
    const [hasVotedLocal, setHasVotedLocal] = useState(false); // We don't verify server-side voted state here easily without prop

    const totalVotes = localPoll.options.reduce((acc, curr) => acc + curr.votes, 0);

    const handleVote = async (optionId: string) => {
        if (isVoting) return;

        setIsVoting(true);
        try {
            const result = await onVote(poll.id, optionId);
            if (result.success && result.poll) {
                setLocalPoll(result.poll);
                setHasVotedLocal(true);
                toast.success("Vote recorded");
            } else {
                toast.error(result.message || "Failed to vote");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="mt-3 space-y-2 select-none">
            {localPoll.options.map((option) => {
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                return (
                    <motion.div
                        key={option.id}
                        className={cn(
                            "relative overflow-hidden rounded-xl border border-white/10 cursor-pointer transition-all active:scale-[0.99]",
                            hasVotedLocal ? "cursor-default" : "hover:border-violet-500/50"
                        )}
                        onClick={() => !hasVotedLocal && handleVote(option.id)}
                        whileTap={!hasVotedLocal ? { scale: 0.98 } : undefined}
                    >
                        {/* Background Bar (Only visible if voted or typically always? Instagram shows % after vote) */}
                        {/* We will show % only if totalVotes > 0 and user has interacted, or just always show if there are votes? 
                            Instagram usually hides % until you vote. But here we might want to show it if global state knows.
                            For now, let's show bar background always if > 0 votes for visual juice, or sticking to 'Interact to reveal' is safer 
                            if we don't know if user voted. Let's assume 'Interact to reveal' style if we tracked user vote properly.
                            Since we blindly show votes in PostCard, let's keep showing them but animate them. 
                        */}
                        <div
                            className="absolute inset-0 bg-white/5 z-0"
                        />

                        {/* Progress Bar */}
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 z-0"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />

                        {/* Content */}
                        <div className="relative z-10 p-3 flex justify-between items-center">
                            <span className="font-bold text-sm text-zinc-100 drop-shadow-sm">
                                {option.text}
                            </span>
                            <span className="font-mono text-xs text-zinc-400 font-bold">
                                {percentage}%
                            </span>
                        </div>
                    </motion.div>
                );
            })}
            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-zinc-500 font-medium">
                    {totalVotes.toLocaleString()} votes
                </span>
                {/* Optional: Time remaining could go here */}
            </div>
        </div>
    );
}
