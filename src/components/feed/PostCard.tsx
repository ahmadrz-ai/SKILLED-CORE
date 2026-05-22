import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    ThumbsUp, MessageCircle, Repeat, Send, MoreHorizontal,
    Share2, Bookmark, Code, Trash2, Flag, XCircle, Edit, Plus, UserPlus, BadgeCheck
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
import { SharePostModal } from "./SharePostModal";

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
        plan?: string;
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
    console.log("[PostCard DEBUG] Received post:", {
        id: post?.id,
        author: post?.author
    });
    const router = useRouter();
    const { data: session } = useSession();
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

    // Optimistic Content State
    const [content, setContent] = useState(post.content);

    // Sync with server updates
    useEffect(() => {
        setContent(post.content);
    }, [post.content]);

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
            setContent(editContent); // Update UI immediately
            toast.success(result.message);
            setIsEditModalOpen(false);
            router.refresh(); // Sync server in background
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
        let keyCounter = 0;

        // Find all quoted badges first
        const quotedBadgeRegex = /"([^"]+)"/g;
        const quotedBadges: Array<{ start: number, end: number, badge: React.ReactNode }> = [];

        let match;
        while ((match = quotedBadgeRegex.exec(content)) !== null) {
            const quotedText = match[1];
            const symbolMatch = quotedText.match(/([:\/~+])/);

            if (symbolMatch) {
                const trigger = symbolMatch[1];
                const badgeText = quotedText.replace(/[:\/~+]/g, '').replace(/\s+/g, ' ').trim();

                quotedBadges.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    badge: <span key={`badge-${keyCounter++}`}>{renderBadge(badgeText, trigger)}</span>
                });
            }
        }

        // Process content linearly
        let currentIndex = 0;

        // Sort quoted badges by position
        quotedBadges.sort((a, b) => a.start - b.start);

        for (const quotedBadge of quotedBadges) {
            // Add text before this quoted badge
            if (quotedBadge.start > currentIndex) {
                const textBefore = content.substring(currentIndex, quotedBadge.start);
                parts.push(...parseSingleBadges(textBefore, currentIndex, keyCounter));
                keyCounter += textBefore.length; // Rough counter increment
            }

            // Add the quoted badge
            parts.push(quotedBadge.badge);
            currentIndex = quotedBadge.end;
        }

        // Add remaining text
        if (currentIndex < content.length) {
            const remaining = content.substring(currentIndex);
            parts.push(...parseSingleBadges(remaining, currentIndex, keyCounter));
        }

        return parts.length > 0 ? <>{parts}</> : content;
    };

    const parseSingleBadges = (text: string, baseIndex: number, startKeyCounter: number): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        const singleBadgeRegex = /([:\/~+])(\w+)/g;
        let keyCounter = startKeyCounter;
        let lastPos = 0;
        let match;

        while ((match = singleBadgeRegex.exec(text)) !== null) {
            if (match.index > lastPos) {
                const textBefore = text.substring(lastPos, match.index);
                parts.push(...parseLinks(textBefore, baseIndex + lastPos));
            }

            parts.push(<span key={`badge-${keyCounter++}`}>{renderBadge(match[2], match[1])}</span>);
            lastPos = match.index + match[0].length;
        }

        if (lastPos < text.length) {
            const remaining = text.substring(lastPos);
            parts.push(...parseLinks(remaining, baseIndex + lastPos));
        }

        return parts;
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
                    (
                        <span key={key}>
                            <Link href={`/profile/${cleanHandle}`} className="text-blue-400 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                                @{cleanHandle}
                            </Link>
                            {punctuation}
                        </span>
                    )
                );
            }
            return <span key={key}>{word}</span>;
        });
    };
    const authorHandle = post.author?.handle || "@user";
    const authorUsername = authorHandle.startsWith("@") ? authorHandle.substring(1) : authorHandle;

    return (
        <div className="group relative bg-white border border-[#E5E7EB] py-5 hover:shadow-sm transition-all duration-200 -mx-4 px-4 lg:mx-0 lg:px-5 lg:rounded-xl lg:mb-3">
            <div className="flex gap-3">
                <Link href={`/profile/${authorUsername}`}>
                    <Avatar className="w-10 h-10 border border-[#E5E7EB] cursor-pointer hover:border-[#6366F1] transition-colors flex-shrink-0">
                        <AvatarImage src={post.author.avatar || undefined} />
                        <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold text-sm">{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${authorUsername}`} className="hover:underline group/author flex items-center">
                                <span className="font-semibold text-[#111827] text-sm group-hover/author:text-[#6366F1] transition-colors leading-none">
                                    {post.author.name}
                                </span>
                            </Link>
                            {(post.author.plan === 'PRO' || post.author.plan === 'ULTRA') && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="flex items-center justify-center"><BadgeCheck className="w-4 h-4 text-[#7C3AED]" /></TooltipTrigger>
                                        <TooltipContent><p>{post.author.plan === 'ULTRA' ? 'Ultra Verified' : 'Verified Pro'}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {post.author.role === 'ADMIN' && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] text-[10px] font-bold uppercase border border-[#DDD6FE] leading-none">ADMIN</span>
                            )}
                            {post.author.role === 'RECRUITER' && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase border border-[#BFDBFE] leading-none">RECRUITER</span>
                            )}
                            <span suppressHydrationWarning className="flex items-center text-[#9CA3AF] text-xs leading-none">· {post.timestamp}</span>
                            {post.author.isHiring && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold uppercase border border-[#C7D2FE] leading-none">Hiring</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            {session?.user?.id && session.user.id !== post.author.id && (
                                <>
                                    {connStatus === 'NONE' && post.author.nodeType !== 'BROADCAST' && post.author.role !== 'RECRUITER' && (
                                        <Button variant="ghost" size="sm" onClick={handleConnect} disabled={loadingConnect}
                                            className="h-7 px-2.5 text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5] hover:bg-[#EEF2FF] border border-[#C7D2FE] rounded-full">
                                            <UserPlus className="w-3 h-3 mr-1" /> Connect
                                        </Button>
                                    )}
                                    {connStatus === 'PENDING_SENT' && (
                                        <span className="text-[#9CA3AF] text-[10px] font-semibold uppercase px-2">Pending</span>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={handleFollow} disabled={loadingFollow}
                                        className={cn("h-7 px-2.5 text-xs font-semibold rounded-full border transition-all",
                                            isFollowing
                                                ? "text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] border-[#E5E7EB]"
                                                : (post.author.nodeType === 'BROADCAST' || post.author.role === 'RECRUITER')
                                                    ? "text-[#0891B2] bg-[#ECFEFF] hover:bg-[#CFFAFE] border-[#A5F3FC]"
                                                    : "text-[#6366F1] bg-[#EEF2FF] hover:bg-[#E0E7FF] border-[#C7D2FE]")}>
                                        {isFollowing ? "Following" : <><Plus className="w-3 h-3 mr-1" />Follow</>}
                                    </Button>
                                </>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-[#9CA3AF] hover:text-[#6B7280] p-1 rounded hover:bg-[#F3F4F6] transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-[#E5E7EB] text-[#374151] shadow-lg">
                                    <DropdownMenuItem onClick={() => toast.success("Noted. We will adjust your feed.")} className="cursor-pointer hover:bg-[#F3F4F6] gap-2 text-sm">
                                        <XCircle className="w-4 h-4 text-[#9CA3AF]" /> Not Interested
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer text-[#EF4444] hover:bg-[#FEF2F2] gap-2 text-sm">
                                        <Flag className="w-4 h-4" /> Report Post
                                    </DropdownMenuItem>
                                    {session?.user?.id === post.author.id && (
                                        <>
                                            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="cursor-pointer hover:bg-[#F3F4F6] gap-2 text-sm">
                                                <Edit className="w-4 h-4 text-[#9CA3AF]" /> Edit Post
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer text-[#EF4444] hover:bg-[#FEF2F2] gap-2 text-sm">
                                                <Trash2 className="w-4 h-4" /> Delete Post
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Edit Dialog */}
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent className="bg-white border-[#E5E7EB] sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-[#111827]">Edit Post</DialogTitle>
                                <DialogDescription className="text-[#6B7280]">Make changes to your post content here.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-[#F9FAFB] border-[#E5E7EB] min-h-[150px] text-[#111827] resize-none focus:ring-[#6366F1]/20 focus:border-[#6366F1]" />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]">Cancel</Button>
                                <Button onClick={handleUpdate} disabled={isSaving} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white">
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent className="bg-white border-[#E5E7EB] sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-[#111827]">Delete Post</DialogTitle>
                                <DialogDescription className="text-[#6B7280]">Are you sure? This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]">Cancel</Button>
                                <Button onClick={handleDelete} className="bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] border border-[#FECACA]">Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Text Body */}
                    <div className="mt-2 text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                        {parseContent(content)}
                    </div>

                    {/* Poll */}
                    {post.poll && (
                        <div className="mt-4 mb-2">
                            <InstagramPoll poll={post.poll} onVote={async (pollId, optionId) => {
                                const result = await votePoll(pollId, optionId);
                                if (result.success && result.poll) router.refresh();
                                return { ...result, poll: (result.poll as any) || undefined };
                            }} />
                        </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 mb-2">
                            {post.tags.map((tag, i) => (
                                <Link key={i} href={`/search?q=%23${tag.replace('#', '')}`}
                                    className="text-[#6366F1] hover:text-[#4F46E5] hover:underline text-sm font-medium transition-colors">
                                    #{tag.replace('#', '')}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Code Snippet */}
                    {post.codeSnippet && (
                        <div className="mt-3 bg-[#1E1E2E] rounded-lg p-3 border border-[#E5E7EB] font-mono text-xs overflow-x-auto">
                            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                                <span className="text-[#9CA3AF] flex items-center gap-1"><Code className="w-3 h-3" /> Snippet</span>
                                <span className="text-[#6B7280]">TypeScript</span>
                            </div>
                            <pre className="text-emerald-400">{post.codeSnippet}</pre>
                        </div>
                    )}

                    {/* Image */}
                    {post.image && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-[#E5E7EB]">
                            <img src={post.image} alt="Post attachment" className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-[#F3F4F6]">
                        <button onClick={handleLike}
                            className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium",
                                isLiked ? "text-[#2563EB] bg-[#EFF6FF]" : "text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF]")}>
                            <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                            <span>{likesCount}</span>
                        </button>
                        <button onClick={() => setShowComments(!showComments)}
                            className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium",
                                showComments ? "text-[#059669] bg-[#ECFDF5]" : "text-[#6B7280] hover:text-[#059669] hover:bg-[#ECFDF5]")}>
                            <MessageCircle className={cn("w-3.5 h-3.5", showComments && "fill-current")} />
                            <span>{post.comments}</span>
                        </button>
                        <button onClick={() => toast.success("Reposted to your network.")}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition-all font-medium">
                            <Repeat className="w-3.5 h-3.5" /><span>Repost</span>
                        </button>
                        <button onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all font-medium">
                            <Send className="w-3.5 h-3.5" /><span>Send</span>
                        </button>
                    </div>

                    {showComments && <CommentSection postId={post.id} />}
                </div>
            </div>

            <ReportPostModal postId={post.id} isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            <SharePostModal post={post} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
        </div>
    );
}
