"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, StopCircle, Clock, Zap, User, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getUserProfile } from "@/app/actions/interview";

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    persona?: 'suggester' | 'interviewer'; // NEW: Track who is speaking
    isSubscribedTelemetry?: boolean;
}

interface ChatInterfaceProps {
    sessionActive: boolean;
    config: any;
    onEndSession: (messages: Message[], durationSeconds: number, cheated?: boolean) => void;
    isVoiceMode?: boolean;
    compactMode?: boolean;
    onCodeTrigger?: () => void;
    onTelemetryUpdate?: (data: any) => void;
    sandboxCode?: string;
    sandboxOutput?: string[];
    lastCodeRun?: { code: string; output: string[]; timestamp: number } | null;
}

export function ChatInterface({
    sessionActive,
    config,
    onEndSession,
    isVoiceMode = false,
    compactMode = false,
    onCodeTrigger,
    onTelemetryUpdate,
    sandboxCode = "",
    sandboxOutput = [],
    lastCodeRun = null
}: ChatInterfaceProps) {
    const { data: session } = useSession();
    const [dbUser, setDbUser] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isTerminated, setIsTerminated] = useState(false);

    const sendTelemetryPayload = async (code: string, output: string[]) => {
        if (isLoading || !sessionActive) return;

        const telemetryPayload: Message = {
            id: `telemetry-${Date.now()}`,
            role: 'system',
            content: `[SANDBOX_TELEMETRY] 
USER_CODE: \`\`\`javascript\n${code}\n\`\`\`
TERMINAL_OUTPUT: \`\`\`\n${output.join('\n')}\n\`\`\``,
            isSubscribedTelemetry: true
        };

        const updatedMessages = [...messages, telemetryPayload];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    user_role: config.role,
                    is_grill_mode: config.useResume,
                    intensity: config.difficulty || 3,
                    sandbox_code: code,
                    sandbox_output: output,
                    interviewId: config.interviewId
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            if (!response.body) throw new Error("No response body");

            await readStream(response.body);

        } catch (error) {
            console.error("Telemetry submission error:", error);
            setMessages(prev => prev.filter(msg => msg.id !== telemetryPayload.id));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (lastCodeRun && sessionActive) {
            sendTelemetryPayload(lastCodeRun.code, lastCodeRun.output);
        }
    }, [lastCodeRun]);
    const [timer, setTimer] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const initializedRef = useRef(false);

    // Anti-Cheat and Compliance tracking states
    const [warningsCount, setWarningsCount] = useState(0);
    const [cheated, setCheated] = useState(false);

    // Voice introduction constraints states
    const [isVoiceIntroStep, setIsVoiceIntroStep] = useState(false);
    const [voiceIntroTime, setVoiceIntroTime] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Fetch user profile from DB to ensure PFP is always live and correct
    useEffect(() => {
        getUserProfile().then(user => {
            if (user) {
                setDbUser(user);
            }
        });
    }, []);

    // Initial Greeting - FETCH DYNAMICALLY
    useEffect(() => {
        if (sessionActive && messages.length === 0 && !initializedRef.current) {
            initializedRef.current = true;
            fetchInitialGreeting();
        }
    }, [sessionActive, config]);

    // Track active speaking time for the voice introduction
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isListening && isVoiceIntroStep && sessionActive) {
            interval = setInterval(() => {
                setVoiceIntroTime(prev => {
                    const nextTime = prev + 1;
                    if (nextTime >= 90) {
                        if (recognitionRef.current) {
                            recognitionRef.current.stop();
                        }
                        setIsListening(false);
                        toast.success("Voice introduction complete (90s limit reached). Click send to submit!");
                    }
                    return nextTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isListening, isVoiceIntroStep, sessionActive]);

    const handleCheatAttempt = (type: 'tab' | 'copy' | 'paste') => {
        if (!sessionActive) return;

        setWarningsCount(prev => {
            const nextWarnings = prev + 1;
            if (nextWarnings === 1) {
                // First Infraction: Warning toast + optimistic warning bubble in active stream
                toast.warning("First Warning: Tab switching and copy-pasting is strictly forbidden during the interview. Further attempts will void your compliance.", { duration: 6000 });
                setMessages(m => [...m, {
                    id: `warning-${Date.now()}`,
                    role: 'assistant',
                    persona: 'interviewer',
                    content: "***[SYSTEM WARNING]*** You have attempted to copy-paste or switch tabs/windows. This interview is strictly monitored. Further infractions will void your results."
                }]);
            } else if (nextWarnings >= 2) {
                // Second Infraction: Set cheated status + void compliance + append permanent voided bubble
                setCheated(true);
                toast.error("Compliance Voided: Repeated tab switching or copy-pasting has voided this interview's compliance. Your report will reflect a cheated status.", { duration: 8000 });
                setMessages(m => [...m, {
                    id: `cheated-${Date.now()}`,
                    role: 'assistant',
                    persona: 'interviewer',
                    content: "***[INTEGRITY VOIDED]*** This session has been flagged for cheating due to repeated violations. Your final results will reflect non-compliance."
                }]);
            }
            return nextWarnings;
        });
    };

    // Tab visibility and window blur interception hooks
    useEffect(() => {
        if (!sessionActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleCheatAttempt('tab');
            }
        };

        const handleWindowBlur = () => {
            handleCheatAttempt('tab');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [sessionActive]);

    const fetchInitialGreeting = async () => {
        setIsLoading(true);
        if (isVoiceMode) {
            setIsVoiceIntroStep(true);
            setVoiceIntroTime(0);
        }
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
                    intensity: config.difficulty || 3,
                    interviewId: config.interviewId
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
            let chunkCount = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullStreamContent += chunk;
                chunkCount++;

                // Check for violation termination token
                if (fullStreamContent.includes('[INTERVIEW_TERMINATED_VIOLATION]')) {
                    setIsTerminated(true);
                }

                // BULLETPROOF TELEMETRY EXTRACTOR (%%{...}%% format)
                const telemetryRegex = /%%\s*(\{[\s\S]*?\})\s*%%/;
                const telemetryMatch = fullStreamContent.match(telemetryRegex);
                if (telemetryMatch) {
                    const rawJson = telemetryMatch[1];
                    const fullMatchText = telemetryMatch[0];
                    
                    if (onTelemetryUpdate) {
                        try {
                            const data = JSON.parse(rawJson);
                            onTelemetryUpdate(data);
                        } catch (e) {
                            console.error("Telemetry JSON Parse Error:", e);
                            try {
                                // Fallback looser parser
                                const confidenceMatch = rawJson.match(/"confidence"\s*:\s*(\d+)/);
                                const feedbackMatch = rawJson.match(/"feedback"\s*:\s*"([^"]+)"/);
                                const topicsMatch = rawJson.match(/"topics"\s*:\s*\[\s*([^\]]*)\s*\]/);
                                
                                const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
                                const feedback = feedbackMatch ? feedbackMatch[1] : "Analyzing candidate response...";
                                const topics = topicsMatch 
                                    ? topicsMatch[1].split(",").map(t => t.replace(/"/g, "").trim()).filter(Boolean) 
                                    : [];
                                    
                                onTelemetryUpdate({ confidence, feedback, topics });
                            } catch (looseErr) {
                                console.error("Loose telemetry recovery failed:", looseErr);
                            }
                        }
                    }
                    
                    // ALWAYS scrub telemetry from content so candidate never sees raw JSON in chat bubble
                    fullStreamContent = fullStreamContent.replace(fullMatchText, "").trim();
                    fullStreamContent = fullStreamContent.replace(/^%+/, "").trim();
                }

                // ATOMIC UPDATE
                setMessages(prev => {
                    const hasSplit = fullStreamContent.includes("|||");
                    let suggesterContent = fullStreamContent;
                    let interviewerContent = "";

                    if (hasSplit) {
                        const parts = fullStreamContent.split("|||");
                        suggesterContent = parts[0].replace('[INTERVIEW_TERMINATED_VIOLATION]', '').trim();
                        interviewerContent = parts.slice(1).join("|||").replace('[INTERVIEW_TERMINATED_VIOLATION]', '').trim();
                    } else {
                        suggesterContent = suggesterContent.replace('[INTERVIEW_TERMINATED_VIOLATION]', '').trim();
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
                            return nextMessages.map(msg =>
                                msg.id === interviewerMsgId ? {
                                    ...msg,
                                    content: interviewerContent,
                                    persona: 'interviewer' as const
                                } : msg
                            );
                        } else {
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
            const cleanLastPart = lastPart.replace('[INTERVIEW_TERMINATED_VIOLATION]', '').trim();
            if (cleanLastPart.trim()) speak(cleanLastPart);

            // If we successfully finished but read absolutely nothing (or just the split separator without content)
            if (chunkCount === 0 || !fullStreamContent.replace("|||", "").replace('[INTERVIEW_TERMINATED_VIOLATION]', '').trim()) {
                throw new Error("Empty or incomplete stream response");
            }

        } catch (err) {
            console.error("Stream reading error:", err);
            // Clean up the placeholder message if it was empty/incomplete
            setMessages(prev => prev.filter(msg => msg.id !== startMsgId && msg.id !== (startMsgId + "_int")));
            toast.error("Stream interrupted or failed to connect.");
            throw err; // Bubble up the error so the caller knows it failed!
        }
    };

    // MAIN SUBMISSION LOGIC
    const handleFormSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Mandate voice introduction duration rules
        if (isVoiceMode && isVoiceIntroStep) {
            if (voiceIntroTime < 45) {
                toast.warning(`Compliance Check: Your voice introduction is too brief (${voiceIntroTime}s). Please speak for at least 45 seconds to introduce yourself fully.`, { duration: 6000 });
                return;
            } else {
                setIsVoiceIntroStep(false);
            }
        }

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
                    intensity: config.difficulty || 3,
                    sandbox_code: sandboxCode,
                    sandbox_output: sandboxOutput,
                    interviewId: config.interviewId
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
        <div className="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-100/40 dark:shadow-none overflow-hidden relative mx-auto w-full transition-all duration-500 h-full">

            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            LIVE SESSION // {config.role}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-mono text-xs bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550" />
                        <span>{formatTime(timer)}</span>
                    </div>
                    {!compactMode && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onEndSession(messages, timer, cheated)} 
                            className="h-8 text-xs font-bold text-red-655 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all px-4 border border-red-200 dark:border-red-900/30"
                        >
                            End Session
                        </Button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-zinc-50/30 dark:bg-zinc-900/10">
                {messages.filter(msg => !msg.isSubscribedTelemetry && msg.role !== 'system').map((msg) => {
                    // Hide empty messages (Silent Suggester)
                    if (!msg.content.trim()) return null;

                    const isUser = msg.role === 'user';
                    const isMentor = msg.persona === 'suggester';
                    
                    if (isUser) {
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3.5 max-w-full lg:max-w-[85%] ml-auto flex-row-reverse"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20 overflow-hidden shadow-[0_0_12px_rgba(99,102,241,0.25)] bg-zinc-950">
                                    {dbUser?.image || session?.user?.image ? (
                                        <img src={dbUser?.image || session?.user?.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold font-sans" style={{ color: '#ffffff' }}>
                                            {(dbUser?.name || session?.user?.name || "ME").substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-1.5">
                                        {dbUser?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || "Me"}
                                    </span>
                                    <div 
                                        className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-lg shadow-indigo-600/10 border border-indigo-500/30"
                                        style={{ color: '#ffffff' }}
                                    >
                                        {renderStyledText(msg.content)}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }

                    if (isMentor) {
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3.5 max-w-full lg:max-w-[85%] items-start"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.35)] bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden">
                                    <Sparkles className="w-5 h-5 fill-white/10 animate-pulse" style={{ color: '#ffffff' }} />
                                </div>
                                <div className="flex flex-col gap-1 items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 ml-1.5">
                                        Mentor
                                    </span>
                                    <div className="p-4 bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200/50 dark:border-cyan-500/20 text-zinc-800 dark:text-zinc-100 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                                        {renderStyledText(msg.content)}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }

                    // Default to Interviewer for any assistant message not explicitly mapped to suggester
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3.5 max-w-full lg:max-w-[85%] items-start"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.35)] bg-gradient-to-br from-amber-500 to-rose-600 overflow-hidden">
                                <Bot className="w-5 h-5" style={{ color: '#ffffff' }} />
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-450 ml-1.5">
                                    Interviewer
                                </span>
                                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/20 text-zinc-800 dark:text-zinc-100 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                                    {renderStyledText(msg.content)}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-500/30 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                            <Sparkles className="w-5 h-5 animate-pulse" style={{ color: '#ffffff' }} />
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 shadow-sm">
                            <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-zinc-400 dark:bg-zinc-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {/* Termination Banner */}
                {isTerminated && (
                    <div className="flex flex-col items-center justify-center p-6 border rounded-xl shadow-md text-center max-w-lg mx-auto my-4 animate-in fade-in slide-in-from-bottom-5 bg-red-950/30 border-red-500/50 text-red-300">
                        <h4 className="text-sm font-bold text-red-400 mb-1.5">
                            Interview Terminated due to Violations
                        </h4>
                        <p className="text-xs text-red-300/80 mb-4 leading-relaxed">
                            This session has been automatically closed due to repeated rule violations (tab-switching, copy-pasting, or unauthorized activities). Your performance log has been saved as non-compliant.
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onEndSession(messages, timer, true)}
                            className="rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-all px-6 py-2 border border-red-500/50 cursor-pointer"
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                {isVoiceMode && (
                    <div className="flex justify-between items-center h-12 mb-3 px-4 py-2 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent rounded-lg">
                        {isListening ? (
                            <div className="flex gap-1.5 items-center">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-cyan-500 rounded-full animate-pulse"
                                        style={{
                                            height: Math.random() * 20 + 8 + 'px',
                                            animationDuration: Math.random() * 0.2 + 0.1 + 's'
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-zinc-500 animate-pulse">
                                <Mic className="w-3.5 h-3.5" /> Waiting for voice...
                            </div>
                        )}
                        
                        {isVoiceIntroStep && (
                            <span className={cn(
                                "text-[10px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider",
                                voiceIntroTime < 45
                                    ? "bg-sc-red-50 border-sc-red-200 text-text-error animate-pulse"
                                    : "bg-sc-green-50 border-sc-green-200 text-text-success font-black"
                            )}>
                                {voiceIntroTime < 45 
                                    ? `Voice Intro: ${voiceIntroTime}s / 90s (Min: 45s Required)` 
                                    : `Voice Intro: ${voiceIntroTime}s / 90s (Success ✓)`}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex gap-3.5 items-center w-full">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFormSubmit(e)}
                            disabled={isTerminated}
                            onCopy={(e) => {
                                e.preventDefault();
                                toast.error("Copying is disabled during the interview.");
                                handleCheatAttempt("copy");
                            }}
                            onPaste={(e) => {
                                e.preventDefault();
                                toast.error("Pasting is disabled during the interview.");
                                handleCheatAttempt("paste");
                            }}
                            placeholder={isTerminated ? "Session Terminated" : isListening ? "Listening..." : "Type your answer..."}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 pl-4 pr-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {isVoiceMode && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={toggleListening}
                                    disabled={isTerminated}
                                    className={cn(
                                        "h-9 w-9 transition-all rounded-lg cursor-pointer",
                                        isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    {isListening ? <StopCircle className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                                </Button>
                            </div>
                        )}
                    </div>

                    <Button 
                        size="icon" 
                        onClick={(e) => handleFormSubmit(e)} 
                        disabled={isLoading || !input.trim() || isTerminated} 
                        className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
