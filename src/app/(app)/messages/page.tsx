'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search, Phone, Video, MoreVertical, Paperclip, Send,
    Check, CheckCircle2, Circle, MessageSquare, CheckCheck,
    Smile, CornerUpLeft, Trash2, Copy, AlertCircle, Heart,
    ThumbsUp
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import {
    getConversations, getMessages, sendMessage, startConversation,
    getUserDetails, reactToMessage, unsendMessage
} from './actions';
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { Loader2 } from "lucide-react";
import InvitationCard from "@/components/chat/InvitationCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import ReactMarkdown from 'react-markdown';

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

    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [tempContact, setTempContact] = useState<any | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('User');
    const scrollRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
        }
    };

    // UploadThing
    const [isUploading, setIsUploading] = useState(false);
    const { startUpload } = useUploadThing("chatAttachment", {
        onClientUploadComplete: async (res) => {
            if (res && res[0]) {
                const file = res[0];
                const type = file.type.startsWith('image') ? 'image' : 'file';
                await handleSend(undefined, file.url, type);
            }
            setIsUploading(false);
        },
        onUploadError: () => {
            toast.error("Upload failed");
            setIsUploading(false);
        },
        onUploadBegin: () => setIsUploading(true)
    });

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
        const res = await getConversations();
        if (res.success) {
            setConversations(res.conversations);
            setCurrentUserRole(res.userRole || 'User');
            if (tempContact) {
                const inList = res.conversations.find((c: any) => c.contactId === tempContact.contactId);
                if (inList) setTempContact(null);
            }
            if (!selectedContactId && res.conversations.length > 0 && !initialUserId && !isSelectionInitialized.current) {
                const firstContact = res.conversations[0];
                if (firstContact) {
                    setSelectedContactId(firstContact.contactId);
                    isSelectionInitialized.current = true;
                }
            }
        }
        if (!silent) setLoading(false);
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
        
        const interval = setInterval(async () => {
            const conversation = conversations.find(c => c.contactId === selectedContactId);
            if (conversation) {
                const res = await getMessages(conversation.id);
                if (res.success) setMessages(res.messages);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedContactId, conversations, tempContact]);

    useEffect(() => {
        if (scrollRef.current && isNearBottomRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, selectedContactId, replyingTo]);


    const handleSend = async (e?: React.FormEvent, attachmentUrl?: string, attachmentType?: string) => {
        e?.preventDefault();
        if ((!messageInput.trim() && !attachmentUrl) || !selectedContactId) return;

        const currentInput = messageInput;
        const currentReply = replyingTo;
        setMessageInput('');
        setReplyingTo(null);

        const optimisticMsg = {
            id: 'temp-' + Date.now(),
            text: currentInput || (attachmentUrl ? "Sent an attachment" : ""),
            attachmentUrl,
            attachmentType,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            replyTo: currentReply ? { id: currentReply.id, content: currentReply.text, senderName: currentReply.sender === 'me' ? 'You' : selectedContact?.name } : null
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const res = await sendMessage(selectedContactId, currentInput, attachmentUrl, attachmentType, currentReply?.id);
        if (res.success) {
            isNearBottomRef.current = true; // Force scroll to bottom when sending
            loadConversations(true);
        } else {
            toast.error("Failed to send");
        }
    };

    const handleReaction = async (msgId: string, emoji: string) => {
        // Optimistic update
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                const current = (m.reactions || []) as any[];
                const exists = current.find(r => r.userId === 'ME_PLACEHOLDER' || r.userId === selectedContact?.contactId); // Ideally needs real session ID but for optimistic we toggle abstractly
                // This is hard to do perfectly optimistic without Session ID, relying on fast server refresh for now or simple toggle visual
                return m;
            }
            return m;
        }));
        await reactToMessage(msgId, emoji);
        // Polling will catch it shortly
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
        <div className="h-[calc(100vh-64px)] w-full flex bg-white text-[#111827] overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-80 lg:w-96 border-r border-[#E5E7EB] bg-white flex flex-col flex-shrink-0 z-10">
                <div className="p-4 lg:p-6 border-b border-[#E5E7EB] flex flex-col gap-4 bg-white relative z-20">
                    <h2 className="text-xl font-bold text-[#111827] tracking-tight">
                        Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#9CA3AF]" /></div>
                    ) : filteredConversations.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => handleSelectContact(contact.contactId)}
                            className={cn(
                                "flex items-center gap-4 p-4 cursor-pointer hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] relative",
                                selectedContactId === contact.contactId ? "bg-[#EEF2FF]" : "bg-transparent"
                            )}
                        >
                            {selectedContactId === contact.contactId && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7C3AED]" />
                            )}
                            <div className="relative ml-1">
                                <Avatar className="w-12 h-12 border border-[#E5E7EB]">
                                    <AvatarImage src={contact.avatar} />
                                    <AvatarFallback className="bg-[#EEF2FF] text-[#7C3AED] font-semibold">{contact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {contact.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-semibold text-sm truncate text-[#111827]">{contact.name}</h3>
                                    <span className="text-[11px] text-[#9CA3AF] font-medium">{contact.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={cn("text-xs truncate w-40", contact.unread > 0 ? "text-[#111827] font-semibold" : "text-[#6B7280]")}>
                                        {contact.lastMessage}
                                    </p>
                                    {contact.unread > 0 && (
                                        <div className="w-2.5 h-2.5 bg-[#7C3AED] rounded-full shadow-sm" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-[#F9FAFB] relative">
                    {/* Header */}
                    <div className="h-[73px] px-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white z-20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10 border border-[#E5E7EB]">
                                <AvatarImage src={selectedContact.avatar} />
                                <AvatarFallback className="bg-[#EEF2FF] text-[#7C3AED] font-semibold">{selectedContact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-base text-[#111827]">{selectedContact.name}</h3>
                                <p className="text-xs text-[#6B7280]">{selectedContact.role || 'Active now'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            {canCall && <Video className="w-6 h-6 text-[#6B7280] hover:text-[#7C3AED] transition-colors cursor-pointer" />}
                            <AlertCircle className="w-6 h-6 text-[#6B7280] hover:text-[#7C3AED] transition-colors cursor-pointer" />
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
                                        <ContextMenuTrigger>
                                            <div className={cn(
                                                "max-w-[500px] relative px-4 py-2.5 text-[15px] shadow-sm",
                                                isMe
                                                    ? `${isLast ? 'rounded-br-sm' : 'rounded-br-2xl'} ${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-sm'} bg-[#7C3AED] text-white force-white-text rounded-l-2xl`
                                                    : `${isLast ? 'rounded-bl-sm' : 'rounded-bl-2xl'} ${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-sm'} bg-white border border-[#E5E7EB] text-[#111827] rounded-r-2xl`,
                                                msg.isDeleted && "italic text-[#9CA3AF] bg-transparent border border-[#E5E7EB] shadow-none"
                                            )}>
                                                {/* Reply Context */}
                                                {msg.replyTo && (
                                                    <div className={cn(
                                                        "mb-2 pl-3 border-l-2 text-xs opacity-90 py-1 rounded",
                                                        isMe ? "border-white/50 bg-black/10" : "border-[#7C3AED] bg-[#F9FAFB] text-[#4B5563]"
                                                    )}>
                                                        <p className={cn("font-semibold mb-0.5", isMe ? "text-white" : "text-[#7C3AED]")}>{msg.replyTo.senderName}</p>
                                                        <p className="truncate">{msg.replyTo.content}</p>
                                                    </div>
                                                )}

                                                <RenderMessageContent msg={msg} isMe={isMe} onAccept={() => router.push('/interview')} />

                                                {/* Reactions */}
                                                {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                                                    <div className={cn(
                                                        "absolute -bottom-2 h-5 px-1 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center text-[10px] shadow-sm whitespace-nowrap z-10",
                                                        isMe ? "right-0" : "left-0"
                                                    )}>
                                                        {msg.reactions.map((r: any, idx: number) => <span key={idx}>{r.emoji}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48 bg-white border-[#E5E7EB] text-[#111827] shadow-lg">
                                            <ContextMenuItem onSelect={() => setReplyingTo(msg)} className="focus:bg-[#F3F4F6] cursor-pointer text-sm">Reply</ContextMenuItem>
                                            <ContextMenuItem onSelect={() => handleCopy(msg.text)} className="focus:bg-[#F3F4F6] cursor-pointer text-sm">Copy</ContextMenuItem>
                                            {isMe && !msg.isDeleted && (
                                                <ContextMenuItem onSelect={() => handleUnsend(msg.id)} className="focus:bg-[#FEF2F2] text-[#EF4444] focus:text-[#DC2626] cursor-pointer text-sm font-medium">
                                                    Unsend
                                                </ContextMenuItem>
                                            )}
                                        </ContextMenuContent>
                                    </ContextMenu>

                                    {/* Action Helper (Right for Theirs, Left for Mine) */}
                                    {!isMe && <MessageActions msg={msg} onReply={() => setReplyingTo(msg)} onReact={(emoji: string) => handleReaction(msg.id, emoji)} onCopy={handleCopy} />}

                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-[#E5E7EB] z-20">
                        {replyingTo && (
                            <div className="flex justify-between items-center mb-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                                <div>
                                    <p className="text-xs text-[#6B7280]">Replying to <span className="text-[#111827] font-semibold">{replyingTo.sender === 'me' ? 'Yourself' : selectedContact.name}</span></p>
                                    <p className="text-sm text-[#4B5563] truncate max-w-xs">{replyingTo.text}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 rounded-full p-0 text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]">X</Button>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {/* Main Input Bar */}
                            <div className="flex-1 flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-[#E5E7EB] focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20 transition-all shadow-sm">

                                {/* File Upload */}
                                <label htmlFor="file-upload" className="cursor-pointer text-[#9CA3AF] hover:text-[#7C3AED] transition-colors shrink-0">
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </label>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            startUpload([e.target.files[0]]);
                                        }
                                    }}
                                />

                                <textarea
                                    value={messageInput}
                                    onChange={e => setMessageInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-[#111827] resize-none max-h-32 min-h-[24px] py-1 placeholder:text-[#9CA3AF] custom-scrollbar leading-relaxed"
                                    rows={1}
                                    style={{ height: '30px' }} // Fix initial height
                                />

                                {/* Right Actions inside Input */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Emoji Trigger */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="text-[#9CA3AF] hover:text-[#7C3AED] transition-colors p-1">
                                                <Smile className="w-5 h-5" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none bg-transparent" side="top" align="end" sideOffset={10}>
                                            <div style={{ zIndex: 50, pointerEvents: 'auto' }}>
                                                <EmojiPicker
                                                    theme={Theme.LIGHT}
                                                    onEmojiClick={(e: any) => setMessageInput(prev => prev + e.emoji)}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!messageInput.trim()}
                                        className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                            messageInput.trim() ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm" : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
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
                <div className="flex-1 flex flex-col items-center justify-center bg-[#F9FAFB]">
                    <div className="w-24 h-24 rounded-full border-2 border-[#E5E7EB] bg-white flex items-center justify-center mb-6 shadow-sm">
                        <Send className="-rotate-45 w-10 h-10 text-[#7C3AED] ml-2 mt-1" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#111827]">Your Messages</h2>
                    <p className="text-[#6B7280] mt-2">Send private messages and connect with talent.</p>
                    <Button className="mt-6 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full px-6 shadow-sm">Send Message</Button>
                </div>
            )}
        </div>
    );
}

function RenderMessageContent({ msg, isMe, onAccept }: { msg: any; isMe: boolean; onAccept: () => void }) {
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
                                isMe ? "text-white hover:text-white/80" : "text-[#7C3AED] hover:text-[#6D28D9]"
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
        if (msg.attachmentType === 'image') {
            return (
                <div className="space-y-1">
                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[240px] rounded-lg mb-1" />
                    </a>
                    {msg.text && renderText(msg.text)}
                </div>
            );
        }
        return (
            <div className="space-y-1">
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline text-white/90">
                    <Paperclip className="w-4 h-4" />
                    <span>Attachment</span>
                </a>
                {msg.text && renderText(msg.text)}
            </div>
        )
    }
    return renderText(msg.text || '');
}

function MessageActions({ msg, onReply, onReact, onUnsend, onCopy }: any) {
    const isMe = msg.sender === 'me';
    return (
        <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>
            {!msg.isDeleted && <button onClick={onReply} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><CornerUpLeft className="w-4 h-4" /></button>}
            {onReact && !msg.isDeleted && (
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><Smile className="w-4 h-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1.5 bg-[#262626] border border-white/10 rounded-full flex gap-1">
                        {EMOJI_REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => onReact(emoji)} className="p-1 hover:bg-white/10 rounded-full text-lg hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                    </PopoverContent>
                </Popover>
            )}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1 bg-[#262626] border border-white/10 text-white rounded-lg">
                    <div className="flex flex-col text-sm">
                        <button onClick={() => onCopy(msg.text)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 w-full text-left rounded-md"><Copy className="w-3 h-3" /> Copy</button>
                        {isMe && !msg.isDeleted && <button onClick={onUnsend} className="flex items-center gap-2 px-3 py-2 hover:bg-red-500/10 text-red-500 w-full text-left rounded-md"><Trash2 className="w-3 h-3" /> Unsend</button>}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
