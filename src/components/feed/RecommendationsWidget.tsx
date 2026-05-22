"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecommendedUsers, toggleFollow } from "@/app/(app)/feed/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface RecommendedUser {
    id: string;
    name: string;
    title: string;
    image: string;
    isFollowing: boolean;
    username?: string;
}

export function RecommendationsWidget({ isFolded = false }: { isFolded?: boolean }) {
    const [suggestions, setSuggestions] = useState<RecommendedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        getRecommendedUsers()
            .then(setSuggestions)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleFollowClick = async (user: RecommendedUser) => {
        if (user.isFollowing) { router.push(`/messages?userId=${user.id}`); return; }
        setSuggestions(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: true } : u));
        const res = await toggleFollow(user.id);
        if (res.success) {
            toast.success(res.following ? `Following ${user.name}` : `Unfollowed ${user.name}`);
            setSuggestions(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: res.following || false } : u));
        } else {
            setSuggestions(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: false } : u));
            toast.error(res.message);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-[#E5E7EB] rounded-xl mt-4 p-4">
                <div className="h-4 w-24 rounded animate-pulse mb-4" style={{ backgroundColor: '#E5E7EB' }} />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#E5E7EB' }} />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-28 rounded animate-pulse" style={{ backgroundColor: '#E5E7EB' }} />
                                <div className="h-2 w-20 rounded animate-pulse" style={{ backgroundColor: '#F3F4F6' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden mt-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-[#111827] text-sm">Add to your feed</h3>
                {suggestions.length > 0 && (
                    <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-widest bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded">Ad</span>
                )}
            </div>

            <div className="px-4 pb-4 flex flex-col gap-4">
                {suggestions.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-[#6B7280] font-medium">You're all caught up!</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">Check back later for more.</p>
                    </div>
                ) : (
                    <>
                        {/* First recommendation is always visible */}
                        <div className="flex gap-3 items-start">
                            <Link href={`/profile/${suggestions[0].username || suggestions[0].id}`} className="flex-shrink-0 mt-0.5 hover:opacity-90 transition-opacity">
                                <Avatar className="w-10 h-10 border border-[#E5E7EB] shadow-sm">
                                    <AvatarImage src={suggestions[0].image} />
                                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-extrabold text-sm">{suggestions[0].name[0]}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link href={`/profile/${suggestions[0].username || suggestions[0].id}`} className="hover:underline">
                                    <div className="font-bold text-sm text-[#111827] truncate hover:text-[#6366F1] transition-colors">{suggestions[0].name}</div>
                                </Link>
                                <div className="text-xs text-[#6B7280] font-medium truncate mb-2.5 leading-normal">{suggestions[0].title}</div>
                                <button
                                    onClick={() => handleFollowClick(suggestions[0])}
                                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                                        suggestions[0].isFollowing
                                            ? "text-[#6B7280] border-[#E5E7EB] hover:text-[#EF4444] hover:bg-[#FEF2F2] hover:border-[#FCA5A5]"
                                            : "text-[#6366F1] border-[#C7D2FE] bg-[#EEF2FF] hover:bg-[#E0E7FF] hover:text-[#4F46E5]"
                                    }`}
                                >
                                    {suggestions[0].isFollowing
                                        ? <><MessageSquare className="w-3.5 h-3.5" /> Message</>
                                        : <><Plus className="w-3.5 h-3.5" /> Follow</>}
                                </button>
                            </div>
                        </div>

                        {/* Extra items fold with animation */}
                        <AnimatePresence initial={false}>
                            {!isFolded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden flex flex-col gap-4"
                                >
                                    {suggestions.slice(1).map((item) => (
                                        <div key={item.id} className="flex gap-3 items-start pt-2">
                                            <Link href={`/profile/${item.username || item.id}`} className="flex-shrink-0 mt-0.5 hover:opacity-90 transition-opacity">
                                                <Avatar className="w-10 h-10 border border-[#E5E7EB] shadow-sm">
                                                    <AvatarImage src={item.image} />
                                                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-extrabold text-sm">{item.name[0]}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/profile/${item.username || item.id}`} className="hover:underline">
                                                    <div className="font-bold text-sm text-[#111827] truncate hover:text-[#6366F1] transition-colors">{item.name}</div>
                                                </Link>
                                                <div className="text-xs text-[#6B7280] font-medium truncate mb-2.5 leading-normal">{item.title}</div>
                                                <button
                                                    onClick={() => handleFollowClick(item)}
                                                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                                                        item.isFollowing
                                                            ? "text-[#6B7280] border-[#E5E7EB] hover:text-[#EF4444] hover:bg-[#FEF2F2] hover:border-[#FCA5A5]"
                                                            : "text-[#6366F1] border-[#C7D2FE] bg-[#EEF2FF] hover:bg-[#E0E7FF] hover:text-[#4F46E5]"
                                                    }`}
                                                >
                                                    {item.isFollowing
                                                        ? <><MessageSquare className="w-3.5 h-3.5" /> Message</>
                                                        : <><Plus className="w-3.5 h-3.5" /> Follow</>}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {suggestions.length > 0 && (
                <Link href="/network" className="block p-3 text-center border-t border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <span className="text-xs text-[#6366F1] font-bold tracking-wider uppercase">View all recommendations</span>
                </Link>
            )}
        </div>
    );
}
