"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image as ImageIcon, Calendar, FileText, X, BarChart2, Smile, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import EmojiPicker from 'emoji-picker-react';

interface StartPostWidgetProps {
    onPostCreated?: (content: string, pollOptions?: string[]) => void;
}

export function StartPostWidget({ onPostCreated }: StartPostWidgetProps) {
    const { data: session } = useSession();
    const user = session?.user;
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [isPollMode, setIsPollMode] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Force focus when dialog opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleFeatureDisabled = (feature: string) => {
        toast.info(`${feature} is currently disabled.`);
    };

    const handleSubmit = () => {
        if (!content.trim()) return;

        // Validation logic
        let validOptions: string[] | undefined;
        if (isPollMode) {
            validOptions = pollOptions.filter(o => o.trim().length > 0);
            if (validOptions.length < 2) {
                toast.error("Poll needs at least 2 options");
                return;
            }
        }

        onPostCreated?.(content, validOptions);

        // Reset and close
        setContent("");
        setPollOptions(["", ""]);
        setIsPollMode(false);
        setIsOpen(false);
        toast.success("Post sent.");
    };

    return (
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4 shadow-lg">
            {/* Top Row: Avatar + Input Trigger */}
            <div className="flex gap-3 mb-3">
                <Avatar className="w-12 h-12 cursor-pointer">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex-1 text-left bg-zinc-950/50 hover:bg-zinc-950/80 border border-white/10 rounded-full px-5 py-3 text-sm font-medium text-zinc-400 transition-colors">
                            Start a post
                        </button>
                    </DialogTrigger>

                    {/* The Posting Dialog */}
                    <DialogContent
                        className="bg-zinc-950 border-white/10 text-white sm:max-w-4xl p-0 overflow-visible"
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                            textareaRef.current?.focus();
                        }}
                    >
                        <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                            <DialogTitle className="text-lg">Create a post</DialogTitle>
                        </DialogHeader>

                        <div className="p-4">
                            {/* User Info in Dialog */}
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-sm">{user?.name}</div>
                                    <div className="text-xs text-zinc-400">Post to Anyone</div>
                                </div>
                            </div>

                            {/* Text Area */}
                            <Textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e: any) => setContent(e.target.value)}
                                placeholder="What do you want to talk about?"
                                className="w-full bg-transparent border-none focus-visible:ring-0 text-white text-lg min-h-[400px] resize-none placeholder:text-zinc-500 caret-violet-500 relative cursor-text display-block"
                            />

                            {/* Poll Editor */}
                            {isPollMode && (
                                <div className="mt-4 p-4 border border-white/10 rounded-xl bg-zinc-900/30">
                                    <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Poll Options</label>
                                    <div className="space-y-2">
                                        {pollOptions.map((opt, idx) => (
                                            <input
                                                key={idx}
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...pollOptions];
                                                    newOpts[idx] = e.target.value;
                                                    setPollOptions(newOpts);
                                                }}
                                                placeholder={`Option ${idx + 1}`}
                                                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                                            />
                                        ))}
                                    </div>
                                    {pollOptions.length < 4 && (
                                        <button
                                            onClick={() => setPollOptions([...pollOptions, ""])}
                                            className="mt-2 text-xs font-bold text-violet-400 hover:text-violet-300"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Bottom Bar: Tools & Post Button */}
                            <div className="flex items-center justify-between mt-6 pt-2">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setContent(prev => prev + " #")}
                                        className="text-white hover:bg-violet-500/20 font-bold px-2"
                                    >
                                        # Hashtag
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setContent(prev => prev + " @")}
                                        className="text-white hover:bg-blue-500/20 font-bold px-2"
                                    >
                                        @ Mention
                                    </Button>

                                    <div className="w-px h-6 bg-white/10 mx-2" />

                                    {/* Real Tools inside Dialog */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsPollMode(!isPollMode)}
                                        className={isPollMode ? "text-violet-400" : "text-zinc-400"}
                                    >
                                        <BarChart2 className="w-5 h-5" />
                                    </Button>

                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={showEmojiPicker ? "text-yellow-400" : "text-zinc-400"}
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            <Smile className="w-5 h-5" />
                                        </Button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 z-50 mb-2">
                                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                                <div className="relative z-50">
                                                    <EmojiPicker
                                                        theme={"dark" as any}
                                                        onEmojiClick={(emojiData) => {
                                                            setContent(prev => prev + emojiData.emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Disabled Media Tools inside Dialog too? Or typical LinkedIn just has image button. */}
                                    <Button variant="ghost" size="icon" className="text-zinc-400" onClick={() => handleFeatureDisabled("Image Upload")}>
                                        <ImageIcon className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={cn("text-xs font-mono font-bold transition-colors",
                                        (3000 - content.length) < 0 ? "text-red-500" :
                                            (3000 - content.length) < 200 ? "text-yellow-500" : "text-zinc-600"
                                    )}>
                                        {3000 - content.length} characters remaining
                                    </span>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!content.trim() || content.length > 3000}
                                        className="rounded-full px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold"
                                    >
                                        Post
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Bottom Row: Media Buttons (Disabled) */}
            <div className="flex justify-between px-2 pt-1">
                <button
                    onClick={() => handleFeatureDisabled("Media Gallery")}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-blue-400"
                >
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Media</span>
                </button>

                <button
                    onClick={() => handleFeatureDisabled("Events")}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-orange-400"
                >
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">Event</span>
                </button>

                <button
                    onClick={() => handleFeatureDisabled("Articles")}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-red-400"
                >
                    <FileText className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium">Write article</span>
                </button>
            </div>
        </div >
    );
}
