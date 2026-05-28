'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard, type PostProps } from '@/components/feed/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Star, Search } from 'lucide-react';
import Link from 'next/link';
import { toggleFollow } from '../feed/actions';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';

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
                <div className="bg-bg-secondary-panel border border-border-default rounded-xl p-4 sticky top-24">
                    <h3 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3">Filters</h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-bg-sidebar-active text-text-sidebar-active border border-border-selected' : 'text-text-secondary hover:bg-bg-sidebar-hover hover:text-text-heading'}`}
                        >
                            All Results
                        </button>
                        <button
                            onClick={() => setActiveTab('people')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'people' ? 'bg-bg-sidebar-active text-text-sidebar-active border border-border-selected' : 'text-text-secondary hover:bg-bg-sidebar-hover hover:text-text-heading'}`}
                        >
                            People
                        </button>
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'posts' ? 'bg-bg-sidebar-active text-text-sidebar-active border border-border-selected' : 'text-text-secondary hover:bg-bg-sidebar-hover hover:text-text-heading'}`}
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
                        {activeTab === 'all' && <h2 className="text-text-heading font-bold text-lg">People</h2>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localPeople.map((person) => (
                                <div key={person.id} className="bg-bg-card border border-border-card rounded-xl p-4 flex items-center gap-4 hover:bg-bg-card-hover transition-colors shadow-sc-card">
                                    <Link href={`/profile/${person.username || person.id}`}>
                                        <Avatar className="w-16 h-16 border border-border-default">
                                            <AvatarImage src={person.image || ""} />
                                            <AvatarFallback>{person.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${person.username || person.id}`} className="hover:underline">
                                            <h3 className="font-bold text-text-heading truncate flex items-center gap-2">
                                                {person.name}
                                                {person.plan === 'ULTRA' && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                            </h3>
                                        </Link>
                                        <p className="text-text-secondary text-xs truncate">{person.headline || "No headline"}</p>
                                        {person.role === 'RECRUITER' && (
                                            <span className="inline-block mt-1 text-[10px] bg-bg-badge-new text-text-badge-new px-1.5 py-0.5 rounded border border-border-selected uppercase font-bold tracking-wider">
                                                Recruiter
                                            </span>
                                        )}
                                    </div>
                                    {user.id !== person.id && (
                                        <Button
                                            size="sm"
                                            variant={person.isFollowing ? "outline" : "default"}
                                            className={person.isFollowing
                                                ? "border-border-default text-text-secondary hover:text-text-heading hover:bg-bg-card-hover"
                                                : "bg-sc-purple-600 hover:bg-sc-purple-700 text-text-inverse"
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
                        {activeTab === 'all' && <h2 className="text-text-heading font-bold text-lg mt-4">Posts</h2>}
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty States */}
                {activeTab === 'people' && localPeople.length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="No people found"
                        description={`We couldn't find any members matching "${query}". Try checking for typos or searching a more generic term.`}
                    />
                )}
                {activeTab === 'posts' && posts.length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="No posts found"
                        description={`We couldn't find any posts matching "${query}". Try checking for typos or searching a different keyword.`}
                    />
                )}
                {activeTab === 'all' && posts.length === 0 && localPeople.length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="No results for this query"
                        description={`We couldn't find any results matching "${query}". Try checking for typos, using different keywords, or searching a more generic term.`}
                    />
                )}

            </div>
        </div>
    );
}
