"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecommendedUsers, toggleFollow } from "@/app/(app)/feed/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RecommendedUser {
    id: string;
    name: string;
    title: string;
    image: string;
    isFollowing: boolean;
}

export function RecommendationsWidget() {
    const [suggestions, setSuggestions] = useState<RecommendedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadRecommendations() {
            try {
                const users = await getRecommendedUsers();
                setSuggestions(users);
            } catch (error) {
                console.error("Failed to load recommendations");
            } finally {
                setLoading(false);
            }
        }
        loadRecommendations();
    }, []);

    const handleFollowClick = async (user: RecommendedUser) => {
        if (user.isFollowing) {
            router.push(`/messages?userId=${user.id}`);
            return;
        }

        // Optimistic update
        setSuggestions(prev => prev.map(u =>
            u.id === user.id ? { ...u, isFollowing: true } : u
        ));

        const res = await toggleFollow(user.id);
        if (res.success) {
            toast.success(res.following ? `Following ${user.name}` : `Unfollowed ${user.name}`);
            setSuggestions(prev => prev.map(u =>
                u.id === user.id ? { ...u, isFollowing: res.following || false } : u
            ));
        } else {
            // Revert
            setSuggestions(prev => prev.map(u =>
                u.id === user.id ? { ...u, isFollowing: false } : u
            ));
            toast.error(res.message);
        }
    };

    if (loading) {
        return (
            <div className="bg-zinc-900/40 rounded-xl border border-white/5 backdrop-blur-md overflow-hidden mt-4 p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-white/10 rounded w-2/3" />
                                <div className="h-2 bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/40 rounded-xl border border-white/5 backdrop-blur-md overflow-hidden mt-4">
            <div className="p-4 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Add to your feed</h3>
                {suggestions.length > 0 && <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">Ad</span>}
            </div>

            <div className="flex flex-col gap-4 p-4 pt-0">
                {suggestions.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Plus className="w-5 h-5 text-zinc-600 rotate-45" />
                        </div>
                        <p className="text-sm text-zinc-400 font-medium">You're all caught up!</p>
                        <p className="text-xs text-zinc-600 mt-1">Check back later for more.</p>
                    </div>
                ) : (
                    suggestions.map((item) => (
                        <div key={item.id} className="flex gap-3 items-start">
                            <Avatar className="w-10 h-10 border border-white/10 mt-1">
                                <AvatarImage src={item.image} />
                                <AvatarFallback>{item.name[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-zinc-200 truncate">{item.name}</div>
                                <div className="text-xs text-zinc-500 truncate mb-2">{item.title}</div>
                                <Button
                                    variant={item.isFollowing ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleFollowClick(item)}
                                    className={`h-8 rounded-full font-bold text-xs ${item.isFollowing
                                        ? "bg-white/10 text-white hover:bg-white/20"
                                        : "border-white/20 hover:bg-white/10 hover:border-white/30 text-zinc-300"
                                        }`}
                                >
                                    {item.isFollowing ? (
                                        <>
                                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                            Message
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Follow
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {suggestions.length > 0 && (
                <div className="p-3 text-center border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <span className="text-sm text-zinc-400 font-medium">View all recommendations</span>
                </div>
            )}
        </div>
    );
}
