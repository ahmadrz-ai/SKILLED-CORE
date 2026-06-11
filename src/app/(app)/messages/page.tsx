'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search, Phone, Video, MoreVertical, Paperclip, Send,
    Check, CheckCircle2, Circle, MessageSquare, CheckCheck,
    Smile, CornerUpLeft, Trash2, Copy, AlertCircle, Heart,
    ThumbsUp, ArrowLeft
} from 'lucide-react';
import { EmojiPicker } from '@/components/shared/EmojiPicker';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import {
    getConversations, getMessages, sendMessage, startConversation,
    getUserDetails, reactToMessage, unsendMessage
} from './actions';
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { Loader2 } from "lucide-react";
import InvitationCard from "@/components/chat/InvitationCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import ReactMarkdown from 'react-markdown';
import { usePresence, useConversationChannel } from '@/hooks/useChat';
import { getAblyClient } from '@/lib/ablyClient';
import { ImageLightbox } from '@/components/admin/ImageLightbox';

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialUserId = searchParams.get('userId');

    const isSelectionInitialized = useRef(false);

    const handleSelectContact = (contactId: string) => {
        isSelectionInitialized.current = true;
        setSelectedContactId(contactId);
        const params = new URLSearchParams(searchParams.toString());
        params.set('userId', contactId);
        router.replace(`?${params.toString()}`);
    };

    // Mobile: return from an open thread to the conversation list.
    const handleBack = () => {
        isSelectionInitialized.current = true; // prevent auto-reselect of the first conversation
        setSelectedContactId(null);
        setTempContact(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('userId');
        const qs = params.toString();
        router.replace(qs ? `?${qs}` : window.location.pathname);
    };

    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [tempContact, setTempContact] = useState<any | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('User');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserName, setCurrentUserName] = useState<string>('Someone');
    const scrollRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
        }
    };

    // Attachment upload — Cloudinary (UploadThing is resume-PDF-only now).
    const [isUploading, setIsUploading] = useState(false);
    const uploadAttachment = async (file: File) => {
        setIsUploading(true);
        try {
            const res = await uploadToCloudinary(file, { folder: "messages" });
            const type = res.resourceType === "image" ? "image" : res.resourceType === "video" ? "video" : "file";
            await handleSend(undefined, res.url, type);
        } catch (err: any) {
            toast.error(err?.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    // ... (Keep existing useEffects for loading/polling/scrolling)
    const lastHandledUserId = useRef<string | null>(null);

    // ... (Keep existing useEffects for loading/polling/scrolling)
    useEffect(() => { loadConversations(); }, []);
    useEffect(() => {
        if (initialUserId && conversations.length > 0 && lastHandledUserId.current !== initialUserId) {
            const existing = conversations.find(c => c.contactId === initialUserId);
            if (existing) {
                setSelectedContactId(existing.contactId);
                setTempContact(null);
                lastHandledUserId.current = initialUserId;
                isSelectionInitialized.current = true;
            } else {
                fetchUserDetails(initialUserId);
                lastHandledUserId.current = initialUserId;
                isSelectionInitialized.current = true;
            }
        }
    }, [initialUserId, conversations]);

    async function fetchUserDetails(userId: string) {
        const res = await getUserDetails(userId);
        if (res.success) {
            setTempContact({
                contactId: res.user!.id,
                name: res.user!.name,
                avatar: res.user!.avatar,
                role: res.user!.role,
                lastMessage: "New Conversation",
                time: "",
                unread: 0,
                online: false
            });
            setSelectedContactId(userId);
        }
    }

    async function loadConversations(silent = false) {
        if (!silent) setLoading(true);
        // Bug 9: guard with try/finally so a thrown getConversations() (e.g. a DB
        // hiccup) can never leave the conversation list spinner stuck forever — it
        // resolves to the empty state instead.
        try {
            const res = await getConversations();
            if (res.success) {
                setConversations(res.conversations);
                setCurrentUserRole(res.userRole || 'User');
                if (res.userId) setCurrentUserId(res.userId);
                if (res.userName) setCurrentUserName(res.userName);
                if (tempContact) {
                    const inList = res.conversations.find((c: any) => c.contactId === tempContact.contactId);
                    if (inList) setTempContact(null);
                }
                // Auto-open the first conversation only on desktop. On mobile the list
                // is the landing view (list↔thread toggle), so we don't pre-select.
                const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
                if (isDesktop && !selectedContactId && res.conversations.length > 0 && !initialUserId && !isSelectionInitialized.current) {
                    const firstContact = res.conversations[0];
                    if (firstContact) {
                        setSelectedContactId(firstContact.contactId);
                        isSelectionInitialized.current = true;
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    const activeContactIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedContactId) return;
        
        const load = async () => {
            // If we are switching to a new contact, clear the old messages immediately
            if (activeContactIdRef.current !== selectedContactId) {
                setMessages([]);
                activeContactIdRef.current = selectedContactId;
            }

            if (tempContact && tempContact.contactId === selectedContactId) {
                setMessages([]);
                return;
            }
            
            const conversation = conversations.find(c => c.contactId === selectedContactId);
            if (conversation) {
                if (messages.length === 0) setChatLoading(true);
                const res = await getMessages(conversation.id);
                if (res.success) {
                    setMessages(res.messages);
                } else {
                    toast.error("Failed to load chat. Database might be sleeping, retrying...");
                }
                setChatLoading(false);
            }
        };
        load();
        
        // Slow reconciliation poll — realtime (below) handles instant delivery;
        // this only heals missed events if the socket ever drops.
        const interval = setInterval(async () => {
            const conversation = conversations.find(c => c.contactId === selectedContactId);
            if (conversation) {
                const res = await getMessages(conversation.id);
                if (res.success) setMessages(res.messages);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [selectedContactId, conversations, tempContact]);

    useEffect(() => {
        if (scrollRef.current && isNearBottomRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, selectedContactId, replyingTo]);

    // ---- Realtime (hybrid Ably layer) ----------------------------------------
    const onlineIds = usePresence(currentUserId);

    const activeConversation = conversations.find(c => c.contactId === selectedContactId);
    const activeConversationId = activeConversation?.id || null;

    const { typingUsers, sendTyping, publishRead, publishDelivered } = useConversationChannel(
        activeConversationId,
        currentUserId,
        currentUserName,
        {
            // A new message arrived in the open thread.
            onMessage: (d) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === d.id)) return prev; // dedupe vs optimistic/poll
                    return [...prev, {
                        id: d.id,
                        text: d.content,
                        attachmentUrl: d.attachmentUrl,
                        attachmentType: d.attachmentType,
                        sender: d.senderId === currentUserId ? 'me' : 'them',
                        senderId: d.senderId,
                        time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'delivered',
                        reactions: [],
                        isDeleted: false,
                        replyTo: d.replyTo || null,
                    }];
                });
                // Ack delivery, and since the thread is open, mark read immediately.
                publishDelivered(d.id);
                publishRead();
                loadConversations(true);
            },
            onReaction: (d) => {
                setMessages(prev => prev.map(m => m.id === d.messageId ? { ...m, reactions: d.reactions || [] } : m));
            },
            onUnsend: (d) => {
                setMessages(prev => prev.map(m => m.id === d.messageId ? { ...m, isDeleted: true, text: "Message unsent", attachmentUrl: null } : m));
            },
            // The other side read the thread → flip our sent messages to 'read'.
            onRead: () => {
                setMessages(prev => prev.map(m => m.sender === 'me' ? { ...m, status: 'read' } : m));
            },
            // The other side's client received one of our messages → 'delivered'.
            onDelivered: (messageId) => {
                setMessages(prev => prev.map(m => (m.id === messageId && m.status !== 'read') ? { ...m, status: 'delivered' } : m));
            },
        },
    );

    // When we open a thread (or its messages load), tell the other side we've read it.
    useEffect(() => {
        if (activeConversationId && messages.length > 0) publishRead();
    }, [activeConversationId, messages.length, publishRead]);


    const handleSend = async (e?: React.FormEvent, attachmentUrl?: string, attachmentType?: string) => {
        e?.preventDefault();
        if ((!messageInput.trim() && !attachmentUrl) || !selectedContactId) return;

        const currentInput = messageInput;
        const currentReply = replyingTo;
        setMessageInput('');
        setReplyingTo(null);

        const tempId = 'temp-' + Date.now();
        const optimisticMsg = {
            id: tempId,
            text: currentInput || (attachmentUrl ? "Sent an attachment" : ""),
            attachmentUrl,
            attachmentType,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            replyTo: currentReply ? { id: currentReply.id, content: currentReply.text, senderName: currentReply.sender === 'me' ? 'You' : selectedContact?.name, senderImage: currentReply.sender === 'me' ? undefined : selectedContact?.avatar } : null
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // If this is a brand-new conversation, our existing Ably token predates the
        // new channel — re-authorize so live delivery/typing work without a reload.
        const wasNewConversation = !conversations.some(c => c.contactId === selectedContactId);

        const res = await sendMessage(selectedContactId, currentInput, attachmentUrl, attachmentType, currentReply?.id);
        if (res.success) {
            isNearBottomRef.current = true; // Force scroll to bottom when sending
            // Swap the optimistic temp id for the real DB id so delivered/read acks match.
            const realId = (res.message && typeof res.message === 'object') ? (res.message as any).id : null;
            if (realId) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: realId } : m));
            }
            if (wasNewConversation) {
                try { getAblyClient()?.auth.authorize(); } catch { /* token refreshes on next connect */ }
            }
            loadConversations(true);
        } else {
            toast.error("Failed to send");
        }
    };

    const handleReaction = async (msgId: string, emoji: string) => {
        const res = await reactToMessage(msgId, emoji);
        // Apply the authoritative reaction set; the realtime "reaction" event keeps
        // the other participant's view in sync.
        if (res.success && res.reactions) {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: res.reactions } : m));
        }
    };

    const handleUnsend = async (msgId: string) => {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, text: "Message unsent" } : m));
        await unsendMessage(msgId);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectedContact = conversations.find(c => c.contactId === selectedContactId) || tempContact;
    const canCall = currentUserRole === 'ADMIN' || currentUserRole?.includes('Recruiter');

    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-64px)] w-full flex bg-bg-page text-text-body overflow-hidden font-sans">
            {/* Sidebar */}
            <div className={cn(
                "w-full md:w-80 lg:w-96 border-r border-border-sidebar bg-bg-sidebar flex-col flex-shrink-0 z-10",
                selectedContact ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 lg:p-6 border-b border-border-sidebar flex flex-col gap-4 bg-bg-sidebar relative z-20">
                    <h2 className="text-xl font-bold text-text-heading tracking-tight">
                        Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-input border border-border-input rounded-lg pl-10 pr-4 py-2 text-sm text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus-shadow transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-bg-sidebar">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-text-placeholder" /></div>
                    ) : filteredConversations.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => handleSelectContact(contact.contactId)}
                            className={cn(
                                "flex items-center gap-4 p-4 cursor-pointer hover:bg-bg-sidebar-hover transition-colors border-b border-border-subtle relative",
                                selectedContactId === contact.contactId ? "bg-bg-sidebar-active" : "bg-transparent"
                            )}
                        >
                            {selectedContactId === contact.contactId && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sc-purple-600" />
                            )}
                            <div className="relative ml-1">
                                <Avatar className="w-12 h-12 border border-border-default">
                                    <AvatarImage src={contact.avatar} />
                                    <AvatarFallback className="bg-bg-sidebar-active text-text-sidebar-active font-semibold">{contact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {onlineIds.has(contact.contactId) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-bg-sidebar rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-semibold text-sm truncate text-text-heading">{contact.name}</h3>
                                    <span className="text-[11px] text-text-tertiary font-medium">{contact.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={cn("text-xs truncate w-40", contact.unread > 0 ? "text-text-heading font-semibold" : "text-text-secondary")}>
                                        {contact.lastMessage}
                                    </p>
                                    {contact.unread > 0 && (
                                        <div className="w-2.5 h-2.5 bg-sc-purple-600 rounded-full shadow-sm" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-bg-secondary-panel relative">
                    {/* Header */}
                    <div className="h-[73px] px-4 md:px-6 border-b border-border-default flex items-center justify-between bg-bg-page z-20 shadow-sc-sm">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <button
                                onClick={handleBack}
                                aria-label="Back to conversations"
                                className="md:hidden -ml-1 p-1.5 rounded-full text-text-secondary hover:text-text-heading hover:bg-bg-sidebar-hover transition-colors shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="relative">
                                <Avatar className="w-10 h-10 border border-border-default">
                                    <AvatarImage src={selectedContact.avatar} />
                                    <AvatarFallback className="bg-bg-sidebar-active text-text-sidebar-active font-semibold">{selectedContact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {onlineIds.has(selectedContact.contactId) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-bg-page rounded-full" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-base text-text-heading">{selectedContact.name}</h3>
                                {typingUsers.length > 0 ? (
                                    <p className="text-xs text-text-brand font-medium animate-pulse">typing…</p>
                                ) : onlineIds.has(selectedContact.contactId) ? (
                                    <p className="text-xs text-green-600 font-medium">Online</p>
                                ) : (
                                    <p className="text-xs text-text-secondary">{selectedContact.role || 'Offline'}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            {canCall && <Video className="w-6 h-6 text-text-secondary hover:text-text-brand transition-colors cursor-pointer" />}
                            <AlertCircle className="w-6 h-6 text-text-secondary hover:text-text-brand transition-colors cursor-pointer" />
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar scroll-smooth" ref={scrollRef} onScroll={handleScroll}>
                        {messages.map((msg, i) => {
                            const isMe = msg.sender === 'me';
                            const prev = messages[i - 1];
                            const next = messages[i + 1];
                            const isFirst = !prev || prev.sender !== msg.sender;
                            const isLast = !next || next.sender !== msg.sender;
                            const showAvatar = !isMe && isLast;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={cn("flex group items-end mb-1", isMe ? "justify-end" : "justify-start")}
                                >
                                    {/* Action Helper (Left for Me, Right for Them) */}
                                    {isMe && <MessageActions msg={msg} onReply={() => setReplyingTo(msg)} onUnsend={() => handleUnsend(msg.id)} onCopy={handleCopy} />}

                                    {!isMe && (
                                        <div className="w-8 mr-2 flex-shrink-0">
                                            {showAvatar && (
                                                <Avatar className="w-7 h-7">
                                                    <AvatarImage src={selectedContact.avatar} />
                                                    <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )}

                                    <ContextMenu>
                                        <ContextMenuTrigger asChild>
                                            <div className={cn(
                                                "max-w-[75%] md:max-w-[500px] w-fit relative px-4 py-2.5 text-[15px] shadow-sm",
                                                // A deleted bubble must NOT carry force-white-text: the light-shim
                                                // forces white on it and all children while the bg goes transparent
                                                // → unreadable white-on-white. Render it as a neutral ghost instead.
                                                msg.isDeleted
                                                    ? "italic text-text-placeholder bg-transparent border border-border-default shadow-none rounded-2xl"
                                                    : isMe
                                                        ? `${isLast ? 'rounded-br-sm' : 'rounded-br-2xl'} ${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-sm'} bg-sc-purple-600 text-text-inverse force-white-text rounded-l-2xl`
                                                        : `${isLast ? 'rounded-bl-sm' : 'rounded-bl-2xl'} ${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-sm'} bg-bg-card border border-border-default text-text-body rounded-r-2xl`
                                            )}>
                                                {/* Reply Context */}
                                                {msg.replyTo && (
                                                    <div className={cn(
                                                        "mb-2 pl-2 pr-2.5 border-l-2 text-xs opacity-90 py-1 rounded flex items-center gap-2",
                                                        isMe ? "border-text-inverse/50 bg-sc-purple-700/50" : "border-border-brand bg-bg-secondary-panel text-text-secondary"
                                                    )}>
                                                        <Avatar className="w-5 h-5 flex-shrink-0">
                                                            <AvatarImage src={msg.replyTo.senderImage || undefined} />
                                                            <AvatarFallback className="text-[8px]">{(msg.replyTo.senderName || 'U').charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className={cn("font-semibold leading-tight", isMe ? "text-text-inverse" : "text-text-brand")}>{msg.replyTo.senderName}</p>
                                                            <p className="truncate leading-tight">{msg.replyTo.content}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <RenderMessageContent msg={msg} isMe={isMe} onAccept={() => router.push('/interview')} />

                                                {/* Reactions */}
                                                {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                                                    <div className={cn(
                                                        "absolute -bottom-2 h-5 px-1 bg-bg-card border border-border-default rounded-full flex items-center justify-center text-[10px] shadow-sc-xs whitespace-nowrap z-10",
                                                        isMe ? "right-0" : "left-0"
                                                    )}>
                                                        {msg.reactions.map((r: any, idx: number) => <span key={idx}>{r.emoji}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48 bg-bg-dropdown border border-border-dropdown text-text-body shadow-sc-dropdown">
                                            <ContextMenuItem onSelect={() => setReplyingTo(msg)} className="focus:bg-bg-dropdown-item-hover cursor-pointer text-sm">Reply</ContextMenuItem>
                                            <ContextMenuItem onSelect={() => handleCopy(msg.text)} className="focus:bg-bg-dropdown-item-hover cursor-pointer text-sm">Copy</ContextMenuItem>
                                            {isMe && !msg.isDeleted && (
                                                <ContextMenuItem onSelect={() => handleUnsend(msg.id)} className="focus:bg-bg-error/30 text-text-error focus:text-text-error cursor-pointer text-sm font-medium">
                                                    Unsend
                                                </ContextMenuItem>
                                            )}
                                        </ContextMenuContent>
                                    </ContextMenu>

                                    {isMe && isLast && !msg.isDeleted && <MessageStatus status={msg.status} />}

                                    {/* Action Helper (Right for Theirs, Left for Mine) */}
                                    {!isMe && <MessageActions msg={msg} onReply={() => setReplyingTo(msg)} onReact={(emoji: string) => handleReaction(msg.id, emoji)} onCopy={handleCopy} />}

                                </motion.div>
                            );
                        })}

                        {/* Typing indicator bubble */}
                        <AnimatePresence>
                            {typingUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className="flex items-end mb-1 justify-start"
                                >
                                    <div className="w-8 mr-2 flex-shrink-0">
                                        <Avatar className="w-7 h-7">
                                            <AvatarImage src={selectedContact.avatar} />
                                            <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="bg-bg-card border border-border-default rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-text-placeholder rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-text-placeholder rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-text-placeholder rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-bg-page border-t border-border-default z-20">
                        {replyingTo && (
                            <div className="flex justify-between items-center mb-3 p-3 bg-bg-secondary-panel rounded-xl border border-border-default">
                                <div>
                                    <p className="text-xs text-text-secondary">Replying to <span className="text-text-heading font-semibold">{replyingTo.sender === 'me' ? 'Yourself' : selectedContact.name}</span></p>
                                    <p className="text-sm text-text-secondary truncate max-w-xs">{replyingTo.text}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 rounded-full p-0 text-text-secondary hover:text-text-heading hover:bg-bg-secondary-panel">X</Button>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {/* Main Input Bar */}
                            <div className="flex-1 flex items-center gap-3 bg-bg-input rounded-full px-4 py-2 border border-border-input focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus-shadow transition-all shadow-sm">

                                {/* File Upload */}
                                <label htmlFor="file-upload" className="cursor-pointer text-text-placeholder hover:text-text-brand transition-colors shrink-0">
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </label>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            uploadAttachment(e.target.files[0]);
                                            e.target.value = '';
                                        }
                                    }}
                                />

                                <textarea
                                    value={messageInput}
                                    onChange={e => { setMessageInput(e.target.value); sendTyping(); }}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-text-body resize-none max-h-32 min-h-[24px] py-1 placeholder:text-text-placeholder custom-scrollbar leading-relaxed"
                                    rows={1}
                                    style={{ height: '30px' }} // Fix initial height
                                />

                                {/* Right Actions inside Input */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Emoji Trigger */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="text-text-placeholder hover:text-text-brand transition-colors p-1">
                                                <Smile className="w-5 h-5" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none bg-transparent" side="top" align="end" sideOffset={10}>
                                            <div style={{ zIndex: 50, pointerEvents: 'auto' }}>
                                                <EmojiPicker
                                                    onSelect={(emoji) => setMessageInput(prev => prev + emoji)}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!messageInput.trim()}
                                        className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                            messageInput.trim() ? "bg-sc-purple-600 text-text-inverse hover:bg-sc-purple-700 shadow-sm" : "bg-bg-input-disabled text-text-placeholder cursor-not-allowed"
                                        )}
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex-col items-center justify-center bg-bg-secondary-panel hidden md:flex">
                    <EmptyState
                        icon={MessageSquare}
                        title="No conversations yet"
                        description="Start a private conversation with connections, recruiters, or developers on SkilledCore."
                        ctaText="Start a Conversation"
                        ctaHref="/network"
                    />
                </div>
            )}
        </div>
    );
}

function RenderMessageContent({ msg, isMe, onAccept }: { msg: any; isMe: boolean; onAccept: () => void }) {
    // In-app media preview (WhatsApp-style) — never bounce the user out to the raw CDN URL.
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (msg.isDeleted) return <p className="italic text-sm">Message unsent</p>;

    if (msg.attachmentType === 'INTERVIEW_INVITE') {
        let data: any = {};
        try { data = JSON.parse(msg.attachmentUrl || '{}'); } catch (e) { }

        return (
            <div className="my-1">
                <InvitationCard
                    candidateName={data.candidateName || "Candidate"}
                    companyName={data.companyName || "Skilled Core"}
                    interviewDate={data.interviewDate || "TBD"}
                    interviewTime={data.interviewTime || "TBD"}
                    onAccept={onAccept}
                />
            </div>
        );
    }

    const renderText = (text: string) => {
        return (
            <ReactMarkdown
                components={{
                    a: ({ node, ...props }) => (
                        <a
                            className={cn(
                                "underline font-bold transition-colors",
                                isMe ? "text-text-inverse hover:text-text-inverse/80" : "text-text-brand hover:text-text-brand-hover"
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),
                    p: ({ node, ...props }) => <span className="whitespace-pre-wrap break-words" {...props} />
                }}
            >
                {text}
            </ReactMarkdown>
        );
    };

    if (msg.attachmentUrl) {
        const isVideo = msg.attachmentType === 'video' || /\.(mp4|webm|mov)($|\?)/i.test(msg.attachmentUrl);
        if (msg.attachmentType === 'image' || isVideo) {
            return (
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="block p-0 border-none bg-transparent cursor-zoom-in"
                        aria-label="Open media preview"
                    >
                        {isVideo ? (
                            <video src={msg.attachmentUrl} muted className="max-w-[240px] rounded-lg mb-1" />
                        ) : (
                            <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[240px] rounded-lg mb-1 hover:opacity-90 transition-opacity" />
                        )}
                    </button>
                    {msg.text && renderText(msg.text)}
                    <ImageLightbox
                        isOpen={lightboxOpen}
                        onClose={() => setLightboxOpen(false)}
                        imageUrl={msg.attachmentUrl}
                        title="Shared media"
                    />
                </div>
            );
        }
        // Non-media files (PDFs etc.) still download/open via the CDN link.
        return (
            <div className="space-y-1">
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2 underline", isMe ? "text-text-inverse/90" : "text-text-body")}>
                    <Paperclip className="w-4 h-4" />
                    <span>Attachment</span>
                </a>
                {msg.text && renderText(msg.text)}
            </div>
        )
    }
    return renderText(msg.text || '');
}

// WhatsApp-style delivery ticks for outgoing messages.
function MessageStatus({ status }: { status?: string }) {
    if (status === 'read') {
        return <CheckCheck className="w-3.5 h-3.5 ml-1 self-end mb-1 text-sc-purple-600 shrink-0" aria-label="Read" />;
    }
    if (status === 'delivered') {
        return <CheckCheck className="w-3.5 h-3.5 ml-1 self-end mb-1 text-text-placeholder shrink-0" aria-label="Delivered" />;
    }
    return <Check className="w-3.5 h-3.5 ml-1 self-end mb-1 text-text-placeholder shrink-0" aria-label="Sent" />;
}

function MessageActions({ msg, onReply, onReact, onUnsend, onCopy }: any) {
    const isMe = msg.sender === 'me';
    return (
        <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>
            {!msg.isDeleted && <button onClick={onReply} className="p-1.5 hover:bg-bg-sidebar-hover rounded-full text-text-secondary hover:text-text-heading transition-colors"><CornerUpLeft className="w-4 h-4" /></button>}
            {onReact && !msg.isDeleted && (
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="p-1.5 hover:bg-bg-sidebar-hover rounded-full text-text-secondary hover:text-text-heading transition-colors"><Smile className="w-4 h-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1.5 bg-bg-dropdown border border-border-dropdown rounded-full flex gap-1 shadow-sc-dropdown">
                        {EMOJI_REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => onReact(emoji)} className="p-1 hover:bg-bg-dropdown-item-hover rounded-full text-lg hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                    </PopoverContent>
                </Popover>
            )}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-1.5 hover:bg-bg-sidebar-hover rounded-full text-text-secondary hover:text-text-heading transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1 bg-bg-dropdown border border-border-dropdown text-text-body rounded-lg shadow-sc-dropdown">
                    <div className="flex flex-col text-sm">
                        <button onClick={() => onCopy(msg.text)} className="flex items-center gap-2 px-3 py-2 hover:bg-bg-dropdown-item-hover w-full text-left rounded-md"><Copy className="w-3 h-3" /> Copy</button>
                        {isMe && !msg.isDeleted && <button onClick={onUnsend} className="flex items-center gap-2 px-3 py-2 hover:bg-bg-error/30 text-text-error w-full text-left rounded-md"><Trash2 className="w-3 h-3" /> Unsend</button>}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
