'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard, type PostProps } from '@/components/feed/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Star } from 'lucide-react';
import Link from 'next/link';
import { toggleFollow } from '../feed/actions';
import { toast } from 'sonner';

interface SearchClientProps {
    user: any;
    query: string;
    posts: PostProps[];
    people: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
        headline: string | null;
        role: string | null;
        plan: string | null;
        isFollowing?: boolean;
    }[];
}

export default function SearchClient({ user, query, posts, people }: SearchClientProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts'>('all');
    const [localPeople, setLocalPeople] = useState(people);

    const handleFollow = async (targetId: string, currentStatus: boolean) => {
        // Optimistic update
        setLocalPeople(prev => prev.map(p =>
            p.id === targetId ? { ...p, isFollowing: !currentStatus } : p
        ));

        const result = await toggleFollow(targetId);
        if (!result.success) {
            toast.error(result.message);
            // Revert
            setLocalPeople(prev => prev.map(p =>
                p.id === targetId ? { ...p, isFollowing: currentStatus } : p
            ));
        } else {
            toast.success(result.following ? "Followed" : "Unfollowed");
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Left Sidebar: Filters/Tabs */}
            <div className="space-y-4">
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 sticky top-24">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Filters</h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            All Results
                        </button>
                        <button
                            onClick={() => setActiveTab('people')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'people' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            People
                        </button>
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'posts' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            Posts
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">

                {/* People Section */}
                {(activeTab === 'all' || activeTab === 'people') && localPeople.length > 0 && (
                    <div className="space-y-4">
                        {activeTab === 'all' && <h2 className="text-white font-bold text-lg">People</h2>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localPeople.map((person) => (
                                <div key={person.id} className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-zinc-900 transition-colors">
                                    <Link href={`/profile/${person.username || person.id}`}>
                                        <Avatar className="w-16 h-16 border border-white/10">
                                            <AvatarImage src={person.image || ""} />
                                            <AvatarFallback>{person.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${person.username || person.id}`} className="hover:underline">
                                            <h3 className="font-bold text-white truncate flex items-center gap-2">
                                                {person.name}
                                                {person.plan === 'ULTRA' && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                            </h3>
                                        </Link>
                                        <p className="text-zinc-500 text-xs truncate">{person.headline || "No headline"}</p>
                                        {person.role === 'RECRUITER' && (
                                            <span className="inline-block mt-1 text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20 uppercase font-bold tracking-wider">
                                                Recruiter
                                            </span>
                                        )}
                                    </div>
                                    {user.id !== person.id && (
                                        <Button
                                            size="sm"
                                            variant={person.isFollowing ? "outline" : "default"}
                                            className={person.isFollowing
                                                ? "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                                                : "bg-violet-600 hover:bg-violet-500 text-white"
                                            }
                                            onClick={() => handleFollow(person.id, person.isFollowing || false)}
                                        >
                                            {person.isFollowing ? "Following" : <UserPlus className="w-4 h-4" />}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts Section */}
                {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                    <div className="space-y-4">
                        {activeTab === 'all' && <h2 className="text-white font-bold text-lg mt-4">Posts</h2>}
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty States */}
                {activeTab === 'people' && localPeople.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-zinc-900/30">
                        <p className="text-zinc-500">No people found matching "{query}"</p>
                    </div>
                )}
                {activeTab === 'posts' && posts.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-zinc-900/30">
                        <p className="text-zinc-500">No posts found matching "{query}"</p>
                    </div>
                )}
                {activeTab === 'all' && posts.length === 0 && localPeople.length === 0 && (
                    <div className="text-center py-20">
                        <h2 className="text-xl font-bold text-white mb-2">No Results Found</h2>
                        <p className="text-zinc-500">We couldn't find anything for "{query}". Try a different keyword.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
