'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, Sparkles, User, Globe, Code, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QodeeLogo } from "@/components/QodeeLogo";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { useChat } from "@ai-sdk/react";

const SUGGESTED_ACTIONS = [
    { id: '1', label: "Navigate to Feed", icon: Globe, action: "/feed" },
    { id: '2', label: "Find Jobs", icon: Sparkles, action: "/jobs" },
    { id: '3', label: "Help Center", icon: HelpCircle, action: "/support" },
];

export function GlobalAiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Vercel AI SDK Hook
    // In this version, useChat returns sendMessage and status instead of append/isLoading
    // Manual Chat State
    const [messages, setMessages] = useState<any[]>([
        { id: 'init', role: 'assistant', content: "Hello! I'm Qodee, your autonomous assistant. How can I help you navigate the SkilledCore protocol today?" }
    ]);
    const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming' | 'error'>('ready');

    const isLoading = status === 'streaming' || status === 'submitted';

    // Local state for input to be safe
    const [inputValue, setInputValue] = useState("");

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        console.log("GlobalAiAssistant Messages Update:", messages);
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue("");
        setStatus('submitted');

        // Add user message
        const userMsg = { id: Date.now().toString(), role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);

        try {
            const response = await fetch('/api/qodee-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] })
            });

            if (!response.ok) throw new Error(response.statusText);
            if (!response.body) throw new Error("No response body");

            setStatus('streaming');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Add initial assistant message placeholder
            const aiMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => prev.map(m =>
                    m.id === aiMsgId
                        ? { ...m, content: m.content + chunk }
                        : m
                ));
            }

            setStatus('ready');
        } catch (error) {
            console.error("Chat Error:", error);
            setStatus('error');
        }
    };

    const handleAction = async (action: string) => {
        setInputValue(`I would like to ${action}`);
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">

            {/* CHAT WINDOW */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="pointer-events-auto mb-4 w-[380px] h-[600px] max-h-[80vh] bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-teal-500/20 p-1.5 border border-white/10 flex items-center justify-center">
                                    <QodeeLogo className="w-full h-full" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">Qodee</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === 'ready' ? "bg-green-500" : "bg-violet-500")} />
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            {status === 'streaming' ? 'Thinking...' : 'Online & Ready'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            {messages.map((msg: any) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                            <QodeeLogo className="w-5 h-5" />
                                        </div>
                                    )}
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-violet-600 flex-shrink-0 flex items-center justify-center mt-1">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        msg.role === 'assistant'
                                            ? "bg-zinc-900/80 text-zinc-200 border border-white/5 rounded-tl-sm"
                                            : "bg-violet-600 text-white rounded-tr-sm"
                                    )}>
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown
                                                components={{
                                                    strong: ({ node, ...props }) => <span className="font-bold text-violet-400" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1 space-y-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 max-w-[85%]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                                        <QodeeLogo className="w-5 h-5" />
                                    </div>
                                    <div className="bg-zinc-900/80 border border-white/5 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Suggestions (Only show if few messages) */}
                        {messages.length < 3 && !isLoading && (
                            <div className="px-4 pb-4">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2 ml-1">Suggested Actions</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {SUGGESTED_ACTIONS.map(action => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleAction(action.label)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-violet-500/30 transition-all text-left group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                                                <action.icon className="w-4 h-4 text-zinc-400 group-hover:text-violet-400" />
                                            </div>
                                            <span className="text-xs text-zinc-300 group-hover:text-white font-medium">{action.label}</span>
                                            <ChevronDown className="w-3 h-3 text-zinc-600 group-hover:text-violet-400 ml-auto -rotate-90" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-zinc-900/80 border-t border-white/5 backdrop-blur-md">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative"
                            >
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask Qodee anything..."
                                    className="pr-12 bg-zinc-950 border-white/10 focus-visible:ring-violet-500/50 rounded-xl h-12 text-sm shadow-inner"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="absolute right-1 top-1 h-10 w-10 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:bg-transparent disabled:text-zinc-600"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-zinc-600">Qodee can make mistakes. Double-check replies.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB TRIGGER */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "pointer-events-auto h-14 w-14 rounded-full shadow-[0_4px_20px_rgba(139,92,246,0.3)] border border-white/10 flex items-center justify-center transition-all duration-300 relative group overflow-hidden",
                    isOpen ? "bg-zinc-800" : "bg-zinc-900"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-teal-400/20 group-hover:opacity-100 opacity-50 transition-opacity" />

                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <ChevronDown className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="p-3"
                        >
                            <QodeeLogo className="w-full h-full" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Online Indicator Dot on FAB */}
                {!isOpen && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900 z-10" />
                )}
            </motion.button>

        </div>
    );
}
