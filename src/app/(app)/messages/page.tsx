'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
    Search, Phone, Video, MoreVertical, Paperclip, Send,
    Check, CheckCircle2, Circle, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { getConversations, getMessages, sendMessage, startConversation, getUserDetails } from './actions';
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { Loader2 } from "lucide-react";
import InvitationCard from "@/components/chat/InvitationCard";

// ...

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
    const scrollRef = useRef<HTMLDivElement>(null);

    // UploadThing
    const [isUploading, setIsUploading] = useState(false);
    const { startUpload } = useUploadThing("chatAttachment", {
        onClientUploadComplete: async (res) => {
            if (res && res[0]) {
                const file = res[0];
                // Determine type
                const type = file.type.startsWith('image') ? 'image' : 'file';
                // Send message with attachment
                await handleSendWithAttachment(file.url, type);
            }
            setIsUploading(false);
        },
        onUploadError: () => {
            toast.error("Upload failed");
            setIsUploading(false);
        },
        onUploadBegin: () => {
            setIsUploading(true);
        }
    });

    const handleSendWithAttachment = async (url: string, type: string) => {
        if (!selectedContactId) return;

        // Optimistic
        const optimisticMsg = {
            id: 'temp-' + Date.now(),
            text: "Sent an attachment", // Placeholder
            attachmentUrl: url,
            attachmentType: type,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, optimisticMsg]);

        await sendMessage(selectedContactId, "", url, type); // Send empty text with attachment
        loadConversations();
    };

    // Initial Load
    useEffect(() => {
        loadConversations();
    }, []);

    // Handle initial user selection
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

    async function loadConversations() {
        const res = await getConversations();
        if (res.success) {
            setConversations(res.conversations);

            // Check if temp contact is now in the list
            if (tempContact) {
                const inList = res.conversations.find((c: any) => c.contactId === tempContact.contactId);
                if (inList) setTempContact(null);
            }

            if (!selectedContactId && res.conversations.length > 0 && !initialUserId) {
                const firstContact = res.conversations[0];
                if (firstContact) setSelectedContactId(firstContact.contactId);
            }
        }
        setLoading(false);
    }

    // Load Messages when contact changes
    // This was the old one
    // useEffect(() => {
    //     if (!selectedContactId) return;

    //     async function fetchMsgs() {
    //         // Check if it's a temp contact (no conversation yet)
    //         if (tempContact && tempContact.contactId === selectedContactId) {
    //             setMessages([]);
    //             return;
    //         }

    //         const conversation = conversations.find(c => c.contactId === selectedContactId);
    //         if (conversation) {
    //             const res = await getMessages(conversation.id);
    //             if (res.success) setMessages(res.messages);
    //         }
    //     }
    //     fetchMsgs();

    //     const interval = setInterval(fetchMsgs, 5000);
    //     return () => clearInterval(interval);

    // }, [selectedContactId, conversations, tempContact]);

    // New Logic:
    useEffect(() => {
        if (!selectedContactId) return;

        // 1. Initial Load for this Contact
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

        // 2. Poll
        const interval = setInterval(async () => {
            const conversation = conversations.find(c => c.contactId === selectedContactId);
            if (conversation) {
                const res = await getMessages(conversation.id);
                if (res.success) setMessages(res.messages);
            }
        }, 8000); // 8s polling

        return () => clearInterval(interval);

    }, [selectedContactId, conversations, tempContact]);


    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, selectedContactId]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageInput.trim() || !selectedContactId) return;

        const currentInput = messageInput;
        setMessageInput(''); // Optimistic clear

        // Optimistic append
        const optimisticMsg = {
            id: 'temp-' + Date.now(),
            text: currentInput,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, optimisticMsg]);

        const res = await sendMessage(selectedContactId, currentInput);
        if (res.success) {
            // Update real message ID or refresh
            // Refreshing ensures correct server timestamp/ID
            // But for smoothness we might just leave it? 
            // Better to refresh conversation list to update "Last message" preview
            loadConversations();
        } else {
            // Error handling - remove optimistic message?
            toast.error("Failed to send");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectedContact = conversations.find(c => c.contactId === selectedContactId) || tempContact;

    return (
        <div className="absolute inset-0 bg-obsidian flex text-white overflow-hidden">

            {/* Sidebar: Contacts */}
            <div className="w-80 border-r border-white/5 bg-zinc-950/50 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-xl font-bold font-cinzel tracking-wider text-white mb-4">MESSAGES</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                            placeholder="Search conversations..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-4 text-zinc-500 text-sm text-center">Loading chats...</div>
                    ) : (
                        conversations.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContactId(contact.contactId)}
                                className={cn(
                                    "p-4 flex gap-3 cursor-pointer transition-colors border-b border-white/5 hover:bg-white/5",
                                    selectedContactId === contact.contactId ? "bg-violet-900/10 border-l-2 border-l-violet-500" : "border-l-2 border-l-transparent"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 border border-white/10">
                                        <AvatarImage src={contact.avatar} />
                                        <AvatarFallback className="bg-zinc-800 text-zinc-400">{contact.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {contact.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-950 rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={cn("font-medium truncate", selectedContactId === contact.contactId ? "text-white" : "text-zinc-300")}>
                                            {contact.name}
                                        </h3>
                                        <span className="text-[10px] text-zinc-500">{contact.time}</span>
                                    </div>
                                    <p className={cn("text-xs truncate", contact.unread > 0 ? "text-white font-semibold" : "text-zinc-500")}>
                                        {contact.lastMessage}
                                    </p>
                                </div>
                                {contact.unread > 0 && (
                                    <div className="flex flex-col justify-center">
                                        <span className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                            {contact.unread}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {!loading && conversations.length === 0 && (
                        <div className="p-8 text-center text-zinc-600">
                            <p className="text-sm">No messages yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-zinc-900/20 backdrop-blur-sm relative">
                    {/* Chat Header */}
                    <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarImage src={selectedContact.avatar} />
                                <AvatarFallback className="bg-zinc-800 text-zinc-400">{selectedContact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-bold text-white flex items-center gap-2">
                                    {selectedContact.name}
                                    {selectedContact.role?.includes('Recruiter') && (
                                        <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[10px] border border-teal-500/20">RECRUITER</span>
                                    )}
                                </h2>
                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    {selectedContact.role || "Member"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                <Phone className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                <Video className="w-5 h-5" />
                            </Button>
                            <div className="h-6 w-px bg-white/10 mx-2" />
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Stream */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={scrollRef}>
                        {chatLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="text-xs">Decrypting history...</p>
                            </div>
                        ) : messages.length > 0 ? (
                            messages.map(msg => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={cn("flex", msg.sender === 'me' ? "justify-end" : "justify-start")}
                                >
                                    <div className={cn(
                                        "max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative group",
                                        msg.sender === 'me'
                                            ? "bg-violet-600 text-white rounded-br-none"
                                            : "bg-zinc-800 text-zinc-300 rounded-bl-none border border-white/5"
                                    )}>
                                        <RenderMessageContent msg={msg} />
                                        <div className={cn(
                                            "text-[9px] mt-1 opacity-50 flex items-center gap-1",
                                            msg.sender === 'me' ? "justify-end text-violet-200" : "text-zinc-500"
                                        )}>
                                            {msg.time}
                                            {msg.sender === 'me' && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                                <MessageSquare className="w-12 h-12 mb-2" />
                                <p className="text-sm">Start the secure channel.</p>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-zinc-950/80 backdrop-blur-md border-t border-white/5 pr-24">
                        {/* Smart Actions Hint */}
                        {selectedContact.role?.includes('Recruiter') && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                                <button className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs hover:bg-teal-500/20 transition-colors whitespace-nowrap">
                                    Request Interview Slot
                                </button>
                                <button className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-700 transition-colors whitespace-nowrap">
                                    Share Portfolio
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2 bg-zinc-900/50 p-2 rounded-xl border border-white/10 focus-within:border-violet-500/50 transition-colors">
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
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-zinc-400 hover:text-white h-10 w-10 shrink-0"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                            </Button>
                            <textarea
                                value={messageInput}
                                onChange={e => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={isUploading ? "Uploading..." : "Type your message..."}
                                className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder:text-zinc-600 resize-none max-h-32 min-h-[40px] py-2.5 text-sm custom-scrollbar"
                                rows={1}
                            />
                            <Button
                                onClick={() => handleSend()}
                                disabled={(!messageInput.trim() && !isUploading)}
                                className={cn(
                                    "h-10 w-10 shrink-0 rounded-lg transition-all",
                                    messageInput.trim() || isUploading ? "bg-violet-600 hover:bg-violet-500 text-white" : "bg-zinc-800 text-zinc-600"
                                )}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                    <p>Select a contact to decrypt message stream.</p>
                </div>
            )}
        </div>
    );
}

function RenderMessageContent({ msg }: { msg: any }) {
    if (msg.attachmentType === 'INTERVIEW_INVITE') {
        let data: any = {};
        try {
            data = JSON.parse(msg.attachmentUrl || '{}');
        } catch (e) {
            console.error("Failed to parse invite data", e);
        }

        return (
            <div className="my-2">
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
                        <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[200px] rounded-lg border border-white/10" />
                    </a>
                    {msg.text && <p>{msg.text}</p>}
                </div>
            );
        }
        return (
            <div className="space-y-1">
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-400 underline decoration-violet-500/30 underline-offset-4">
                    <Paperclip className="w-4 h-4" />
                    <span>View Attachment</span>
                </a>
                {msg.text && <p>{msg.text}</p>}
            </div>
        )
    }
    return <p>{msg.text}</p>;
}
