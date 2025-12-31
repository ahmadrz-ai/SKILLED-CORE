import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    ThumbsUp, MessageCircle, Repeat, Send, MoreHorizontal,
    Share2, Bookmark, Code, Trash2, Flag, XCircle, Edit, Plus, UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { deletePost, reportPost, votePoll, updatePost, toggleFollow } from "@/app/(app)/feed/actions";
import { CommentSection } from "@/components/feed/CommentSection";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { InstagramPoll } from "./InstagramPoll";
import { ReportPostModal } from "./ReportPostModal";

export interface PostProps {
    id: string;
    content: string;
    image?: string | null;
    codeSnippet?: string | null;
    tags?: string[] | null;
    timestamp: string;
    likes: number;
    comments: number;
    isLiked: boolean;
    author: {
        id: string;
        name: string;
        handle: string;
        avatar?: string | null;
        isHiring?: boolean;
        isFollowing?: boolean;
        connectionStatus?: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED';
        role?: string;
        nodeType?: string;
    };
    poll?: {
        id: string;
        question: string;
        options: {
            id: string;
            text: string;
            votes: number;
        }[];
    };
}

export function PostCard({ post, onLike, onDelete }: { post: PostProps; onLike?: () => void; onDelete?: (id: string) => void }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Follow State
    const [isFollowing, setIsFollowing] = useState(post.author.isFollowing || false);
    const [loadingFollow, setLoadingFollow] = useState(false);

    // Connection State
    const [connStatus, setConnStatus] = useState(post.author.connectionStatus || 'NONE');
    const [loadingConnect, setLoadingConnect] = useState(false);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false);

    const handleFollow = async () => {
        setLoadingFollow(true);
        const newState = !isFollowing;
        setIsFollowing(newState); // Optimistic

        try {
            const res = await toggleFollow(post.author.id);
            if (!res.success) {
                setIsFollowing(!newState); // Revert
                toast.error(res.message);
            } else {
                toast.success(res.following ? `Following ${post.author.name}` : `Unfollowed ${post.author.name}`);
            }
        } catch (error) {
            setIsFollowing(!newState);
            toast.error("Process failed.");
        } finally {
            setLoadingFollow(false);
        }
    };

    const handleLike = () => {
        if (isLiked) {
            setLikesCount(prev => prev - 1);
        } else {
            setLikesCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);
        onLike?.();
    };

    const handleDelete = async () => {
        const result = await deletePost(post.id);
        if (result.success) {
            toast.success(result.message);
            onDelete?.(post.id);
        } else {
            toast.error(result.message);
        }
        setIsDeleteDialogOpen(false);
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        const result = await updatePost(post.id, editContent);
        setIsSaving(false);

        if (result.success) {
            toast.success(result.message);
            setIsEditModalOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    const handleConnect = async () => {
        setLoadingConnect(true);
        setConnStatus('PENDING_SENT'); // Optimistic
        try {
            const { sendConnectionRequest } = await import('@/app/(app)/network/actions');
            const res = await sendConnectionRequest(post.author.id);
            if (!res.success) {
                setConnStatus('NONE');
                toast.error(res.message);
            } else {
                toast.success("Invitation sent");
            }
        } catch (error) {
            setConnStatus('NONE');
            toast.error("Failed to connect");
        } finally {
            setLoadingConnect(false);
        }
    };

    const renderBadge = (text: string, type: string) => {
        const styles = {
            ':': 'bg-red-500/10 text-red-400 border-red-500/20',
            '/': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            '~': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            '+': 'bg-zinc-800 text-zinc-300 border-zinc-700'
        };
        return (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${styles[type as keyof typeof styles] || styles[':']}`}>
                {text}
            </span>
        );
    };

    const parseContent = (content: string) => {
        const parts: React.ReactNode[] = [];
        let currentIndex = 0;

        // Pattern: "text with :word" or "text with /word" etc. OR standalone :word
        // Quoted badge: capture everything in quotes, then check last word for trigger
        const quotedBadgeRegex = /"([^"]+)"/g;
        const singleBadgeRegex = /([:\\/~+])(\w+)/g;

        let match;
        const processedRanges: Array<{ start: number, end: number }> = [];

        // First pass: find quoted badges
        while ((match = quotedBadgeRegex.exec(content)) !== null) {
            const quotedText = match[1]; // text inside quotes
            const lastWordMatch = quotedText.match(/\s*([:\\/~+])(\w+)$/); // trigger on last word

            if (lastWordMatch) {
                const trigger = lastWordMatch[1];
                const lastWord = lastWordMatch[2];
                const textBeforeTrigger = quotedText.substring(0, quotedText.length - lastWordMatch[0].length);
                // Add space between text and last word to preserve spacing
                const badgeText = (textBeforeTrigger + ' ' + lastWord).trim();

                // Add text before the quoted badge
                if (match.index > currentIndex) {
                    const textBefore = content.substring(currentIndex, match.index);
                    parts.push(...parseLinks(textBefore, currentIndex));
                }

                parts.push(' ');
                parts.push(renderBadge(badgeText.trim(), trigger));
                parts.push(' ');

                processedRanges.push({ start: match.index, end: match.index + match[0].length });
                currentIndex = match.index + match[0].length;
            }
        }

        // Second pass: find single-word badges in unprocessed text
        quotedBadgeRegex.lastIndex = 0;
        let searchIndex = 0;

        while (searchIndex < content.length) {
            // Skip processed ranges
            const inProcessed = processedRanges.find(r => searchIndex >= r.start && searchIndex < r.end);
            if (inProcessed) {
                searchIndex = inProcessed.end;
                continue;
            }

            // Find next quote or end
            const nextQuote = content.indexOf('"', searchIndex);
            const searchEnd = nextQuote !== -1 ? nextQuote : content.length;
            const searchText = content.substring(searchIndex, searchEnd);

            singleBadgeRegex.lastIndex = 0;
            let singleMatch;
            let lastPos = 0;

            while ((singleMatch = singleBadgeRegex.exec(searchText)) !== null) {
                if (singleMatch.index > lastPos) {
                    const textBefore = searchText.substring(lastPos, singleMatch.index);
                    parts.push(...parseLinks(textBefore, searchIndex + lastPos));
                }

                parts.push(renderBadge(singleMatch[2], singleMatch[1]));
                lastPos = singleMatch.index + singleMatch[0].length;
            }

            if (lastPos < searchText.length) {
                const remaining = searchText.substring(lastPos);
                parts.push(...parseLinks(remaining, searchIndex + lastPos));
            }

            searchIndex = searchEnd;

            // Skip the quote if exists
            if (nextQuote !== -1) {
                const quoteEnd = content.indexOf('"', nextQuote + 1);
                if (quoteEnd !== -1) {
                    // Check if this quote was already processed
                    const alreadyProcessed = processedRanges.find(r => r.start === nextQuote);
                    if (!alreadyProcessed) {
                        // Regular quoted text, not a badge
                        parts.push(content.substring(nextQuote, quoteEnd + 1));
                    }
                    searchIndex = quoteEnd + 1;
                } else {
                    break;
                }
            }
        }

        return parts.length > 0 ? <>{parts}</> : content;
    };

    const parseLinks = (text: string, baseIndex: number): React.ReactNode[] => {
        const words = text.split(/(\s+)/);
        return words.map((word, i) => {
            const key = `${baseIndex}-${i}`;
            if (word.startsWith('#') && word.length > 1) {
                return (
                    <Link key={key} href={`/search?q=${encodeURIComponent(word)}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {word}
                    </Link>
                );
            } else if (word.startsWith('@') && word.length > 1) {
                const rawHandle = word.substring(1);
                const cleanHandle = rawHandle.replace(/[.,!?:;]+$/, "");
                const punctuation = rawHandle.substring(cleanHandle.length);
                return (
                    <span key={key}>
                        <Link href={`/profile/${cleanHandle}`} className="text-blue-400 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                            @{cleanHandle}
                        </Link>
                        {punctuation}
                    </span>
                );
            }
            return <span key={key}>{word}</span>;
        });
    };

    return (
        <div className="group border-b border-white/5 py-4 hover:bg-white/2 transition-colors -mx-4 px-4 lg:mx-0 lg:px-4 lg:rounded-xl">
            <div className="flex gap-4">
                {/* Avatar */}
                <Link href={`/profile/${post.author.handle.substring(1)}`}>
                    <Avatar className="w-10 h-10 border border-white/10 cursor-pointer hover:border-violet-500/50 transition-colors">
                        <AvatarImage src={post.author.avatar || undefined} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Link href={`/profile/${post.author.handle.substring(1)}`} className="hover:underline flex items-end gap-2 group/author">
                                <span className="font-bold text-white text-sm group-hover/author:text-violet-400 transition-colors">
                                    {post.author.name}
                                </span>
                                <span className="text-zinc-500 text-xs mb-0.5 group-hover/author:text-zinc-400">{post.author.handle}</span>
                            </Link>
                            <span className="text-zinc-600 text-xs">· {post.timestamp}</span>

                            {post.author.isHiring && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wide border border-violet-500/20">
                                    Hiring
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Action Buttons Logic */}
                            {session?.user?.id && session.user.id !== post.author.id && (
                                <>
                                    {/* PRIMARY CONNECT: Open Node & Not Recruiter & Not Connected */}
                                    {connStatus === 'NONE' && post.author.nodeType !== 'BROADCAST' && post.author.role !== 'RECRUITER' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleConnect}
                                            disabled={loadingConnect}
                                            className="h-6 px-2 text-xs font-bold text-violet-400 hover:text-white hover:bg-violet-500/20 transition-all"
                                        >
                                            <UserPlus className="w-3 h-3 mr-1" /> Connect
                                        </Button>
                                    )}

                                    {/* PENDING STATUS */}
                                    {connStatus === 'PENDING_SENT' && (
                                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider px-2">
                                            Pending
                                        </span>
                                    )}

                                    {/* FOLLOW BUTTON (Prominent for Broadcast/Recruiter) */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleFollow}
                                        disabled={loadingFollow}
                                        className={cn(
                                            "h-6 px-2 text-xs font-bold transition-all",
                                            isFollowing
                                                ? "text-zinc-500 hover:text-red-400"
                                                : (post.author.nodeType === 'BROADCAST' || post.author.role === 'RECRUITER')
                                                    ? "text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20"
                                                    : "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"
                                        )}
                                    >
                                        {isFollowing ? (
                                            <span className="flex items-center">Following</span>
                                        ) : (
                                            <span className="flex items-center"><Plus className="w-3 h-3 mr-1" /> Follow</span>
                                        )}
                                    </Button>

                                    {/* SECONDARY CONNECT: Broadcast/Recruiter & Not Connected */}
                                    {connStatus === 'NONE' && (post.author.nodeType === 'BROADCAST' || post.author.role === 'RECRUITER') && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={handleConnect}
                                                        disabled={loadingConnect}
                                                        className="h-6 w-6 text-zinc-500 hover:text-violet-400 transition-all"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Connect</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-zinc-500 hover:text-white transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-400">
                                    <DropdownMenuItem onClick={() => toast.success("Noted. We will adjust your feed.")} className="cursor-pointer hover:bg-white/5 hover:text-white gap-2">
                                        <XCircle className="w-4 h-4" /> Not Interested
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer hover:bg-white/5 hover:text-red-400 text-red-500 gap-2">
                                        <Flag className="w-4 h-4" /> Report Post
                                    </DropdownMenuItem>
                                    {session?.user?.id === post.author.id && (
                                        <>
                                            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="cursor-pointer hover:bg-white/5 hover:text-white gap-2">
                                                <Edit className="w-4 h-4" /> Edit Post
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer hover:bg-white/5 hover:text-red-400 text-red-500 gap-2">
                                                <Trash2 className="w-4 h-4" /> Delete Post
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    {/* End Header */}

                    {/* Edit Dialog */}
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Edit Transmission</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Make changes to your post content here.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-zinc-900 border-white/10 min-h-[150px] text-zinc-200 resize-none focus:ring-violet-500/50"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-white/10 hover:bg-white/5 text-zinc-300">
                                    Cancel
                                </Button>
                                <Button onClick={handleUpdate} disabled={isSaving} className="bg-violet-600 hover:bg-violet-500 text-white">
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Delete Transmission</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Are you sure you want to delete this post? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    className="bg-transparent border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Text Body with Badges */}
                    <div className="mt-1 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {parseContent(post.content)}
                    </div>

                    {/* Poll Rendering */}
                    {post.poll && (
                        <div className="mt-4 mb-2">
                            <InstagramPoll
                                poll={post.poll}
                                onVote={async (pollId, optionId) => {
                                    const result = await votePoll(pollId, optionId);
                                    if (result.success && result.poll) {
                                        router.refresh();
                                    }
                                    return {
                                        ...result,
                                        poll: (result.poll as any) || undefined
                                    };
                                }}
                            />
                        </div>
                    )}

                    {/* Tags Section */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 mb-2">
                            {post.tags.map((tag, i) => (
                                <Link
                                    key={i}
                                    href={`/search?q=%23${tag.replace('#', '')}`}
                                    className="text-blue-400 hover:text-blue-300 hover:underline text-sm font-medium transition-colors"
                                >
                                    #{tag.replace('#', '')}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Code Snippet */}
                    {post.codeSnippet && (
                        <div className="mt-3 bg-zinc-950 rounded-lg p-3 border border-white/10 font-mono text-xs overflow-x-auto">
                            <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                <span className="text-zinc-500 flex items-center gap-1">
                                    <Code className="w-3 h-3" /> Snippet
                                </span>
                                <span className="text-zinc-600">TypeScript</span>
                            </div>
                            <pre className="text-emerald-400">
                                {post.codeSnippet}
                            </pre>
                        </div>
                    )}

                    {/* Image Attachment */}
                    {post.image && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                            <img
                                src={post.image}
                                alt="Post attachment"
                                className="w-full h-auto object-cover max-h-[400px]"
                            />
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex justify-between items-center mt-4 max-w-md">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-2 text-xs group transition-colors",
                                isLiked ? "text-blue-400" : "text-zinc-500 hover:text-blue-400"
                            )}
                        >
                            <div className={cn("p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors", isLiked && "bg-blue-500/10")}>
                                <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />
                            </div>
                            <span>{likesCount}</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className={cn(
                                "flex items-center gap-2 text-xs group transition-colors",
                                showComments ? "text-emerald-400" : "text-zinc-500 hover:text-emerald-400"
                            )}
                        >
                            <div className={cn("p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors", showComments && "bg-emerald-500/10")}>
                                <MessageCircle className={cn("w-4 h-4", showComments && "fill-current")} />
                            </div>
                            <span>{post.comments}</span>
                        </button>

                        <button
                            onClick={() => toast.success("Post rebroadcasted to your network.")}
                            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-violet-400 group transition-colors"
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-violet-500/10 transition-colors">
                                <Repeat className="w-4 h-4" />
                            </div>
                            <span>Repost</span>
                        </button>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                                toast.success("Uplink copied to clipboard.");
                            }}
                            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-blue-400 group transition-colors"
                        >
                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <Send className="w-4 h-4" />
                            </div>
                            <span>Send</span>
                        </button>
                    </div>

                    {/* Comment Section */}
                    {showComments && <CommentSection postId={post.id} />}
                </div>
            </div>

            <ReportPostModal
                postId={post.id}
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
}
