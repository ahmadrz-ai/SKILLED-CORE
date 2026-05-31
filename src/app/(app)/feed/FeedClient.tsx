'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { PostCard, type PostProps } from '@/components/feed/PostCard';
import { SponsoredPostCard } from '@/components/feed/SponsoredPostCard';
import { AdsterraNativeAdCard } from '@/components/feed/AdsterraNativeAdCard';
import { StartPostWidget } from '@/components/feed/StartPostWidget';
import { TrendingWidget } from '@/components/feed/TrendingWidget';
import { ProfileSideWidget } from '@/components/feed/ProfileSideWidget';
import { RecommendationsWidget } from '@/components/feed/RecommendationsWidget';
import { PromotedWidget } from '@/components/feed/PromotedWidget';
import { RecommendedJobsWidget } from '@/components/feed/RecommendedJobsWidget';
import { EmptyState } from '@/components/ui/empty-state';
import { Newspaper } from 'lucide-react';


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

const sponsoredPosts = [
  {
    id: "sp-1",
    sponsorName: "Neon",
    sponsorCategory: "Database Cloud",
    title: "Serverless Postgres with Instant Branching",
    content: "Stop provisioning servers. Neon scales your database to zero when inactive and gives you instant database branch copies for your preview deployments on Vercel.",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    ctaText: "Start Free",
    ctaUrl: "https://neon.tech",
    initialLikes: 142,
    initialViews: 1980
  },
  {
    id: "sp-2",
    sponsorName: "Cloudinary",
    sponsorCategory: "Media Management",
    title: "Image & Video Optimization Made Effortless",
    content: "Deliver rich media fast. Automatically optimize, transform, and deliver images and videos customized for any device or screen size using Cloudinary's global content delivery network.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    ctaText: "Optimize Media",
    ctaUrl: "https://cloudinary.com",
    initialLikes: 89,
    initialViews: 1240
  },
  {
    id: "sp-3",
    sponsorName: "SkilledCore Premium",
    sponsorCategory: "Social & Recruitment SaaS",
    title: "Boost Your Recruitment Strategy",
    content: "Unlock deep-search filters, direct developer inbox credits, and verified Recruiter Badges to accelerate your hire rates. Get started with SkilledCore Premium today.",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    ctaText: "Upgrade Plan",
    ctaUrl: "/credits",
    initialLikes: 256,
    initialViews: 3210
  }
];

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
        image: p.image,
        tags: p.tags ? p.tags.split(',') : [],
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
    const [isFolded, setIsFolded] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            setIsFolded(window.scrollY > 120);
        };
        handleScroll(); // Evaluate synchronously on mount to capture browser scroll restoration!
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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


    const handleAddPost = async (content: string, pollOptions?: string[], imageUrl?: string) => {
        const result = await createPost(content, undefined, pollOptions, imageUrl);
        if (result.success) {
            toast.success(result.message);
            if (result.post) {
                setPosts([mapPost(result.post), ...posts]);
            }
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
        <div className="flex flex-row gap-8 items-start max-w-[1380px] mx-auto px-4 lg:px-8 py-6">

            {/* Left Column: Identity Card (Sticky & Scrollless) */}
            <div className="hidden lg:block w-72 shrink-0 sticky top-20 self-start space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

                {/* Legal Footer */}
                <div className="text-[11px] text-zinc-600 text-center px-2 py-2 leading-relaxed">
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                        <Link href="/legal/user-agreement" className="hover:text-zinc-400 hover:underline">User Agreement</Link>
                        <Link href="/terms" className="hover:text-zinc-400 hover:underline">Terms of Service</Link>
                        <Link href="/legal/privacy-policy" className="hover:text-zinc-400 hover:underline">Privacy Policy</Link>
                        <Link href="/legal/cookie-policy" className="hover:text-zinc-400 hover:underline">Cookie Policy</Link>
                        <Link href="/accessibility" className="hover:text-zinc-400 hover:underline">Accessibility</Link>
                        <Link href="/legal/copyright-policy" className="hover:text-zinc-400 hover:underline">Copyright Policy</Link>
                    </div>
                    <div className="mt-2 text-zinc-700">
                        Skilled Core Corporation © 2026
                    </div>
                </div>
            </div>

            {/* Center Column: Feed */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
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
                        {posts.map((post, index) => {
                            const showAd = (index + 1) % 3 === 0;
                            const adIndex = Math.floor(index / 3);

                            return (
                                <Fragment key={post.id}>
                                    <motion.div
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

                                    {showAd && (
                                        <motion.div
                                            key={`ad-${index}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            layout
                                        >
                                            {adIndex % 2 === 1 ? (
                                                <AdsterraNativeAdCard />
                                            ) : (
                                                (() => {
                                                    const staticAd = sponsoredPosts[Math.floor(adIndex / 2) % sponsoredPosts.length];
                                                    return (
                                                        <SponsoredPostCard
                                                            id={staticAd.id}
                                                            sponsorName={staticAd.sponsorName}
                                                            sponsorCategory={staticAd.sponsorCategory}
                                                            title={staticAd.title}
                                                            content={staticAd.content}
                                                            imageUrl={staticAd.imageUrl}
                                                            ctaText={staticAd.ctaText}
                                                            ctaUrl={staticAd.ctaUrl}
                                                            initialLikes={staticAd.initialLikes}
                                                            initialViews={staticAd.initialViews}
                                                        />
                                                    );
                                                })()
                                            )}
                                        </motion.div>
                                    )}
                                </Fragment>
                            );
                        })}
                        {posts.length === 0 && (
                            <EmptyState
                                icon={Newspaper}
                                title="Nothing in your feed yet"
                                description="Follow professionals, connect with recruiters, and explore open jobs to populate your personalized feed."
                                ctaText="Browse Jobs"
                                ctaHref="/jobs"
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Loader */}
                {/* <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div> */}
            </div>

            {/* Right Column: Trending & Jobs (Sticky & Scrollless) */}
            <div className="hidden lg:block w-[340px] shrink-0 sticky top-20 self-start flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="space-y-4">
                    <TrendingWidget topics={trendingTopics} isFolded={isFolded} isCollapsed={scrollY > 150} />
                    <RecommendationsWidget isFolded={isFolded} isCollapsed={scrollY > 300} />
                    <RecommendedJobsWidget jobs={latestJobs} isFolded={isFolded} isCollapsed={scrollY > 450} />
                </div>
            </div>


        </div>
    );
}
