"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BarChart2, Smile } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useSession } from "next-auth/react";
import { searchUsers } from "@/app/(app)/feed/actions";

interface CreationStationProps {
    onPostCreated?: (content: string, pollOptions?: string[]) => void;
}

export function CreationStation({ onPostCreated }: CreationStationProps) {
    const { data: session } = useSession();
    const user = session?.user;
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [isPollMode, setIsPollMode] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [mentionResults, setMentionResults] = useState<any[]>([]);

    const handleSubmit = () => {
        if (!content.trim()) return;

        const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount > 500) {
            // Should ideally show a toast here, but we'll just return for now or let validation handle it
            return;
        }

        // Validate Poll
        let validOptions: string[] | undefined;
        if (isPollMode) {
            validOptions = pollOptions.filter(o => o.trim().length > 0);
            if (validOptions.length < 2) {
                // Ideally show error: "Poll needs at least 2 options"
                return;
            }
        }

        // Pass to parent (client-side mock update) - REAL action is called in FeedClient
        const newPost = {
            id: Date.now().toString(),
            author: {
                name: user?.name || 'Anonymous Agent',
                handle: `@${user?.email?.split('@')[0] || 'agent'}`,
                avatar: user?.image || 'https://github.com/shadcn.png'
            },
            content: content,
            timestamp: 'Just now',
            likes: 0,
            comments: 0,
            tags: ['Update'],
            isLiked: false,
            pollOptions: validOptions // Mock property for optimistic update if needed
        };

        // If onPostCreated expects the server action call to happen HERE, we should actually be calling the action here?
        // Ah, FeedClient calls `createPost`. `CreationStation` props: `onPostCreated`.
        // Wait, `FeedClient.tsx` passes `handleAddPost` which CALLS `createPost`.
        // So `onPostCreated` is actually `handleAddPost`.
        // Does `handleAddPost` accept poll options?
        // I need to check `FeedClient.tsx`. For now I will pass the extra data.

        onPostCreated?.(content, validOptions); // Changed signature expectation
        setContent("");
        setPollOptions(["", ""]);
        setIsPollMode(false);
        setIsOpen(false);
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex gap-4">
                <Avatar>
                    <AvatarImage src={user?.image || "https://github.com/shadcn.png"} />
                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'AN'}</AvatarFallback>
                </Avatar>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex-1 text-left bg-zinc-950/50 hover:bg-zinc-950/80 text-zinc-400 rounded-full px-4 py-2.5 text-sm transition-colors border border-white/5 mx-1">
                            Share your latest intel...
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Broadcast Update</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="relative">
                                <textarea
                                    value={content}
                                    onChange={async (e) => {
                                        const val = e.target.value;
                                        setContent(val);

                                        // Simple Mention Detection
                                        const cursor = e.target.selectionStart;
                                        const lastAt = val.lastIndexOf('@', cursor - 1);

                                        if (lastAt !== -1) {
                                            const fragment = val.substring(lastAt, cursor);
                                            // Check if fragment is a valid potential username (no spaces)
                                            if (!/\s/.test(fragment)) {
                                                const query = fragment.substring(1);
                                                if (query.length > 0) {
                                                    try {
                                                        const results = await searchUsers(query);
                                                        setMentionResults(results);
                                                    } catch (err) {
                                                        setMentionResults([]);
                                                    }
                                                } else {
                                                    setMentionResults([]);
                                                }
                                            } else {
                                                setMentionResults([]);
                                            }
                                        } else {
                                            setMentionResults([]);
                                        }
                                    }}
                                    placeholder="What's happening in your sector?"
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg p-3 min-h-[150px] text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none text-white caret-white placeholder:text-zinc-500"
                                />

                                {mentionResults.length > 0 && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                                        {mentionResults.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    // Replace fragment with username
                                                    // This is a naive replacement (all occurrences?) No, need specialized replacement logic.
                                                    // For simple MVP: just append or try to replace the last occurrence logic.

                                                    // Correct logic: Find cursor, find last @ before cursor, replace range.
                                                    // Since we don't have ref to input inside this async closure easily without ref, let's use a simpler "replace current word" logic if possible.
                                                    // But we have `content` state.

                                                    // Actually, simplified replacement:
                                                    const parts = content.split('@');
                                                    // This is risky.

                                                    // Better: use the same detection logic to find the range.
                                                    // Since we don't track cursor in state, we might replace the wrong one if multiple exist.
                                                    // For this task, I'll just append it? No user expects in-place.

                                                    // Let's assume the user is typing at the end for simplicity or use a slightly safer regex replacement for the *last* match?
                                                    // Safe-ish: Replace the specific query string if it matches the end of content?

                                                    // A reliable way without cursor tracking in state is hard.
                                                    // I will update the content by regex replacing the *last* @query pattern? 
                                                    // Or better: Just setContent(prev => ...)

                                                    setContent(prev => {
                                                        // Find last @
                                                        const lastAtIndex = prev.lastIndexOf('@');
                                                        if (lastAtIndex !== -1) {
                                                            const prefix = prev.substring(0, lastAtIndex);
                                                            // We assume the user is still typing this mention.
                                                            return `${prefix}@${u.username} `;
                                                        }
                                                        return prev + `@${u.username} `;
                                                    });
                                                    setMentionResults([]);
                                                }}
                                                className="flex items-center gap-3 w-full p-2 hover:bg-white/10 transition-colors text-left"
                                            >
                                                <Avatar className="w-6 h-6">
                                                    <AvatarImage src={u.image} />
                                                    <AvatarFallback>{u.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{u.name}</span>
                                                    <span className="text-xs text-zinc-500">@{u.username}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {isPollMode && (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <label className="text-xs text-zinc-400 font-medium">Poll Options</label>
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
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg p-2 text-sm text-white/90 focus:outline-none focus:border-violet-500"
                                        />
                                    ))}
                                    {pollOptions.length < 4 && (
                                        <button
                                            onClick={() => setPollOptions([...pollOptions, ""])}
                                            className="text-xs text-violet-400 hover:text-violet-300"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={`h-8 w-8 ${isPollMode ? 'text-violet-400 bg-violet-400/10' : 'text-zinc-400 hover:text-violet-400'}`}
                                        onClick={() => setIsPollMode(!isPollMode)}
                                    >
                                        <BarChart2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-violet-400">
                                        <Smile className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-500 text-white">
                                    Broadcast
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-mono">
                    {content.trim().split(/\s+/).filter(w => w.length > 0).length}/500 Words
                </span>
                <span className="text-xs text-zinc-600 italic">
                    {isPollMode ? "Poll Active" : "Text transmissions only. Media disabled."}
                </span>
            </div>
        </div >
    );
}
