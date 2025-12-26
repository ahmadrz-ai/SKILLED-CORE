'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Building2, TrendingUp } from 'lucide-react';
import { PostCard, type PostProps } from '@/components/feed/PostCard';
import { StartPostWidget } from '@/components/feed/StartPostWidget';
import { TrendingWidget } from '@/components/feed/TrendingWidget';
import { ProfileSideWidget } from '@/components/feed/ProfileSideWidget';
import { RecommendationsWidget } from '@/components/feed/RecommendationsWidget';
import { PromotedWidget } from '@/components/feed/PromotedWidget';


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
            isHiring: false // Not yet in schema/fetch, placeholder if needed
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
            <div className="hidden lg:block space-y-4">
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
            <div className="hidden lg:block space-y-4">
                <TrendingWidget topics={trendingTopics} />
                <RecommendationsWidget />

                <div className="bg-zinc-900/40 rounded-xl p-6 border border-white/5 sticky top-[280px] backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Recommended Jobs</h2>
                        <Briefcase className="w-4 h-4 text-zinc-600" />
                    </div>
                    <ul className="space-y-4">
                        {latestJobs.length === 0 ? (
                            <li className="text-zinc-500 text-xs text-center py-4">
                                No active jobs detected.
                            </li>
                        ) : latestJobs.map((job) => (
                            <Link href={`/jobs/${job.id}`} key={job.id}>
                                <li className="group cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                    <h3 className="font-bold text-sm text-zinc-200 group-hover:text-violet-400 transition-colors">{job.title}</h3>
                                    <div className="flex items-center text-xs text-zinc-500 mt-1">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {job.company.name}
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-zinc-600">{job.location}</span>
                                        {(job.salaryMin || 0) > 0 && (
                                            <span className="text-xs text-green-400/80 font-mono">
                                                ${(job.salaryMin || 0) / 1000}k - ${(job.salaryMax || 0) / 1000}k
                                            </span>
                                        )}
                                    </div>
                                </li>
                            </Link>
                        ))}
                    </ul>
                    <div className="pt-4 mt-2 border-t border-white/5 text-center">
                        <Link href="/jobs" className="text-xs text-violet-400 hover:text-violet-300 font-bold tracking-wide flex items-center justify-center">
                            VIEW ALL JOBS <TrendingUp className="w-3 h-3 ml-1" />
                        </Link>
                    </div>
                </div>
            </div>


        </div>
    );
}
