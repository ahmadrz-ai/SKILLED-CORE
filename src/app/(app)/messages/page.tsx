'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
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

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const initialUserId = searchParams.get('userId');

    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [tempContact, setTempContact] = useState<any | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('User');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

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
    useEffect(() => { loadConversations(); }, []);
    useEffect(() => {
        if (initialUserId) {
            const existing = conversations.find(c => c.contactId === initialUserId);
            if (existing) {
                setSelectedContactId(existing.contactId);
                setTempContact(null);
            } else {
                fetchUserDetails(initialUserId);
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
            if (!selectedContactId && res.conversations.length > 0 && !initialUserId) {
                const firstContact = res.conversations[0];
                if (firstContact) setSelectedContactId(firstContact.contactId);
            }
        }
        if (!silent) setLoading(false);
    }

    useEffect(() => {
        if (!selectedContactId) return;
        const load = async () => {
            if (tempContact && tempContact.contactId === selectedContactId) {
                setMessages([]);
                return;
            }
            const conversation = conversations.find(c => c.contactId === selectedContactId);
            if (conversation) {
                setChatLoading(true);
                const res = await getMessages(conversation.id);
                if (res.success) setMessages(res.messages);
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
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
        <div className="absolute inset-0 bg-black flex text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-96 border-r border-white/10 bg-black flex flex-col">
                <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-black/50 backdrop-blur-xl">
                    <h2 className="text-2xl font-black text-white tracking-wide uppercase">
                        MESSAGES
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
                    ) : filteredConversations.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedContactId(contact.contactId)}
                            className={cn(
                                "flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 mx-2 rounded-xl my-1",
                                selectedContactId === contact.contactId ? "bg-white/10" : "bg-transparent"
                            )}
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12 border border-white/10">
                                    <AvatarImage src={contact.avatar} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-400">{contact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-sm truncate text-white/90">{contact.name}</h3>
                                    <span className="text-[11px] text-zinc-500 font-medium">{contact.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={cn("text-xs truncate w-40", contact.unread > 0 ? "text-white font-medium" : "text-zinc-500")}>
                                        {contact.lastMessage}
                                    </p>
                                    {contact.unread > 0 && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-black relative">
                    {/* Header */}
                    <div className="h-20 px-6 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-xl z-20">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarImage src={selectedContact.avatar} />
                                <AvatarFallback className="bg-zinc-800 text-zinc-400">{selectedContact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-base">{selectedContact.name}</h3>
                                <p className="text-xs text-zinc-500">{selectedContact.role || 'Active now'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            {canCall && <Video className="w-7 h-7 stroke-[1.5] text-white cursor-pointer" />}
                            <AlertCircle className="w-7 h-7 stroke-[1.5] text-white cursor-pointer" />
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar scroll-smooth" ref={scrollRef}>
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
                                                "max-w-[500px] relative px-4 py-2.5 text-[15px]",
                                                isMe
                                                    ? `${isLast ? 'rounded-br-sm' : 'rounded-br-2xl'} ${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-sm'} bg-[#3797F0] text-white rounded-l-2xl`
                                                    : `${isLast ? 'rounded-bl-sm' : 'rounded-bl-2xl'} ${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-sm'} bg-[#262626] text-white rounded-r-2xl`,
                                                msg.isDeleted && "italic text-zinc-400 bg-transparent border border-white/10"
                                            )}>
                                                {/* Reply Context */}
                                                {msg.replyTo && (
                                                    <div className={cn(
                                                        "mb-2 pl-3 border-l-2 text-xs opacity-80 py-1 rounded bg-black/10",
                                                        isMe ? "border-white/50" : "border-zinc-500"
                                                    )}>
                                                        <p className="font-semibold mb-0.5">{msg.replyTo.senderName}</p>
                                                        <p className="truncate">{msg.replyTo.content}</p>
                                                    </div>
                                                )}

                                                <RenderMessageContent msg={msg} />

                                                {/* Reactions */}
                                                {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                                                    <div className={cn(
                                                        "absolute -bottom-2 h-5 px-1 bg-[#262626] border border-black rounded-full flex items-center justify-center text-[10px] shadow-sm whitespace-nowrap z-10",
                                                        isMe ? "right-0" : "left-0"
                                                    )}>
                                                        {msg.reactions.map((r: any, idx: number) => <span key={idx}>{r.emoji}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48 bg-[#262626] border-white/10 text-white">
                                            <ContextMenuItem onSelect={() => setReplyingTo(msg)} className="focus:bg-white/10 cursor-pointer">Reply</ContextMenuItem>
                                            <ContextMenuItem onSelect={() => handleCopy(msg.text)} className="focus:bg-white/10 cursor-pointer">Copy</ContextMenuItem>
                                            {isMe && !msg.isDeleted && (
                                                <ContextMenuItem onSelect={() => handleUnsend(msg.id)} className="focus:bg-red-500/20 text-red-500 focus:text-red-400 cursor-pointer">
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
                    <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/5 pr-4">
                        {replyingTo && (
                            <div className="flex justify-between items-center ml-4 mr-16 mb-2 p-3 bg-[#262626] rounded-t-xl border-b border-white/5">
                                <div>
                                    <p className="text-xs text-zinc-400">Replying to <span className="text-white font-medium">{replyingTo.sender === 'me' ? 'Yourself' : selectedContact.name}</span></p>
                                    <p className="text-sm text-zinc-300 truncate max-w-xs">{replyingTo.text}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 rounded-full p-0">X</Button>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {/* Main Input Bar */}
                            <div className="flex-1 flex items-center gap-3 bg-[#111111] rounded-full px-4 py-3 border border-white/5 focus-within:border-white/10 focus-within:bg-[#151515] transition-all shadow-lg inner-shadow">

                                {/* File Upload */}
                                <label htmlFor="file-upload" className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
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
                                    className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-white resize-none max-h-32 min-h-[24px] py-0 placeholder:text-zinc-600 custom-scrollbar"
                                    rows={1}
                                    style={{ height: '24px' }} // Fix initial height
                                />

                                {/* Right Actions inside Input */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Emoji Trigger */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                                <Smile className="w-5 h-5" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none bg-transparent" side="top" align="end">
                                            <EmojiPicker
                                                theme={Theme.DARK}
                                                onEmojiClick={(e: any) => setMessageInput(prev => prev + e.emoji)}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!messageInput.trim()}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            messageInput.trim() ? "bg-[#3797F0] text-white hover:bg-[#2a85d5]" : "bg-[#262626] text-zinc-600 cursor-not-allowed"
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
                <div className="flex-1 flex flex-col items-center justify-center bg-black">
                    <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
                        <Send className="-rotate-45 w-10 h-10 text-white ml-2 mt-1" />
                    </div>
                    <h2 className="text-xl font-light">Your Messages</h2>
                    <p className="text-zinc-500 mt-2">Send private photos and messages to a friend.</p>
                    <Button className="mt-6 bg-[#3797F0] hover:bg-[#2c7abe]">Send Message</Button>
                </div>
            )}
        </div>
    );
}

function RenderMessageContent({ msg }: { msg: any }) {
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
                />
            </div>
        );
    }

    if (msg.attachmentUrl) {
        if (msg.attachmentType === 'image') {
            return (
                <div className="space-y-1">
                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[240px] rounded-lg mb-1" />
                    </a>
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
            );
        }
        return (
            <div className="space-y-1">
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline text-white/90">
                    <Paperclip className="w-4 h-4" />
                    <span>Attachment</span>
                </a>
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
            </div>
        )
    }
    return <p className="whitespace-pre-wrap break-words">{msg.text}</p>;
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
