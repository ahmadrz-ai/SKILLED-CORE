import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    ThumbsUp, MessageCircle, Repeat, Send, MoreHorizontal,
    Share2, Bookmark, Code, Trash2, Flag, XCircle, Edit, Plus, UserPlus, BadgeCheck,
    Tag, Info
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

    // Multi-Image & Interactive Tagging State
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [hoveredImageIdx, setHoveredImageIdx] = useState<number | null>(null);

    // Post Text Expansion State
    const [isExpanded, setIsExpanded] = useState(false);

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

    const parseMarkdownInline = (text: string, key: string): React.ReactNode => {
        const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|__.*?__|~~.*?~~|`.*?`)/g;
        const parts = text.split(tokenRegex);
        
        if (parts.length === 1) return <span key={key}>{text}</span>;

        return (
            <span key={key}>
                {parts.map((part, index) => {
                    const subKey = `${key}-${index}`;
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={subKey} className="font-extrabold text-[#111827]">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={subKey} className="italic text-gray-700">{part.slice(1, -1)}</em>;
                    }
                    if (part.startsWith('__') && part.endsWith('__')) {
                        return <span key={subKey} className="underline decoration-[#6366F1]/50 decoration-wavy decoration-1 underline-offset-2">{part.slice(2, -2)}</span>;
                    }
                    if (part.startsWith('~~') && part.endsWith('~~')) {
                        return <span key={subKey} className="line-through text-gray-400">{part.slice(2, -2)}</span>;
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return <code key={subKey} className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-red-600 font-mono text-xs">{part.slice(1, -1)}</code>;
                    }
                    return part;
                })}
            </span>
        );
    };

    const parseLinks = (text: string, baseIndex: number): React.ReactNode[] => {
        const words = text.split(/(\s+)/);
        return words.map((word, i) => {
            const key = `${baseIndex}-${i}`;
            if (word.startsWith('#') && word.length > 1) {
                const cleanTag = word.replace(/[.,!?:;]+$/, "");
                const punctuation = word.substring(cleanTag.length);
                return (
                    <span key={key}>
                        <Link href={`/search?q=${encodeURIComponent(cleanTag)}`} className="text-blue-500 hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
                            {cleanTag}
                        </Link>
                        {punctuation}
                    </span>
                );
            } else if (word.startsWith('@') && word.length > 1) {
                const rawHandle = word.substring(1);
                const cleanHandle = rawHandle.replace(/[.,!?:;]+$/, "");
                const punctuation = rawHandle.substring(cleanHandle.length);
                return (
                    <span key={key}>
                        <Link href={`/profile/${cleanHandle}`} className="text-[#6366F1] hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
                            @{cleanHandle}
                        </Link>
                        {punctuation}
                    </span>
                );
            } else if (/^https?:\/\/[^\s]+/i.test(word) || /^www\.[^\s]+/i.test(word)) {
                const cleanUrl = word.replace(/[.,!?;]+$/, "");
                const punctuation = word.substring(cleanUrl.length);
                const href = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
                return (
                    <span key={key}>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium break-all" onClick={(e) => e.stopPropagation()}>
                            {cleanUrl}
                        </a>
                        {punctuation}
                    </span>
                );
            }
            return parseMarkdownInline(word, key);
        });
    };
    const authorHandle = post.author?.handle || "@user";
    const authorUsername = authorHandle.startsWith("@") ? authorHandle.substring(1) : authorHandle;

    return (
        <div className="group relative bg-white border border-[#E5E7EB] py-5 hover:shadow-sm transition-all duration-200 -mx-4 px-4 lg:mx-0 lg:px-5 lg:rounded-xl lg:mb-3">
            {/* Header Section (Not side-by-side with body to allow full width centering of post content) */}
            <div className="flex justify-between items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${authorUsername}`}>
                        <Avatar className="w-10 h-10 border border-[#E5E7EB] cursor-pointer hover:border-[#6366F1] transition-colors flex-shrink-0">
                            <AvatarImage src={post.author.avatar || undefined} />
                            <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold text-sm">{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${authorUsername}`} className="hover:underline group/author flex items-center">
                                <span className="font-semibold text-[#111827] text-sm group-hover/author:text-[#6366F1] transition-colors leading-none">
                                    {post.author.name}
                                </span>
                            </Link>
                            {(post.author.plan === 'PRO' || post.author.plan === 'ULTRA') && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="flex items-center justify-center">
                                            <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500/10" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{post.author.plan === 'ULTRA' ? 'Ultra Verified' : 'Verified Pro'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {post.author.role === 'ADMIN' && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] text-[10px] font-bold uppercase border border-[#DDD6FE] leading-none">ADMIN</span>
                            )}
                            {post.author.role === 'RECRUITER' && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase border border-[#BFDBFE] leading-none">RECRUITER</span>
                            )}
                            {post.author.isHiring && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#6366F1] text-[10px] font-bold uppercase border border-[#C7D2FE] leading-none">Hiring</span>
                            )}
                        </div>
                        <span suppressHydrationWarning className="flex items-center text-[#9CA3AF] text-xs mt-1">
                            {post.timestamp}
                        </span>
                    </div>
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
                    <DropdownMenu modal={false}>
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

            {/* Sibling Container for Main Content (Centered, full card width) */}
            <div className="w-full">
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
                <div className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                    {(() => {
                        const TEXT_LIMIT = 240;
                        const LINE_LIMIT = 4;
                        const lines = content.split('\n');
                        const isLineExceeded = lines.length > LINE_LIMIT;
                        const isCharExceeded = content.length > TEXT_LIMIT;
                        const shouldFold = isCharExceeded || isLineExceeded;

                        let displayContent = content;
                        if (!isExpanded && shouldFold) {
                            let temp = content;
                            if (isLineExceeded) {
                                temp = lines.slice(0, LINE_LIMIT).join('\n');
                            }
                            if (temp.length > TEXT_LIMIT) {
                                temp = temp.substring(0, TEXT_LIMIT);
                            }
                            displayContent = temp.trim() + '...';
                        }

                        return (
                            <>
                                {parseContent(displayContent)}
                                {!isExpanded && shouldFold && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(true);
                                        }}
                                        className="text-[#6366F1] hover:text-[#4F46E5] font-semibold hover:underline transition-colors ml-1 focus:outline-none"
                                    >
                                        more
                                    </button>
                                )}
                            </>
                        );
                    })()}
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

                {/* Instagram-Style Swipable Image Carousel or Native Aspect Ratio Single Image */}
                {(() => {
                    if (!post.image) return null;

                    let parsedImages: Array<{ url: string; alt?: string; tags?: Array<{ userId: string; name: string; username: string; x: number; y: number; image?: string | null }> }> = [];

                    if (post.image.startsWith("[")) {
                        try {
                            parsedImages = JSON.parse(post.image);
                        } catch (e) {
                            parsedImages = [{ url: post.image }];
                        }
                    } else {
                        parsedImages = [{ url: post.image }];
                    }

                    if (parsedImages.length === 0) return null;

                    const imgCount = parsedImages.length;

                    const renderCollageImage = (img: { url: string; alt?: string }, index: number) => {
                        return (
                            <div 
                                className="relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center group"
                                onClick={() => setLightboxIndex(index)}
                            >
                                {/* Ambient Blurred Background (fills the slot beautifully with matching colors) */}
                                <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none opacity-40 scale-110 blur-xl">
                                    <img 
                                        src={img.url} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Crisp Foreground Image (fully contained, zero cropping, completely visible text) */}
                                <img 
                                    src={img.url} 
                                    alt={img.alt || `Attachment ${index + 1}`} 
                                    className="relative z-10 w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                                />
                                {img.alt && (
                                    <div className="absolute bottom-2 left-2 z-20 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none">
                                        ALT
                                    </div>
                                )}
                            </div>
                        );
                    };

                    // If single image, render in original aspect ratio with custom max-height
                    if (imgCount === 1) {
                        const img = parsedImages[0];
                        return (
                            <div className="relative mt-3 w-full bg-white rounded-xl overflow-hidden border border-[#E5E7EB] flex items-center justify-center max-h-[600px]">
                                <img 
                                    src={img.url} 
                                    alt={img.alt || "Attachment"} 
                                    className="w-full h-auto max-h-[600px] object-contain cursor-pointer"
                                    onClick={() => setLightboxIndex(0)}
                                    onMouseEnter={() => setHoveredImageIdx(0)}
                                    onMouseLeave={() => setHoveredImageIdx(null)}
                                />

                                {/* Tags on hover */}
                                {img.tags && img.tags.map((t, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "absolute z-30 transition-all duration-300 translate-x-[-50%] translate-y-[-50%]",
                                            hoveredImageIdx === 0 ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                                        )}
                                        style={{ left: `${t.x}%`, top: `${t.y}%` }}
                                    >
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                router.push(`/profile/${t.username}`);
                                            }}
                                            className="bg-black/80 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-1 cursor-pointer"
                                        >
                                            <Tag className="w-3 h-3 text-[#10B981]" />
                                            <span>{t.name}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* ALT Box */}
                                {img.alt && (
                                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none">
                                        ALT
                                    </div>
                                )}

                                {/* Tag count */}
                                {img.tags && img.tags.length > 0 && (
                                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none flex items-center gap-1">
                                        <UserPlus className="w-2.5 h-2.5 text-[#10B981]" />
                                        <span>{img.tags.length} tagged</span>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // If 2 images: 2 equal-width columns side-by-side
                    if (imgCount === 2) {
                        return (
                            <div className="relative mt-3 grid grid-cols-2 gap-1.5 aspect-[3/2] w-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-gray-50 select-none">
                                {parsedImages.map((img, index) => (
                                    <div key={index} className="relative h-full w-full overflow-hidden cursor-pointer">
                                        {renderCollageImage(img, index)}
                                    </div>
                                ))}
                            </div>
                        );
                    }

                    // If 3 images: 1 large on left, 2 smaller stacked on right
                    if (imgCount === 3) {
                        return (
                            <div className="relative mt-3 grid grid-cols-3 gap-1.5 aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-gray-50 select-none">
                                {/* Left tall image */}
                                <div className="col-span-2 h-full w-full overflow-hidden cursor-pointer">
                                    {renderCollageImage(parsedImages[0], 0)}
                                </div>
                                {/* Right stacked images */}
                                <div className="col-span-1 flex flex-col gap-1.5 h-full">
                                    {parsedImages.slice(1).map((img, idx) => {
                                        const actualIndex = idx + 1;
                                        return (
                                            <div key={actualIndex} className="h-[calc(50%-3px)] w-full overflow-hidden cursor-pointer">
                                                {renderCollageImage(img, actualIndex)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    // If 4 or more images: 1 large on left, 3 smaller stacked on right (matching the LinkedIn style!)
                    return (
                        <div className="relative mt-3 grid grid-cols-3 gap-1.5 aspect-[16/11] w-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-gray-50 select-none">
                            {/* Left tall image */}
                            <div className="col-span-2 h-full w-full overflow-hidden cursor-pointer">
                                {renderCollageImage(parsedImages[0], 0)}
                            </div>
                            {/* Right stacked images */}
                            <div className="col-span-1 flex flex-col gap-1.5 h-full">
                                {parsedImages.slice(1, 4).map((img, idx) => {
                                    const actualIndex = idx + 1;
                                    return (
                                        <div key={actualIndex} className="relative h-[calc(33.33%-3px)] w-full overflow-hidden cursor-pointer">
                                            {renderCollageImage(img, actualIndex)}
                                            
                                            {/* If 5+ images, show "+X more" overlay on the 4th image (3rd index in right stack) */}
                                            {actualIndex === 3 && imgCount > 4 && (
                                                <div 
                                                    className="absolute inset-0 z-20 bg-black/60 hover:bg-black/50 transition-colors flex flex-col items-center justify-center text-white text-base sm:text-lg font-bold select-none cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLightboxIndex(actualIndex);
                                                    }}
                                                >
                                                    <span>+{imgCount - 3}</span>
                                                    <span className="text-[10px] tracking-wider uppercase font-medium mt-0.5">more</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Premium Image Lightbox Viewer Modal */}
                {lightboxIndex !== null && (
                    <div 
                        className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 cursor-default select-none animate-fade-in"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(null);
                        }}
                    >
                        <button 
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all z-50 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(null);
                            }}
                        >
                            <XCircle className="w-6 h-6" />
                        </button>

                        {/* Large Image Box */}
                        <div 
                            className="relative max-w-4xl w-full max-h-[85vh] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex-1 relative flex items-center justify-center bg-black min-h-[300px]">
                                <img 
                                    src={(() => {
                                        let parsedImages = [];
                                        if (post.image) {
                                            if (post.image.startsWith("[")) {
                                                try { parsedImages = JSON.parse(post.image); }
                                                catch (e) { parsedImages = [{ url: post.image }]; }
                                            } else { parsedImages = [{ url: post.image }]; }
                                        }
                                        return parsedImages[lightboxIndex]?.url || "";
                                    })()} 
                                    alt="Post attachment full screen" 
                                    className="max-w-full max-h-[75vh] object-contain"
                                />
                                
                                {/* Lightbox tags */}
                                {(() => {
                                    let parsedImages = [];
                                    if (post.image) {
                                        if (post.image.startsWith("[")) {
                                            try { parsedImages = JSON.parse(post.image); }
                                            catch (e) { parsedImages = [{ url: post.image }]; }
                                        } else { parsedImages = [{ url: post.image }]; }
                                    }
                                    const img = parsedImages[lightboxIndex];
                                    return img?.tags && img.tags.map((t: any, idx: number) => (
                                        <div 
                                            key={idx}
                                            className="absolute z-40 translate-x-[-50%] translate-y-[-50%]"
                                            style={{ left: `${t.x}%`, top: `${t.y}%` }}
                                        >
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setLightboxIndex(null);
                                                    router.push(`/profile/${t.username}`);
                                                }}
                                                className="bg-black/85 hover:bg-black text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/25 shadow-2xl flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                            >
                                                <Tag className="w-3.5 h-3.5 text-[#10B981]" />
                                                <span>{t.name}</span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Sidebar description */}
                            {(() => {
                                let parsedImages = [];
                                if (post.image) {
                                    if (post.image.startsWith("[")) {
                                        try { parsedImages = JSON.parse(post.image); }
                                        catch (e) { parsedImages = [{ url: post.image }]; }
                                    } else { parsedImages = [{ url: post.image }]; }
                                }
                                const img = parsedImages[lightboxIndex];
                                if (!img || (!img.alt && (!img.tags || img.tags.length === 0))) return null;
                                return (
                                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-zinc-950 p-5 flex flex-col justify-between text-white select-text">
                                        <div className="space-y-5">
                                            <div className="border-b border-white/10 pb-3">
                                                <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Image Details</h4>
                                                <span className="text-[10px] text-zinc-500 font-mono">Image {lightboxIndex + 1} of {parsedImages.length}</span>
                                            </div>

                                            {img.alt && (
                                                <div className="space-y-1.5">
                                                    <h5 className="font-bold text-xs text-[#10B981] flex items-center gap-1">
                                                        <Info className="w-3.5 h-3.5" /> Accessibility ALT Text
                                                    </h5>
                                                    <p className="text-xs text-zinc-300 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/5">
                                                        &ldquo;{img.alt}&rdquo;
                                                    </p>
                                                </div>
                                            )}

                                            {img.tags && img.tags.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <h5 className="font-bold text-xs text-[#6366F1] flex items-center gap-1">
                                                        <UserPlus className="w-3.5 h-3.5" /> Tagged People
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {img.tags.map((t: any) => (
                                                            <div 
                                                                key={t.userId}
                                                                onClick={() => {
                                                                    setLightboxIndex(null);
                                                                    router.push(`/profile/${t.username}`);
                                                                }}
                                                                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all"
                                                            >
                                                                <Avatar className="w-7 h-7 border border-white/10 flex-shrink-0">
                                                                    <AvatarImage src={t.image || ""} />
                                                                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] text-[9px] font-bold">
                                                                        {t.name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-white truncate">{t.name}</div>
                                                                    <div className="text-[10px] text-zinc-400 truncate">@{t.username}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-[10px] text-zinc-500 pt-4 text-center select-none">
                                            SkilledCore High Engagement Media Viewer
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
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

            <ReportPostModal postId={post.id} isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            <SharePostModal post={post} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
        </div>
    );
}
