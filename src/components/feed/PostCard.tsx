import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    ThumbsUp, MessageCircle, Repeat, Send, MoreHorizontal,
    Share2, Bookmark, Code, Trash2, Flag, XCircle, Edit, Plus, UserPlus, BadgeCheck,
    Tag, Info, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link2, Code2, Image as ImageIcon, Loader2
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
import { deletePost, reportPost, votePoll, updatePost, toggleFollow, toggleLike } from "@/app/(app)/feed/actions";
import { getCloudinarySignature } from "@/app/actions/cloudinary";
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
import { InstagramPoll } from "./InstagramPoll";
import { ReportPostModal } from "./ReportPostModal";
import { SharePostModal } from "./SharePostModal";
import { Tag as SharedTag } from "@/components/ui/tag";
import { sanitizeRichHtml } from "@/lib/sanitize";

// ─── Inline badge + hashtag decoration (shared by both render paths) ──────────
// Branding.md colors; gold is the exact AI-verified-skill gold (--verified-gold*).
const BADGE_CLASSES: Record<string, string> = {
    '+': 'bg-bg-card border-border-strong text-text-heading',
    ':': 'bg-sc-red-50 border-sc-red-200 text-sc-red-600',
    '/': 'bg-verified-gold-tint border-verified-gold-border text-verified-gold',
    '~': 'bg-sc-purple-100 border-sc-purple-200 text-sc-purple-800',
};
const BADGE_BASE = 'inline-flex items-center align-baseline px-2 py-0.5 rounded-md text-xs font-bold border';

/**
 * Decorates rich (WYSIWYG/HTML) post content: converts badge tokens and
 * hashtags inside TEXT segments into styled spans / search links. Posts created
 * with the rich composer are stored as HTML and rendered via
 * dangerouslySetInnerHTML — they never pass through parseContent, so without
 * this they got NO badges and NO clickable hashtags. Pure string transform
 * (identical on server and client → no hydration mismatch); skips the inside of
 * <a>, <code> and <pre> so links/snippets are never corrupted.
 */
function decorateHtmlContent(html: string): string {
    // SECURITY: strip XSS (script/on*/js: URIs) BEFORE decorating. Runs at the
    // render chokepoint (server SSR + client), so every post — existing or new —
    // is sanitized regardless of what was stored. Decoration below only ADDS our
    // own safe <span>/<a> templates, never re-introduces user markup.
    html = sanitizeRichHtml(html);
    const tokens = html.split(/(<[^>]+>)/g);
    let skipDepth = 0;
    return tokens.map((tok) => {
        if (tok.startsWith('<')) {
            const m = tok.match(/^<\s*(\/?)\s*(a|code|pre)\b/i);
            if (m) skipDepth = Math.max(0, skipDepth + (m[1] ? -1 : 1));
            return tok;
        }
        if (skipDepth > 0 || !tok) return tok;
        return decorateTextSegment(tok);
    }).join('');
}

function badgeHtml(text: string, trigger: string): string {
    return `<span class="${BADGE_BASE} ${BADGE_CLASSES[trigger] || BADGE_CLASSES['+']}">${text}</span>`;
}

