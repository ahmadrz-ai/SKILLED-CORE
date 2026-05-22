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
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Top Row: Avatar + Input Trigger */}
            <div className="flex gap-3 mb-3">
                <Avatar className="w-12 h-12 cursor-pointer border border-[#E5E7EB]">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
 
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex-1 text-left bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-full px-5 py-3 text-sm font-semibold text-[#6B7280] transition-colors duration-200">
                            Start a post...
                        </button>
                    </DialogTrigger>
 
                    {/* The Posting Dialog */}
                    <DialogContent
                        className="bg-white border-[#E5E7EB] text-[#111827] sm:max-w-4xl p-0 overflow-visible shadow-xl"
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                            textareaRef.current?.focus();
                        }}
                    >
                        <DialogHeader className="p-4 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
                            <DialogTitle className="text-lg font-bold text-[#111827]">Create a post</DialogTitle>
                        </DialogHeader>
 
                        <div className="p-4">
                            {/* User Info in Dialog */}
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="w-10 h-10 border border-[#E5E7EB]">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-bold">{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-sm text-[#111827]">{user?.name}</div>
                                    <div className="text-xs text-[#6B7280] font-medium">Post to Anyone</div>
                                </div>
                            </div>
 
                            {/* Text Area */}
                            <Textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e: any) => setContent(e.target.value)}
                                placeholder="What do you want to talk about?"
                                className="w-full bg-transparent border-none focus-visible:ring-0 text-[#111827] text-lg min-h-[300px] resize-none placeholder:text-[#9CA3AF] caret-[#6366F1] relative cursor-text display-block focus-visible:ring-offset-0 focus:ring-0"
                            />
 
                            {/* Poll Editor */}
                            {isPollMode && (
                                <div className="mt-4 p-4 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
                                    <label className="text-xs font-bold text-[#6B7280] uppercase mb-2 block tracking-wider">Poll Options</label>
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
                                                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#6366F1] focus:outline-none transition-colors"
                                            />
                                        ))}
                                    </div>
                                    {pollOptions.length < 4 && (
                                        <button
                                            onClick={() => setPollOptions([...pollOptions, ""])}
                                            className="mt-2.5 text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            )}
 
                            {/* Bottom Bar: Tools & Post Button */}
                            <div className="flex items-center justify-between mt-6 pt-3 border-t border-[#E5E7EB]">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setContent(prev => prev + " #")}
                                        className="text-[#6366F1] hover:bg-[#EEF2FF] font-bold px-2.5 rounded-full text-xs h-8 animate-none"
                                    >
                                        # Hashtag
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setContent(prev => prev + " @")}
                                        className="text-[#2563EB] hover:bg-[#EFF6FF] font-bold px-2.5 rounded-full text-xs h-8 animate-none"
                                    >
                                        @ Mention
                                    </Button>
 
                                    <div className="w-px h-6 bg-[#E5E7EB] mx-2" />
 
                                    {/* Real Tools inside Dialog */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsPollMode(!isPollMode)}
                                        className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none", isPollMode ? "text-[#6366F1] bg-[#EEF2FF] hover:bg-[#EEF2FF]" : "text-[#6B7280]")}
                                    >
                                        <BarChart2 className="w-5 h-5" />
                                    </Button>
 
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none", showEmojiPicker ? "text-[#D97706] bg-[#FFFBEB] hover:bg-[#FFFBEB]" : "text-[#6B7280]")}
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            <Smile className="w-5 h-5" />
                                        </Button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 z-50 mb-2">
                                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                                <div className="relative z-50 shadow-2xl rounded-lg overflow-hidden border border-[#E5E7EB]">
                                                    <EmojiPicker
                                                        theme={"light" as any}
                                                        onEmojiClick={(emojiData) => {
                                                            setContent(prev => prev + emojiData.emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
 
                                    <Button variant="ghost" size="icon" className="text-[#6B7280] hover:bg-[#F3F4F6] rounded-full w-9 h-9 animate-none" onClick={() => handleFeatureDisabled("Image Upload")}>
                                        <ImageIcon className="w-5 h-5" />
                                    </Button>
                                </div>
 
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-xs font-mono font-bold transition-colors hidden sm:inline",
                                        (3000 - content.length) < 0 ? "text-red-500" :
                                            (3000 - content.length) < 200 ? "text-yellow-500" : "text-[#9CA3AF]"
                                    )}>
                                        {3000 - content.length} chars
                                    </span>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!content.trim() || content.length > 3000}
                                        className="rounded-full px-6 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold h-9 transition-colors shadow-sm animate-none"
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
            <div className="flex justify-between px-2 pt-2 border-t border-[#F3F4F6]">
                <button
                    onClick={() => handleFeatureDisabled("Media Gallery")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#EFF6FF] transition-all duration-200 text-[#6B7280] hover:text-[#2563EB] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <ImageIcon className="w-5 h-5 text-[#2563EB] group-hover:scale-110 transition-transform duration-200" />
                    <span>Media</span>
                </button>
 
                <button
                    onClick={() => handleFeatureDisabled("Events")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#FFFBEB] transition-all duration-200 text-[#6B7280] hover:text-[#D97706] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <Calendar className="w-5 h-5 text-[#D97706] group-hover:scale-110 transition-transform duration-200" />
                    <span>Event</span>
                </button>
 
                <button
                    onClick={() => handleFeatureDisabled("Articles")}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#FEF2F2] transition-all duration-200 text-[#6B7280] hover:text-[#EF4444] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <FileText className="w-5 h-5 text-[#EF4444] group-hover:scale-110 transition-transform duration-200" />
                    <span>Write article</span>
                </button>
            </div>
        </div>
    );
}
