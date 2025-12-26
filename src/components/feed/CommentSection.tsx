"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { addComment, fetchComments, voteComment } from "@/app/(app)/feed/actions";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    author: {
        name: string | null;
        image: string | null;
        username: string | null;
    };
    votes: { userId: string; type: 'UP' | 'DOWN' }[];
    parentId?: string | null;
}

interface CommentSectionProps {
    postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadComments = async () => {
            const result = await fetchComments(postId);
            if (result.success) {
                setComments(result.comments as any[]); // Type casting for ease mostly due to Date serialization over server actions if needed, though 'use server' handles JSON
            }
            setIsLoading(false);
        };
        loadComments();
    }, [postId]);

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const handleAddComment = async (parentId?: string) => {
        const text = parentId ? replyContent : newComment;
        if (!text.trim()) return;

        // Optimistic update (simplified placeholder)

        setIsSubmitting(true);
        const result = await addComment(postId, text, parentId);
        setIsSubmitting(false);

        if (result.success && result.comment) {
            toast.success("Comment broadcasted.");
            if (parentId) {
                setReplyContent("");
                setReplyingTo(null);
            } else {
                setNewComment("");
            }
            // Add new comment to state with safe defaults
            const safeComment = {
                ...result.comment,
                votes: result.comment.votes || [],
                parentId: result.comment.parentId
            };
            setComments(prev => [safeComment, ...prev]);
        } else {
            toast.error(result.message || "Failed to broadcast.");
        }
    };

    const handleVote = async (commentId: string, type: 'UP' | 'DOWN') => {
        // Optimistic update
        const updatedComments = comments.map(c => {
            if (c.id === commentId) {
                // Ensure votes array exists
                const currentVotes = c.votes || [];
                const existingVote = currentVotes.find(v => v.userId === session?.user?.id);
                let newVotes = currentVotes.filter(v => v.userId !== session?.user?.id);

                if (!existingVote || existingVote.type !== type) {
                    newVotes.push({ userId: session?.user?.id!, type });
                }
                return { ...c, votes: newVotes };
            }
            return c;
        });
        setComments(updatedComments as any[]); // Temporary cast to match state type

        const result = await voteComment(commentId, type);
        if (!result.success) {
            toast.error(result.message || "Vote failed.");
            // Revert on failure (could re-fetch)
            const revertResult = await fetchComments(postId);
            if (revertResult.success) setComments(revertResult.comments as any[]);
        }
    };

    // Helper to organize comments into threads (simplified: 1 level nesting for now or filtering)
    // Actually, let's keep it simple: Render top level, and inside them render their children.
    const rootComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    const CommentItem = ({ comment, isReply = false }: { comment: any, isReply?: boolean }) => {
        const votes = comment.votes || [];
        const score = votes.reduce((acc: number, v: any) => acc + (v.type === 'UP' ? 1 : -1), 0);
        const userVote = votes.find((v: any) => v.userId === session?.user?.id)?.type;
        const replies = getReplies(comment.id);

        return (
            <div className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2", isReply && "ml-12 mt-2")}>
                <Avatar className={cn("border border-white/10 mt-1", isReply ? "w-6 h-6" : "w-8 h-8")}>
                    <AvatarImage src={comment.author.image || ""} />
                    <AvatarFallback>{comment.author.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                    {/* Comment Bubble */}
                    <div className="bg-zinc-800/50 p-3 rounded-2xl rounded-tl-none border border-white/5 inline-block min-w-[200px] max-w-full">
                        <div className="flex justify-between items-baseline mb-1 gap-4">
                            <span className="text-xs font-bold text-zinc-200 hover:underline cursor-pointer">
                                {comment.author.name}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                        </p>
                    </div>

                    {/* Actions / Likes */}
                    <div className="flex items-center gap-4 px-2">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleVote(comment.id, 'UP')}
                                className={cn(
                                    "text-xs font-bold flex items-center gap-1 transition-colors",
                                    userVote === 'UP' ? "text-blue-400" : "text-zinc-500 hover:text-blue-400"
                                )}
                            >
                                <ThumbsUp className={cn("w-3 h-3", userVote === 'UP' && "fill-current")} />
                                Like
                            </button>

                            {(score > 0 || userVote === 'UP') && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                                    <ThumbsUp className="w-2 h-2 fill-current" /> {score}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => handleVote(comment.id, 'DOWN')}
                            className={cn(
                                "text-xs font-bold flex items-center gap-1 transition-colors",
                                userVote === 'DOWN' ? "text-red-400" : "text-zinc-500 hover:text-red-400"
                            )}
                        >
                            <ThumbsDown className={cn("w-3 h-3", userVote === 'DOWN' && "fill-current")} />
                            Dislike
                        </button>

                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            Reply
                        </button>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                        <div className="flex gap-2 items-center pt-2 animate-in fade-in slide-in-from-top-1">
                            <input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Reply to ${comment.author.name}...`}
                                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-full py-1 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(comment.id)}
                                autoFocus
                            />
                            <Button
                                size="sm"
                                className="h-6 text-xs px-3 rounded-full"
                                onClick={() => handleAddComment(comment.id)}
                                disabled={!replyContent.trim()}
                            >
                                Reply
                            </Button>
                        </div>
                    )}

                    {/* Nested Replies */}
                    {replies.length > 0 && (
                        <div className="space-y-3 mt-3 border-l-2 border-white/5 pl-0">
                            {replies.map(reply => (
                                <CommentItem key={reply.id} comment={reply} isReply={true} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
            {/* Headers */}
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Sector Chatter
            </div>

            {/* Comment List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-zinc-600 text-sm italic">
                        No chatter on this frequency yet.
                    </div>
                ) : (
                    rootComments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))
                )}
            </div>

            {/* Main Input */}
            <div className="flex gap-2 items-start pt-2">
                <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>{session?.user?.name?.charAt(0) || "ME"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                    <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Broadcast your frequency..."
                        className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl py-2 px-4 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-white/10 text-zinc-400 hover:text-white"
                        onClick={() => handleAddComment()}
                        disabled={!newComment.trim() || isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