function decorateTextSegment(text: string): string {
    // 1. Multi-word quoted badges: "/multi word badge", "multi word /badge",
    //    "multi /word badge" — the first trigger designates; only IT is removed.
    let out = text.replace(/"([^"<>]+)"/g, (full, quoted: string) => {
        const sym = quoted.match(/[+:/~]/);
        if (!sym) return full;
        const badgeText = quoted.replace(sym[0], '').replace(/\s+/g, ' ').trim();
        if (!badgeText) return full;
        return badgeHtml(badgeText, sym[0]);
    });

    // 2. Single-word badges: trigger stuck to the text (+black yes, + black no);
    //    boundary = segment start, whitespace, or &nbsp; (contentEditable spaces).
    out = out.replace(/(^|\s|&nbsp;)([+:/~])([A-Za-z0-9][\w-]*)/g,
        (_full, lead: string, trigger: string, word: string) => `${lead}${badgeHtml(word, trigger)}`);

    // 3. Clickable hashtags (the container's onClick already stops propagation
    //    for anchor tags).
    out = out.replace(/(^|\s|&nbsp;)#([A-Za-z0-9_]+)/g,
        (_full, lead: string, tag: string) =>
            `${lead}<a href="/search?q=%23${encodeURIComponent(tag)}" class="text-[#5B35D5] hover:underline font-semibold">#${tag}</a>`);

    return out;
}

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

    // WYSIWYG Edit Editor State
    const editEditorRef = useRef<HTMLDivElement>(null);
    const [editShowFormatting, setEditShowFormatting] = useState(true);
    const [editIsLinkDialogOpen, setEditIsLinkDialogOpen] = useState(false);
    const [editLinkText, setEditLinkText] = useState("");
    const [editLinkUrl, setEditLinkUrl] = useState("");
    const editSavedRangeRef = useRef<Range | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [editIsUploading, setEditIsUploading] = useState(false);

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

    const handleLike = async () => {
        const wasLiked = isLiked;
        const previousCount = likesCount;
        if (isLiked) {
            setLikesCount(prev => prev - 1);
        } else {
            setLikesCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);

        if (onLike) {
            onLike();
        } else {
            try {
                const res = await toggleLike(post.id);
                if (!res.success) {
                    setIsLiked(wasLiked);
                    setLikesCount(previousCount);
                    toast.error(res.message || "Failed to like post");
                }
            } catch (err) {
                console.error("Failed to toggle like:", err);
                setIsLiked(wasLiked);
                setLikesCount(previousCount);
                toast.error("Failed to like post");
            }
        }
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

    // WYSIWYG Edit Editor Helpers
    const syncEditEditorState = useCallback(() => {
        const el = editEditorRef.current;
        if (!el) return;
        setEditContent(el.innerHTML);
    }, []);

    const execEditFormat = useCallback((command: string, value?: string) => {
        editEditorRef.current?.focus();
        document.execCommand(command, false, value);
        syncEditEditorState();
    }, [syncEditEditorState]);

    const formatEditText = useCallback((style: string) => {
        switch (style) {
            case "bold":          execEditFormat("bold"); break;
            case "italic":        execEditFormat("italic"); break;
            case "underline":     execEditFormat("underline"); break;
            case "strikethrough": execEditFormat("strikeThrough"); break;
            case "bullet":        execEditFormat("insertUnorderedList"); break;
            case "number":        execEditFormat("insertOrderedList"); break;
            case "quote":
                editEditorRef.current?.focus();
                document.execCommand("formatBlock", false, "blockquote");
                syncEditEditorState();
                break;
            case "code": {
                const sel = window.getSelection();
                const selected = sel?.toString() || "code";
                document.execCommand("insertHTML", false,
                    `<code style="background:#F3F4F6;border:1px solid #E5E7EB;border-radius:4px;padding:2px 6px;font-family:monospace;font-size:0.85em;color:#DC2626;">${selected}</code>`);
                syncEditEditorState();
                break;
            }
            case "link": {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    editSavedRangeRef.current = sel.getRangeAt(0).cloneRange();
                    setEditLinkText(sel.toString());
                } else {
                    editSavedRangeRef.current = null;
                    setEditLinkText("");
                }
                setEditLinkUrl("");
                setEditIsLinkDialogOpen(true);
                break;
            }
            default: break;
        }
    }, [execEditFormat, syncEditEditorState]);

    const handleEditInsertLink = useCallback(() => {
        const displayName = editLinkText.trim() || "link";
        const url = editLinkUrl.trim();
        if (!url) { setEditIsLinkDialogOpen(false); return; }
        const href = url.startsWith("http") ? url : `https://${url}`;
        editEditorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && editSavedRangeRef.current) {
            sel.removeAllRanges();
            sel.addRange(editSavedRangeRef.current);
        }
        const html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#5B35D5;text-decoration:underline;">${displayName}</a>`;
        document.execCommand("insertHTML", false, html);
        syncEditEditorState();
        setEditIsLinkDialogOpen(false);
    }, [editLinkText, editLinkUrl, syncEditEditorState]);

    const insertEditText = useCallback((text: string) => {
        const editor = editEditorRef.current;
        if (!editor) return;
        editor.focus();
        // Restore cursor saved on mousedown (before focus theft occurred)
        if (editSavedRangeRef.current) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(editSavedRangeRef.current);
            }
            editSavedRangeRef.current = null;
        }
        document.execCommand("insertText", false, text);
        syncEditEditorState();
    }, [syncEditEditorState]);

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); execEditFormat("bold"); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") { e.preventDefault(); execEditFormat("italic"); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") { e.preventDefault(); execEditFormat("underline"); return; }
    };

    // Initialize editor content when modal opens
    useEffect(() => {
        if (isEditModalOpen && editEditorRef.current) {
            setTimeout(() => {
                if (editEditorRef.current) {
                    editEditorRef.current.innerHTML = post.content || "";
                    document.execCommand("defaultParagraphSeparator", false, "div");
                    editEditorRef.current.focus();
                    // Place cursor at end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(editEditorRef.current);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
                // Parse existing image from post
                if (post.image) {
                    try {
                        let parsedImages: any[] = [];
                        if (post.image.startsWith("{")) {
                            parsedImages = JSON.parse(post.image).images || [];
                        } else if (post.image.startsWith("[")) {
                            parsedImages = JSON.parse(post.image);
                        } else {
                            parsedImages = [{ url: post.image }];
                        }
                        if (parsedImages[0]?.url) setEditImagePreview(parsedImages[0].url);
                    } catch { setEditImagePreview(null); }
                } else {
                    setEditImagePreview(null);
                }
                setEditImageFile(null);
            }, 80);
        }
        if (!isEditModalOpen) {
            setEditIsLinkDialogOpen(false);
            setEditImageFile(null);
        }
    }, [isEditModalOpen, post.content, post.image]);

    const uploadEditImageToCloudinary = async (file: File): Promise<string> => {
        const sigRes = await getCloudinarySignature("feed");
        if (!sigRes.success || !sigRes.signature || !sigRes.timestamp || !sigRes.apiKey || !sigRes.cloudName || !sigRes.folder) {
            throw new Error(sigRes.message || "Failed to retrieve signature.");
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigRes.apiKey);
        formData.append("timestamp", sigRes.timestamp.toString());
        formData.append("signature", sigRes.signature);
        formData.append("folder", sigRes.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sigRes.cloudName}/image/upload`, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed.");
        const data = await res.json();
        return data.secure_url;
    };

    const handleUpdate = async () => {
        const rawHtml = editEditorRef.current?.innerHTML ?? editContent;
        setIsSaving(true);
        setEditIsUploading(false);

        let finalContent = rawHtml;
        let imageUrl = post.image; // keep existing image by default

        // If user uploaded a new image, upload it
        if (editImageFile) {
            setEditIsUploading(true);
            try {
                const secureUrl = await uploadEditImageToCloudinary(editImageFile);
                imageUrl = JSON.stringify([{ url: secureUrl, alt: "", tags: [] }]);
            } catch (err: any) {
                toast.error("Image upload failed: " + (err.message || "Unknown error"));
                setIsSaving(false);
                setEditIsUploading(false);
                return;
            }
            setEditIsUploading(false);
        } else if (editImagePreview === null && post.image) {
            // User removed the image
            imageUrl = null;
        }

        const result = await updatePost(post.id, finalContent);
        setIsSaving(false);

        if (result.success) {
            setContent(finalContent);
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

    // Inline post badges (plain-text path) — same shared Branding classes as the
    // HTML path's decorateHtmlContent, so both render identically.
    const renderBadge = (text: string, type: string) => (
        <span className={`${BADGE_BASE} ${BADGE_CLASSES[type] || BADGE_CLASSES['+']}`}>
            {text}
        </span>
    );

    const parseContent = (content: string) => {
        const parts: React.ReactNode[] = [];
        let keyCounter = 0;

        // Find all quoted badges first
        const quotedBadgeRegex = /"([^"]+)"/g;
        const quotedBadges: Array<{ start: number, end: number, badge: React.ReactNode }> = [];

        let match;
        while ((match = quotedBadgeRegex.exec(content)) !== null) {
            const quotedText = match[1];
            // First trigger symbol anywhere in the quote designates the badge type;
            // works for "/multi word badge", "multi word /badge", "multi /word badge".
            const symbolMatch = quotedText.match(/[+:/~]/);

            if (symbolMatch) {
                const trigger = symbolMatch[0];
                // Remove only the FIRST (designating) trigger so legit symbols in the
                // phrase survive (e.g. "/CI/CD pipeline" → "CI/CD pipeline").
                const badgeText = quotedText.replace(trigger, '').replace(/\s+/g, ' ').trim();

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
        // Trigger must be a standalone token: at string start or after whitespace,
        // immediately followed (no space) by the word to badge. This enforces the
        // documented rule — "+black" badges, "+ black" does NOT — and stops false
        // positives inside URLs (https://), emails (a:b), and a+b arithmetic.
        const singleBadgeRegex = /(^|\s)([+:/~])([A-Za-z0-9][\w-]*)/g;
        let keyCounter = startKeyCounter;
        let lastPos = 0;
        let match;

        while ((match = singleBadgeRegex.exec(text)) !== null) {
            const lead = match[1];                 // preserved whitespace/boundary
            const trigger = match[2];
            const word = match[3];
            const badgeStart = match.index + lead.length;

            if (badgeStart > lastPos) {
                const textBefore = text.substring(lastPos, badgeStart);
                parts.push(...parseLinks(textBefore, baseIndex + lastPos));
            }

            parts.push(<span key={`badge-${keyCounter++}`}>{renderBadge(word, trigger)}</span>);
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
                        return <span key={subKey} className="underline decoration-[#5B35D5]/50 decoration-wavy decoration-1 underline-offset-2">{part.slice(2, -2)}</span>;
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
                        <Link href={`/search?q=${encodeURIComponent(cleanTag)}`} className="text-[#5B35D5] hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
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
                        <Link href={`/profile/${cleanHandle}`} className="text-[#5B35D5] hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
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
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#5B35D5] hover:underline font-medium break-all" onClick={(e) => e.stopPropagation()}>
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
                        <Avatar className="w-10 h-10 border border-[#E5E7EB] cursor-pointer hover:border-[#5B35D5] transition-colors flex-shrink-0">
                            <AvatarImage src={post.author.avatar || undefined} />
                            <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] font-semibold text-sm">{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${authorUsername}`} className="hover:underline group/author flex items-center">
                                <span className="font-semibold text-[#111827] text-sm group-hover/author:text-[#5B35D5] transition-colors leading-none">
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
                                            <p>{post.author.plan === 'ULTRA' ? 'Elite Verified' : 'Verified Pro'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {post.author.role === 'ADMIN' && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED] text-[10px] font-bold uppercase border border-[#DDD6FE] leading-none">ADMIN</span>
                            )}
                            {post.author.role === 'RECRUITER' && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#EAE6FD] text-[#5B35D5] text-[10px] font-bold uppercase border border-[#B4A3F3] leading-none">RECRUITER</span>
                            )}
                            {post.author.isHiring && (
                                <span className="flex items-center px-1.5 py-0.5 rounded bg-[#EAE6FD] text-[#5B35D5] text-[10px] font-bold uppercase border border-[#B4A3F3] leading-none">Hiring</span>
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
                                    className="h-7 px-2.5 text-xs font-semibold text-[#5B35D5] hover:text-[#4A28C9] hover:bg-[#EAE6FD] border border-[#B4A3F3] rounded-full">
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
                                            : "text-[#5B35D5] bg-[#EAE6FD] hover:bg-[#D4CCF8] border-[#B4A3F3]")}>
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
                {/* ── Upgraded WYSIWYG Edit Dialog ── */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent
                        className="bg-white border-[#E5E7EB] w-[calc(100%-1rem)] sm:max-w-2xl p-0 overflow-visible shadow-2xl"
                        onOpenAutoFocus={(e) => { e.preventDefault(); editEditorRef.current?.focus(); }}
                    >
                        {/* Header */}
                        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E7EB]">
                            <DialogTitle className="text-base font-bold text-[#111827] flex items-center gap-2">
                                <Edit className="w-4 h-4 text-[#5B35D5]" /> Edit Post
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[#9CA3AF] mt-0.5">Your post will be updated instantly after saving.</DialogDescription>
                        </DialogHeader>

                        {/* Body */}
                        <div className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(85vh - 130px)" }}>

                            {/* Author row + formatting toolbar */}
                            <div className="px-5 pt-4 shrink-0">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <Avatar className="w-9 h-9 border border-[#E5E7EB] flex-shrink-0">
                                        <AvatarImage src={post.author.avatar || undefined} />
                                        <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] font-semibold text-sm">{post.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-sm text-[#111827] leading-none">{post.author.name}</div>
                                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">Editing post</div>
                                    </div>
                                </div>

                                {/* Formatting Toolbar */}
                                {editShowFormatting && (
                                    <div className="flex flex-wrap items-center gap-0.5 p-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {[
                                            { icon: <Bold className="w-3.5 h-3.5" />, action: "bold", title: "Bold" },
                                            { icon: <Italic className="w-3.5 h-3.5" />, action: "italic", title: "Italic" },
                                            { icon: <Underline className="w-3.5 h-3.5" />, action: "underline", title: "Underline" },
                                            { icon: <Strikethrough className="w-3.5 h-3.5" />, action: "strikethrough", title: "Strikethrough" },
                                        ].map(({ icon, action, title }) => (
                                            <Button key={action} type="button" variant="ghost" size="icon"
                                                onClick={() => formatEditText(action)}
                                                className="w-7 h-7 rounded-lg text-zinc-600 hover:text-black hover:bg-gray-100" title={title}>
                                                {icon}
                                            </Button>
                                        ))}
                                        <div className="w-px h-4 bg-gray-200 mx-0.5" />
                                        {[
                                            { icon: <List className="w-3.5 h-3.5" />, action: "bullet", title: "Bullet List" },
                                            { icon: <ListOrdered className="w-3.5 h-3.5" />, action: "number", title: "Numbered List" },
                                            { icon: <Quote className="w-3.5 h-3.5" />, action: "quote", title: "Blockquote" },
                                        ].map(({ icon, action, title }) => (
                                            <Button key={action} type="button" variant="ghost" size="icon"
                                                onClick={() => formatEditText(action)}
                                                className="w-7 h-7 rounded-lg text-zinc-600 hover:text-black hover:bg-gray-100" title={title}>
                                                {icon}
                                            </Button>
                                        ))}
                                        <div className="w-px h-4 bg-gray-200 mx-0.5" />
                                        <Button type="button" variant="ghost" size="icon"
                                            onClick={() => formatEditText("link")}
                                            className="w-7 h-7 rounded-lg text-zinc-600 hover:text-black hover:bg-gray-100" title="Insert Link">
                                            <Link2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon"
                                            onClick={() => formatEditText("code")}
                                            className="w-7 h-7 rounded-lg text-zinc-600 hover:text-black hover:bg-gray-100" title="Inline Code">
                                            <Code2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Editor + Image split pane */}
                            <div className={cn("flex overflow-y-auto flex-1", editImagePreview ? "divide-x divide-[#F3F4F6]" : "")}>

                                {/* WYSIWYG editor */}
                                <div className={cn("flex flex-col overflow-y-auto", editImagePreview ? "w-1/2 px-5 pb-4" : "w-full px-5 pb-4")}>
                                    <div
                                        ref={editEditorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={syncEditEditorState}
                                        onKeyDown={handleEditKeyDown}
                                        data-placeholder="Edit your post..."
                                        className={cn(
                                            "w-full bg-transparent text-[#111827] text-sm min-h-[120px] outline-none caret-[#5B35D5] cursor-text",
                                            "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline",
                                            "[&_a]:text-[#5B35D5] [&_a]:underline [&_a]:cursor-pointer",
                                            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5",
                                            "[&_blockquote]:border-l-4 [&_blockquote]:border-[#5B35D5]/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#6B7280] [&_blockquote]:my-1",
                                            "[&_code]:bg-[#F3F4F6] [&_code]:border [&_code]:border-[#E5E7EB] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-red-600",
                                            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#9CA3AF] [&:empty]:before:pointer-events-none"
                                        )}
                                        style={{ whiteSpace: "pre-wrap" }}
                                    />
                                </div>

                                {/* Image preview panel */}
                                {editImagePreview && (
                                    <div className="w-1/2 flex items-center justify-center p-3 bg-[#F9FAFB] relative overflow-hidden">
                                        <div className="relative w-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-black/5" style={{ maxHeight: "220px" }}>
                                            <img
                                                src={editImagePreview}
                                                alt="Post image"
                                                className="w-full h-full object-contain"
                                                style={{ maxHeight: "220px" }}
                                            />
                                            {(isSaving && editIsUploading) && (
                                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[1px] text-white gap-2 z-30 rounded-xl">
                                                    <Loader2 className="w-6 h-6 animate-spin text-[#5B35D5]" />
                                                    <span className="text-[10px] font-semibold">Uploading...</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => { setEditImagePreview(null); setEditImageFile(null); }}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-md z-20"
                                                title="Remove image"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom toolbar */}
                            <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB] shrink-0">
                                <div className="flex items-center gap-0.5">
                                    {/* Hashtag */}
                                    <Button variant="ghost" size="sm"
                                        onMouseDown={(e) => {
                                            // Capture cursor BEFORE mousedown can steal focus from the editor
                                            e.preventDefault();
                                            const sel = window.getSelection();
                                            if (sel && sel.rangeCount > 0) {
                                                editSavedRangeRef.current = sel.getRangeAt(0).cloneRange();
                                            }
                                        }}
                                        onClick={() => insertEditText(" #")}
                                        className="text-[#5B35D5] hover:bg-[#EAE6FD] font-bold px-2 rounded-full text-xs h-8">
                                        # Hashtag
                                    </Button>
                                    {/* Mention */}
                                    <Button variant="ghost" size="sm"
                                        onMouseDown={(e) => {
                                            // Capture cursor BEFORE mousedown can steal focus from the editor
                                            e.preventDefault();
                                            const sel = window.getSelection();
                                            if (sel && sel.rangeCount > 0) {
                                                editSavedRangeRef.current = sel.getRangeAt(0).cloneRange();
                                            }
                                        }}
                                        onClick={() => insertEditText(" @")}
                                        className="text-[#5B35D5] hover:bg-[#EAE6FD] font-bold px-2 rounded-full text-xs h-8">
                                        @ Mention
                                    </Button>

                                    <div className="w-px h-5 bg-[#E5E7EB] mx-1" />

                                    {/* Formatting toggle */}
                                    <Button variant="ghost" size="icon"
                                        className={cn(
                                            "rounded-full w-8 h-8 border transition-all duration-200",
                                            editShowFormatting
                                                ? "text-[#5B35D5] bg-[#EAE6FD] border-[#5B35D5]/30 hover:bg-[#EAE6FD]"
                                                : "text-zinc-500 border-zinc-200/80 hover:border-zinc-300 hover:bg-[#F3F4F6]"
                                        )}
                                        onClick={() => setEditShowFormatting(!editShowFormatting)}
                                        title="Text Formatting">
                                        <span className="font-serif font-extrabold text-xs relative flex items-center justify-center">
                                            A<span className="absolute -bottom-1 -right-1 text-[7px]">✎</span>
                                        </span>
                                    </Button>

                                    {/* Image upload */}
                                    <input
                                        type="file"
                                        ref={editFileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (file.size >= 4 * 1024 * 1024) { toast.error("Image must be under 4MB."); return; }
                                            setEditImageFile(file);
                                            setEditImagePreview(URL.createObjectURL(file));
                                            if (editFileInputRef.current) editFileInputRef.current.value = "";
                                        }}
                                    />
                                    <Button variant="ghost" size="icon"
                                        className={cn("rounded-full w-8 h-8 hover:bg-[#F3F4F6] text-[#6B7280]", editImagePreview ? "text-[#5B35D5] bg-[#EAE6FD]" : "")}
                                        onClick={() => editFileInputRef.current?.click()}
                                        title="Change image">
                                        <ImageIcon className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Save / Cancel */}
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}
                                        className="border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6] h-8 px-4 text-xs rounded-full">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdate} disabled={isSaving}
                                        className="bg-[#5B35D5] hover:bg-[#4A28C9] text-white h-8 px-5 text-xs rounded-full font-bold shadow-sm flex items-center gap-1.5">
                                        {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Insert Link overlay */}
                        {editIsLinkDialogOpen && (
                            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#5B35D5]/10 backdrop-blur-[2px] p-4 rounded-2xl animate-in fade-in duration-200">
                                <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl max-w-xs w-full p-5 text-[#111827] border-t-4 border-t-[#5B35D5]">
                                    <h3 className="text-sm font-extrabold text-[#111827] mb-4 flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-[#5B35D5]" /> Insert link
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">Display text</label>
                                            <input type="text" value={editLinkText} onChange={(e) => setEditLinkText(e.target.value)}
                                                placeholder="Link text" autoFocus
                                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] placeholder-gray-400 focus:border-[#5B35D5] focus:outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider mb-1">URL</label>
                                            <input type="text" value={editLinkUrl} onChange={(e) => setEditLinkUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                onKeyDown={(e) => { if (e.key === "Enter") handleEditInsertLink(); }}
                                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] placeholder-gray-400 focus:border-[#5B35D5] focus:outline-none transition-all" />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <Button variant="outline" className="flex-1 border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6] h-8 text-xs rounded-xl"
                                                onClick={() => setEditIsLinkDialogOpen(false)}>Cancel</Button>
                                            <Button className="flex-1 bg-[#5B35D5] hover:bg-[#4A28C9] text-white h-8 text-xs font-bold rounded-xl"
                                                onClick={handleEditInsertLink}>Insert</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                <div className="text-sm text-[#374151] leading-relaxed">
                    {(() => {
                        const isHtml = content.trimStart().startsWith("<");
                        const TEXT_LIMIT = 240;
                        const LINE_LIMIT = 4;

                        if (isHtml) {
                            // WYSIWYG HTML content path
                            // Extract plain text from HTML to determine fold threshold
                            const tempDiv = typeof document !== "undefined" ? document.createElement("div") : null;
                            let plainText = content;
                            if (tempDiv) {
                                tempDiv.innerHTML = content;
                                plainText = tempDiv.innerText || tempDiv.textContent || "";
                            }
                            const lines = plainText.split("\n");
                            const isLineExceeded = lines.length > LINE_LIMIT;
                            const isCharExceeded = plainText.length > TEXT_LIMIT;
                            const shouldFold = isCharExceeded || isLineExceeded;

                            return (
                                <>
                                    <div
                                        className={cn(
                                            "post-html-content",
                                            "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline",
                                            "[&_a]:text-[#5B35D5] [&_a]:underline [&_a]:cursor-pointer hover:[&_a]:text-[#4A28C9]",
                                            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5",
                                            "[&_blockquote]:border-l-4 [&_blockquote]:border-[#5B35D5]/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#6B7280] [&_blockquote]:my-1",
                                            "[&_code]:bg-[#F3F4F6] [&_code]:border [&_code]:border-[#E5E7EB] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-red-600",
                                            !isExpanded && shouldFold && "line-clamp-4"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: decorateHtmlContent(content) }}
                                        onClick={(e) => {
                                            // Make links clickable without propagating to post click
                                            const target = e.target as HTMLElement;
                                            if (target.tagName === "A") e.stopPropagation();
                                        }}
                                    />
                                    {!isExpanded && shouldFold && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsExpanded(true);
                                            }}
                                            className="text-[#5B35D5] hover:text-[#4A28C9] font-semibold hover:underline transition-colors ml-1 focus:outline-none"
                                        >
                                            more
                                        </button>
                                    )}
                                </>
                            );
                        }

                        // Legacy plain-text / markdown path (backward compat)
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
                                <span className="whitespace-pre-wrap">{parseContent(displayContent)}</span>
                                {!isExpanded && shouldFold && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(true);
                                        }}
                                        className="text-[#5B35D5] hover:text-[#4A28C9] font-semibold hover:underline transition-colors ml-1 focus:outline-none"
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

                {/* Tags — only those NOT already written inline in the body. Hashtags
                    typed in the post are made clickable inline by parseContent, so
                    rendering post.tags chips for them duplicated every tag (a plain
                    inline copy + a chip). We now show chips solely for tags that have
                    no inline counterpart, killing the duplication. */}
                {(() => {
                    const bodyLower = (post.content || '').toLowerCase();
                    const extraTags = (post.tags || []).filter(
                        (t) => !bodyLower.includes(`#${t.replace('#', '').toLowerCase()}`)
                    );
                    if (extraTags.length === 0) return null;
                    return (
                        <div className="flex flex-wrap gap-2 mt-3 mb-2">
                            {extraTags.map((tag, i) => (
                                <Link key={i} href={`/search?q=%23${tag.replace('#', '')}`}>
                                    <SharedTag className="hover:bg-sc-purple-100 transition-colors cursor-pointer">
                                        #{tag.replace('#', '')}
                                    </SharedTag>
                                </Link>
                            ))}
                        </div>
                    );
                })()}

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

                {/* Single Image Fit Natural Aspect Ratio Container */}
                {(() => {
                    if (!post.image) return null;

                    let parsedImages: Array<{ url: string; alt?: string; tags?: any[] }> = [];

                    try {
                        if (post.image.startsWith("{")) {
                            const parsedObj = JSON.parse(post.image);
                            parsedImages = parsedObj.images || [];
                        } else if (post.image.startsWith("[")) {
                            parsedImages = JSON.parse(post.image);
                        } else {
                            parsedImages = [{ url: post.image }];
                        }
                    } catch (e) {
                        parsedImages = [{ url: post.image }];
                    }

                    if (parsedImages.length === 0) return null;

                    // Strictly grab the first image under the new single-image guidelines
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
                            {img.tags && img.tags.map((t: any, idx: number) => (
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
                                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] shadow-2xl flex items-center gap-1 cursor-pointer"
                                    >
                                        <Tag className="w-3 h-3 text-[var(--sc-purple-600)]" />
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
                                <div 
                                    className="absolute bottom-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--sc-gray-100)] text-[var(--text-body)] border border-[var(--border-default)] backdrop-blur-sm pointer-events-none select-none flex items-center gap-1"
                                >
                                    <UserPlus className="w-2.5 h-2.5 text-[var(--text-secondary)]" />
                                    <span>{img.tags.length} tagged</span>
                                </div>
                            )}
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
                                                className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] shadow-2xl flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                            >
                                                <Tag className="w-3.5 h-3.5 text-[var(--sc-purple-600)]" />
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
                                                {parsedImages.length > 1 && (
                                                    <span className="text-[10px] text-zinc-500 font-mono">Image {lightboxIndex + 1} of {parsedImages.length}</span>
                                                )}
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
                                                    <h5 className="font-bold text-xs text-[#5B35D5] flex items-center gap-1">
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
                                                                    <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] text-[9px] font-bold">
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
                        className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium cursor-pointer",
                            isLiked ? "text-[#5B35D5] bg-[#EAE6FD]" : "text-[#6B7280] md:hover:text-[#5B35D5] md:hover:bg-[#EAE6FD]")}>
                        <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                        <span>{likesCount}</span>
                    </button>
                    <button onClick={() => setShowComments(!showComments)}
                        className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium cursor-pointer",
                            showComments ? "text-[#059669] bg-[#ECFDF5]" : "text-[#6B7280] md:hover:text-[#059669] md:hover:bg-[#ECFDF5]")}>
                        <MessageCircle className={cn("w-3.5 h-3.5", showComments && "fill-current")} />
                        <span>{post.comments}</span>
                    </button>
                    <button onClick={() => toast.success("Reposted to your network.")}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] md:hover:text-[#5B35D5] md:hover:bg-[#EAE6FD] transition-all font-medium cursor-pointer">
                        <Repeat className="w-3.5 h-3.5" /><span>Repost</span>
                    </button>
                    <button onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] md:hover:text-[#5B35D5] md:hover:bg-[#EAE6FD] transition-all font-medium cursor-pointer">
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
