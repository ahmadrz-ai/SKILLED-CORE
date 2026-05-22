"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Share2, Send, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getShareConnections } from "@/app/(app)/feed/actions";
import { sendMessage } from "@/app/(app)/messages/actions";

interface SharePostModalProps {
    post: {
        id: string;
        author: {
            name: string;
        };
    };
    isOpen: boolean;
    onClose: () => void;
}

interface Connection {
    id: string;
    username: string | null;
    name: string;
    headline: string;
    avatar: string | null;
}

export function SharePostModal({ post, isOpen, onClose }: SharePostModalProps) {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingConnections, setLoadingConnections] = useState(false);
    const [sendingMap, setSendingMap] = useState<Record<string, "idle" | "sending" | "sent">>({});

    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : '';

    // Fetch user connections when the modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchConnections = async () => {
                setLoadingConnections(true);
                try {
                    const res = await getShareConnections();
                    if (res.success && res.connections) {
                        setConnections(res.connections);
                    }
                } catch (err) {
                    console.error("Error loading connections for share:", err);
                } finally {
                    setLoadingConnections(false);
                }
            };
            fetchConnections();
        } else {
            // Reset state when closed
            setSearchQuery("");
            setSendingMap({});
        }
    }, [isOpen]);

    // Filter connections based on search query
    const filteredConnections = connections.filter(conn =>
        conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conn.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.headline.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendInternal = async (connId: string) => {
        setSendingMap(prev => ({ ...prev, [connId]: "sending" }));
        try {
            const displayName = post.author.name;
            const postLabel = displayName.toLowerCase().endsWith('s') ? `${displayName}' Post` : `${displayName}'s Post`;
            const messageText = `Check Out this Amazing [${postLabel}](${postUrl}) on Skilled Core`;
            const res = await sendMessage(connId, messageText);
            if (res.success) {
                setSendingMap(prev => ({ ...prev, [connId]: "sent" }));
                toast.success("Post shared successfully inside chat!");
            } else {
                setSendingMap(prev => ({ ...prev, [connId]: "idle" }));
                toast.error("Failed to share in chat");
            }
        } catch (error) {
            setSendingMap(prev => ({ ...prev, [connId]: "idle" }));
            toast.error("An unexpected error occurred");
        }
    };

    const copyShareContent = async (silent = false) => {
        const displayName = post.author.name;
        const postLabel = displayName.toLowerCase().endsWith('s') ? `${displayName}' Post` : `${displayName}'s Post`;
        
        const plainText = `Check Out this Amazing [${postLabel}](${postUrl}) on Skilled Core`;
        const htmlText = `Check Out this Amazing <a href="${postUrl}">${postLabel}</a> on Skilled Core`;

        try {
            if (navigator.clipboard && window.ClipboardItem) {
                const plainBlob = new Blob([plainText], { type: "text/plain" });
                const htmlBlob = new Blob([htmlText], { type: "text/html" });
                const item = new ClipboardItem({
                    "text/plain": plainBlob,
                    "text/html": htmlBlob
                });
                await navigator.clipboard.write([item]);
            } else {
                await navigator.clipboard.writeText(plainText);
            }
            if (!silent) {
                toast.success("Post share text copied with clickable hyperlink!", {
                    description: "You can paste (Ctrl+V) it anywhere to share."
                });
            }
            return true;
        } catch (err) {
            console.error("Clipboard rich write failed, falling back to writeText:", err);
            try {
                await navigator.clipboard.writeText(plainText);
                if (!silent) {
                    toast.success("Share text copied to clipboard!");
                }
                return true;
            } catch (fallbackErr) {
                console.error("Clipboard fallback failed:", fallbackErr);
                if (!silent) {
                    toast.error("Could not copy share text to clipboard.");
                }
                return false;
            }
        }
    };

    const handleCopyLink = () => {
        copyShareContent(false);
    };

    const shareSocial = async (platform: "linkedin" | "twitter" | "whatsapp" | "facebook") => {
        const displayName = post.author.name;
        const postLabel = displayName.toLowerCase().endsWith('s') ? `${displayName}' Post` : `${displayName}'s Post`;
        const encodedUrl = encodeURIComponent(postUrl);

        if (platform === "linkedin") {
            // LinkedIn-specific plain-text format to prevent link stripping by LinkedIn's editor
            const linkedinText = `Check Out this Amazing ${postLabel} on Skilled Core: ${postUrl}`;
            try {
                await navigator.clipboard.writeText(linkedinText);
            } catch (err) {
                console.error("Failed to copy LinkedIn share text:", err);
            }
        } else {
            // Silently copy rich formatted text to clipboard for other platforms
            await copyShareContent(true);
        }

        // Dynamic clean text for platforms that support query prepopulation
        const cleanShareText = `Check Out this Amazing ${postLabel}: ${postUrl} on Skilled Core`;
        const text = encodeURIComponent(cleanShareText);

        let url = "";
        let platformName = "";

        switch (platform) {
            case "linkedin":
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                platformName = "LinkedIn";
                break;
            case "twitter":
                url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;
                platformName = "Twitter / X";
                break;
            case "whatsapp":
                url = `https://api.whatsapp.com/send?text=${text}`;
                platformName = "WhatsApp";
                break;
            case "facebook":
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                platformName = "Facebook";
                break;
        }

        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
            toast.success(`Opening ${platformName}...`, {
                description: "Post share text copied to clipboard! Press Ctrl+V (or Paste) to insert it."
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] sm:max-w-[480px] w-[calc(100%-2rem)] sm:w-full flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl">
                {/* Visual Accent Header */}
                <div className="bg-gradient-to-r from-[#6366F1]/5 via-[#7C3AED]/5 to-[#4F46E5]/5 px-6 py-5 border-b border-[#F3F4F6]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-[#111827]">Share Post</DialogTitle>
                        <DialogDescription className="text-sm text-[#6B7280]">
                            Share this post with your SkilledCore network or broadcast it to other platforms.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-5">
                    {/* Search and Internal Share */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF]" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search candidates or connections..."
                                className="pl-10 bg-[#F9FAFB] border-[#E5E7EB] placeholder:text-[#9CA3AF] text-[#111827] rounded-xl focus:ring-[#6366F1]/20 focus:border-[#6366F1] h-10 transition-all"
                            />
                        </div>

                        {/* Scrollable Connections List */}
                        <div className="border border-[#F3F4F6] rounded-xl bg-[#FCFDFE] overflow-hidden">
                            <div className="max-h-[220px] overflow-y-auto divide-y divide-[#F3F4F6] pr-1 scrollbar-thin">
                                {loadingConnections ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-xs text-[#9CA3AF] gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
                                        <span>Scanning connections database...</span>
                                    </div>
                                ) : filteredConnections.length > 0 ? (
                                    filteredConnections.map(conn => {
                                        const sendStatus = sendingMap[conn.id] || "idle";
                                        return (
                                            <div key={conn.id} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] transition-colors gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <Avatar className="w-9 h-9 border border-[#E5E7EB] flex-shrink-0">
                                                        <AvatarImage src={conn.avatar || undefined} />
                                                        <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold text-xs">{conn.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-xs text-[#111827] truncate leading-tight">{conn.name}</p>
                                                        <p className="text-[10px] text-[#6B7280] truncate leading-tight mt-0.5">{conn.headline}</p>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={sendStatus !== "idle"}
                                                    onClick={() => handleSendInternal(conn.id)}
                                                    className={`compact-btn h-7 px-3 text-xs font-semibold rounded-full border transition-all shrink-0 ${
                                                        sendStatus === "sent"
                                                            ? "bg-[#DEF7EC] border-[#BCF0DA] text-[#03543F] hover:bg-[#DEF7EC]"
                                                            : "bg-white border-[#C7D2FE] text-[#6366F1] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
                                                    }`}
                                                >
                                                    {sendStatus === "sending" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                                                    {sendStatus === "sent" ? (
                                                        <span className="flex items-center gap-0.5"><Check className="w-3.5 h-3.5 stroke-[3]" /> Sent</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Send</span>
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-xs text-[#9CA3AF]">
                                        {searchQuery ? "No matching connections found" : "No active connections to display"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Media Row Divider */}
                    <div className="relative py-1 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#F3F4F6]"></div>
                        </div>
                        <span className="relative bg-white px-3.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] font-mono leading-none">Share externally</span>
                    </div>

                    {/* Branded Social Grid */}
                    <div className="grid grid-cols-4 gap-2.5">
                        {/* LinkedIn */}
                        <button
                            onClick={() => shareSocial("linkedin")}
                            className="compact-btn flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#F4F8FA] hover:bg-[#EAF3F7] border border-[#E2EFF4] text-[#0077B5] transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 group w-full min-w-0"
                        >
                            <svg className="w-5 h-5 fill-current mb-1.5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                            <span className="text-[10px] font-bold text-[#6B7280] group-hover:text-[#0077B5] truncate w-full text-center">LinkedIn</span>
                        </button>

                        {/* X / Twitter */}
                        <button
                            onClick={() => shareSocial("twitter")}
                            className="compact-btn flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-900 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 group w-full min-w-0"
                        >
                            <svg className="w-4 h-4 fill-current mb-2 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span className="text-[10px] font-bold text-[#6B7280] group-hover:text-black truncate w-full text-center">Twitter / X</span>
                        </button>

                        {/* WhatsApp */}
                        <button
                            onClick={() => shareSocial("whatsapp")}
                            className="compact-btn flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#F5FBF7] hover:bg-[#EAF7EE] border border-[#E3F4E8] text-[#25D366] transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 group w-full min-w-0"
                        >
                            <svg className="w-5 h-5 fill-current mb-1.5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.832.002-2.627-1.02-5.1-2.885-6.963C16.585 1.946 14.118.916 11.99.916c-5.444 0-9.873 4.414-9.875 9.833-.001 1.762.478 3.484 1.39 5.017L2.457 20.25l4.19-1.096zM17.48 14.54c-.302-.15-1.785-.88-2.062-.98-.277-.1-.478-.15-.68.15-.202.3-.78.98-.957 1.18-.178.2-.355.225-.657.075-.302-.15-1.276-.47-2.43-1.498-.897-.8-1.502-1.787-1.678-2.088-.178-.3-.02-.462.13-.61.137-.135.302-.35.454-.525.15-.175.202-.3.302-.5.1-.2.05-.375-.025-.525-.075-.15-.68-1.64-.93-2.245-.244-.59-.49-.51-.68-.52-.176-.01-.377-.01-.578-.01-.2 0-.527.075-.803.375-.276.3-1.054 1.03-1.054 2.515s1.08 2.917 1.23 3.117c.15.2 2.126 3.245 5.15 4.553.718.31 1.28.496 1.717.636.72.23 1.375.197 1.892.12.577-.086 1.785-.73 2.037-1.435.25-.705.25-1.31.176-1.435-.074-.125-.275-.2-.577-.35z" />
                            </svg>
                            <span className="text-[10px] font-bold text-[#6B7280] group-hover:text-[#25D366] truncate w-full text-center">WhatsApp</span>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={() => shareSocial("facebook")}
                            className="compact-btn flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#F3F6FC] hover:bg-[#E7EEFB] border border-[#DEE7F8] text-[#1877F2] transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 group w-full min-w-0"
                        >
                            <svg className="w-5 h-5 fill-current mb-1.5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span className="text-[10px] font-bold text-[#6B7280] group-hover:text-[#1877F2] truncate w-full text-center">Facebook</span>
                        </button>
                    </div>
                </div>

                {/* Direct Copy Link Footer */}
                <div className="bg-[#FAFBFB] px-6 py-4.5 border-t border-[#F3F4F6] flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#6B7280] font-mono truncate select-all shadow-inner">
                        {postUrl}
                    </div>
                    <Button
                        size="sm"
                        onClick={handleCopyLink}
                        className="compact-btn bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-xs px-3.5 rounded-lg shrink-0 gap-1.5 shadow-sm active:scale-95 transition-transform"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
