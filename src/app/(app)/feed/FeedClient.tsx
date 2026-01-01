'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { PostCard, type PostProps } from '@/components/feed/PostCard';
import { StartPostWidget } from '@/components/feed/StartPostWidget';
import { TrendingWidget } from '@/components/feed/TrendingWidget';
import { ProfileSideWidget } from '@/components/feed/ProfileSideWidget';
import { RecommendationsWidget } from '@/components/feed/RecommendationsWidget';
import { PromotedWidget } from '@/components/feed/PromotedWidget';
import { RecommendedJobsWidget } from '@/components/feed/RecommendedJobsWidget';


import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPost, toggleLike } from './actions';
import { toast } from 'sonner';

interface FeedClientProps {
    user: {
        id: string; // Needed for optimisitc updates
        name?: string | null;
        email?: string | null;
        image?: string | null;
        headline?: string | null;
        username?: string | null;
        bannerUrl?: string | null;
        plan?: string;
    };
    promotedUser?: {
        id: string;
        name: string | null;
        headline: string | null;
        image: string | null;
    } | null;
    latestJobs: {
        id: string;
        title: string;
        company: { name: string };
        location: string;
        salaryMin: number | null;
        salaryMax: number | null;
    }[];
    initialPosts: any[]; // Prisma Post type with inclusions
    stats: {
        profileViews: number;
        impressions: number;
    };
    trendingTopics: { tag: string; posts: string }[];
}

export default function FeedClient({ user, latestJobs, initialPosts, stats, trendingTopics, promotedUser }: FeedClientProps) {
    // Map initial Prisma posts to UI PostProps
    const mapPost = (p: any): PostProps => ({
        id: p.id,
        author: {
            id: p.userId,
            name: p.author?.name || 'Anonymous',
            handle: p.author?.username ? `@${p.author.username}` : '@user',
            avatar: p.author?.image,
            isFollowing: p.author?.isFollowing, // Mapped from server
            connectionStatus: p.author?.connectionStatus, // Mapped from server
            isHiring: false, // Not yet in schema/fetch, placeholder if needed
            role: p.author?.role,
            nodeType: p.author?.nodeType,
            plan: p.author?.plan
        },
        content: p.content,
        timestamp: new Date(p.createdAt).toLocaleString(),
        likes: p.likes?.length || 0,
        comments: p._count?.comments || 0,
        isLiked: p.likes?.some((l: any) => l.userId === user.id) || false,
        codeSnippet: p.codeSnippet,
        poll: p.poll ? {
            id: p.poll.id,
            question: p.poll.question,
            options: p.poll.options?.map((o: any) => ({
                id: o.id,
                text: o.text,
                votes: o.votes || 0
            })) || []
        } : undefined
    });

    const router = useRouter();
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<PostProps[]>(initialPosts.map(mapPost));

    // Scroll to post if query param exists
    useEffect(() => {
        const postId = searchParams.get('postId');
        if (postId) {
            // Function to attempt scrolling and highlighting
            const attemptHighlight = (attempts: number) => {
                const element = document.getElementById(`post-${postId}`);
                if (element) {
                    // Scroll
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Strong Visual Highlight
                    // Using transition for smooth fade out
                    element.style.transition = 'all 1s ease-out';
                    element.classList.add('ring-2', 'ring-violet-500', 'bg-violet-500/20', 'rounded-xl');

                    // Remove after delay
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-violet-500', 'bg-violet-500/20');
                        // Keep rounded-xl if it was part of original styles, but safe to remove if we added it.
                        // Actually PostCard usually has rounded-xl.
                    }, 3000);
                } else if (attempts > 0) {
                    // Retry if not found yet (e.g. data fetching)
                    setTimeout(() => attemptHighlight(attempts - 1), 500);
                }
            };

            // Start attempts
            attemptHighlight(5); // Try for 2.5 seconds
        }
    }, [searchParams]);


    const handleAddPost = async (content: string, pollOptions?: string[]) => {
        const result = await createPost(content, undefined, pollOptions);
        if (result.success) {
            toast.success(result.message);
            if (result.post) {
                setPosts([mapPost(result.post), ...posts]);
            }
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    // We need to pass a "onLike" handler to PostCard or handle it internally? 
    // PostCard might not have an onLike prop. I'll check PostCard later.
    // For now, mapping data.

    const handleDeletePost = (postId: string) => {
        setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postId));
    };

    // Derived Initials
    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Left Column: Identity Card (Sticky) */}
            <div className="hidden lg:block space-y-4 sticky top-6 self-start">
                <ProfileSideWidget
                    user={{
                        id: user.id,
                        name: user.name ?? null,
                        username: user.username ?? null,
                        image: user.image ?? null,
                        headline: user.headline ?? null,
                        bannerUrl: user.bannerUrl ?? null
                    }}
                    stats={stats}
                />
            </div>

            {/* Center Column: Feed */}
            <div className="lg:col-span-2 space-y-4">
                <StartPostWidget onPostCreated={handleAddPost} />

                {/* Self Promotion Preview if Pro/Ultra */}
                {(user.plan === "PRO" || user.plan === "ULTRA") && (
                    <PromotedWidget promotedUser={{
                        id: user.id,
                        name: user.name || null,
                        headline: user.headline || null,
                        image: user.image || null
                    }} isSelf={true} />
                )}

                {/* Promoted Ad (Random User) */}
                {promotedUser && <PromotedWidget promotedUser={promotedUser} />}

                <div className="space-y-4">
                    <AnimatePresence initial={false} mode="popLayout">
                        {posts.map((post) => (
                            <motion.div
                                key={post.id}
                                id={`post-${post.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                layout
                            >
                                <PostCard
                                    post={post}
                                    onLike={() => toggleLike(post.id)}
                                    onDelete={handleDeletePost}
                                />
                            </motion.div>
                        ))}
                        {posts.length === 0 && (
                            <div className="text-center py-20 text-zinc-500">
                                <p>No posts yet. Be the first.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Loader */}
                {/* <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div> */}
            </div>

            {/* Right Column: Trending & Jobs */}
            <motion.div
                className="hidden lg:block space-y-4 sticky top-6 self-start"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                <TrendingWidget topics={trendingTopics} />
                <RecommendationsWidget />
                <RecommendedJobsWidget jobs={latestJobs} />
            </motion.div>


        </div>
    );
}
