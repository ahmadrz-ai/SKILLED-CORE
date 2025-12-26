"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, StopCircle, Clock, Zap, User, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    persona?: 'suggester' | 'interviewer'; // NEW: Track who is speaking
}

interface ChatInterfaceProps {
    sessionActive: boolean;
    config: any;
    onEndSession: () => void;
    isVoiceMode?: boolean;
    compactMode?: boolean;
    onCodeTrigger?: () => void;
    onTelemetryUpdate?: (data: any) => void;
}

export function ChatInterface({
    sessionActive,
    config,
    onEndSession,
    isVoiceMode = false,
    compactMode = false,
    onCodeTrigger,
    onTelemetryUpdate
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const initializedRef = useRef(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initial Greeting - FETCH DYNAMICALLY
    useEffect(() => {
        if (sessionActive && messages.length === 0 && !initializedRef.current) {
            initializedRef.current = true;
            fetchInitialGreeting();
        }
    }, [sessionActive, config]);

    const fetchInitialGreeting = async () => {
        setIsLoading(true);
        try {
            // Send empty messages array to trigger opening generation on backend
            // For turn 0, we expect "||| Introduce yourself" -> Suggester empty, Interviewer speaks.
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [], // Empty messages triggers "Start immediately" prompt
                    user_role: config.role,
                    is_grill_mode: config.useResume,
                    intensity: config.difficulty || 3
                })
            });

            if (!response.ok) throw new Error("Failed to fetch greeting");
            if (!response.body) throw new Error("No response body");

            await readStream(response.body);

        } catch (error) {
            console.error("Init greeting error:", error);
            // Fallback static greeting if API fails
            const fallbackMsg: Message = {
                id: 'init-fallback',
                role: 'assistant',
                content: `Please introduce yourself and highlight your experience relevant to this role.`,
                persona: 'interviewer'
            };
            setMessages([fallbackMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (sessionActive) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [sessionActive]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speak = (text: string) => {
        if (!isVoiceMode || typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    // SHARED STREAM READER LOGIC
    const readStream = async (body: ReadableStream<Uint8Array>) => {
        const reader = body.getReader();
        const decoder = new TextDecoder();

        // We use a local variable to track the full content of the CURRENT stream interaction
        // This helps us manage the split cleanly.
        let fullStreamContent = "";

        // We need the ID of the message we just added (The Suggester/Start)
        const startMsgId = Date.now().toString();

        // Create initial placeholder
        // Defaults to Suggester. If it stays empty, it's hidden.
        setMessages(prev => [...prev, { id: startMsgId, role: 'assistant', content: '', persona: 'suggester' }]);

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullStreamContent += chunk;

                // TELEMETRY PARSING - Updated regex to handle spaces around braces
                const telemetryMatch = fullStreamContent.match(/%%%\s*(\{[\s\S]*?\})\s*%%%/);
                if (telemetryMatch && telemetryMatch[1] && onTelemetryUpdate) {
                    try {
                        const data = JSON.parse(telemetryMatch[1]);
                        onTelemetryUpdate(data);
                        // Clean the stream content by removing the JSON block
                        fullStreamContent = fullStreamContent.replace(telemetryMatch[0], "").trim();
                    } catch (e) {
                        console.error("Telemetry Parse Error", e);
                    }
                }

                // ATOMIC UPDATE
                // We calculate the state of the TWO potential messages based on `fullStreamContent`
                setMessages(prev => {
                    const hasSplit = fullStreamContent.includes("|||");
                    let suggesterContent = fullStreamContent;
                    let interviewerContent = "";

                    if (hasSplit) {
                        const parts = fullStreamContent.split("|||");
                        suggesterContent = parts[0];
                        interviewerContent = parts.slice(1).join("|||"); // Join back remainder if multiple splits (unlikely)
                    }

                    // 1. Update Suggester Message (Always exists as startMsgId)
                    const nextMessages = prev.map(msg => {
                        if (msg.id === startMsgId) {
                            return {
                                ...msg,
                                content: suggesterContent,
                                persona: 'suggester' as const
                            };
                        }
                        return msg;
                    });

                    // 2. Handle Interviewer Message
                    if (hasSplit) {
                        const interviewerMsgId = startMsgId + "_int";
                        const exists = nextMessages.find(m => m.id === interviewerMsgId);

                        if (exists) {
                            // Update existing interviewer message
                            return nextMessages.map(msg =>
                                msg.id === interviewerMsgId ? {
                                    ...msg,
                                    content: interviewerContent,
                                    persona: 'interviewer' as const
                                } : msg
                            );
                        } else {
                            // Create new interviewer message
                            // Speak the suggester part now that it's done
                            if (suggesterContent.trim()) speak(suggesterContent);

                            return [...nextMessages, {
                                id: interviewerMsgId,
                                role: 'assistant',
                                content: interviewerContent,
                                persona: 'interviewer' as const
                            }];
                        }
                    }

                    return nextMessages;
                });
            }

            // End of stream - speak the last part (Interviewer)
            const parts = fullStreamContent.split("|||");
            const lastPart = parts.length > 1 ? parts[1] : parts[0];
            if (lastPart.trim()) speak(lastPart);

        } catch (err) {
            console.error("Stream reading error:", err);
            toast.error("Stream interrupted.");
        }
    };

    // MAIN SUBMISSION LOGIC
    const handleFormSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input;
        setInput("");
        setIsLoading(true);
        window.speechSynthesis.cancel();

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userText
        };

        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    user_role: config.role,
                    is_grill_mode: config.useResume,
                    intensity: config.difficulty || 3
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            if (!response.body) throw new Error("No response body");

            await readStream(response.body);

        } catch (error) {
            console.error("Chat submission error:", error);
            toast.error("Connection failed. Please try again.");
            // Remove the optimistic message on failure
            setMessages(prev => prev.filter(msg => msg.id !== newUserMsg.id));
            setInput(userText); // Restore input
        } finally {
            setIsLoading(false);
        }
    };

    // RENDER HELPERS
    const getPersonaConfig = (persona?: string, role?: string) => {
        if (role === 'user') return { name: "Me", icon: User, color: "text-white", bg: "bg-zinc-800", border: "border-zinc-700" };
        if (persona === 'suggester') return { name: "Mentor", icon: Sparkles, color: "text-cyan-400", bg: "bg-cyan-950/30", border: "border-cyan-500/30" };
        return { name: "Interviewer", icon: Bot, color: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-500/30" };
    };

    const renderStyledText = (text: string) => {
        if (!text) return null;
        // Split by the delimiters, keeping them in the array for identification
        // We use a regex with capturing groups to split but keep the delimiters to know what matches
        // Order: Triple stars (Red), Double stars (Orange), Single star (Green)
        // Regex: /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g

        const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);

        return parts.map((part, index) => {
            if (part.startsWith('***') && part.endsWith('***')) {
                return <span key={index} className="text-red-500 font-black animate-pulse">{part.slice(3, -3)}</span>;
            }
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={index} className="text-orange-500 font-bold">{part.slice(2, -2)}</span>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <span key={index} className="text-green-400 font-bold">{part.slice(1, -1)}</span>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className={cn("flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md relative mx-auto w-full transition-all duration-500", compactMode ? "h-full" : "h-[calc(100vh-140px)]")}>

            {/* Header */}
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">LIVE // {config.role}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTime(timer)}
                    </div>
                    {!compactMode && (
                        <Button variant="destructive" size="sm" onClick={onEndSession} className="h-7 text-xs">
                            End
                        </Button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {messages.map((msg) => {
                    // Hide empty messages (Silent Suggester)
                    if (!msg.content.trim()) return null;

                    const style = getPersonaConfig(msg.persona, msg.role);
                    const Icon = style.icon;

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-3 max-w-full lg:max-w-[90%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                style.bg, style.border, style.color
                            )}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className={cn(
                                "flex flex-col gap-1",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">
                                    {style.name}
                                </span>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'assistant'
                                        ? "bg-zinc-800/50 border border-white/5 text-zinc-300 rounded-tl-none"
                                        : "bg-violet-600/10 border border-violet-500/20 text-indigo-100 rounded-tr-none"
                                )}>
                                    {renderStyledText(msg.content)}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="bg-zinc-800/50 border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-zinc-950/80 border-t border-white/5 backdrop-blur-xl">
                {isVoiceMode && (
                    <div className="flex justify-center items-center h-12 mb-2 gap-1 px-4 py-2 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent rounded-lg">
                        {isListening ? (
                            [...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-cyan-400 rounded-full animate-pulse"
                                    style={{
                                        height: Math.random() * 24 + 8 + 'px',
                                        animationDuration: Math.random() * 0.2 + 0.1 + 's'
                                    }}
                                />
                            ))
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-zinc-500 animate-pulse">
                                <Mic className="w-3 h-3" /> Waiting for voice...
                            </div>
                        )}
                    </div>
                )}

                <div className="relative flex gap-2 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFormSubmit(e)}
                        placeholder={isListening ? "Listening..." : "Type your answer..."}
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
                    />

                    {isVoiceMode && (
                        <div className="absolute right-14 top-1.5">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={toggleListening}
                                className={cn(
                                    "h-8 w-8 transition-all",
                                    isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                        </div>
                    )}

                    <Button size="icon" onClick={(e) => handleFormSubmit(e)} disabled={isLoading || !input.trim()} className="h-10 w-10 bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
