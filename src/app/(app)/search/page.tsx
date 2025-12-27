import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SearchClient from "./SearchClient";
import { searchPosts, searchUsers } from "./actions";
import { Suspense } from "react";
import CoreLoader from "@/components/ui/CoreLoader";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage(props: SearchPageProps) {
    const searchParams = await props.searchParams;
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    const query = searchParams.q || "";

    // Reuse safe user fetch from FeedPage
    let user = null;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });
    } catch (dbError) {
        console.error("SearchPage: DB Error fetching user", dbError);
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-xl font-bold text-red-500">Account Error</h1>
                <p className="text-zinc-500">Could not retrieve user profile.</p>
            </div>
        );
    }

    // Fetch Data
    const [posts, users] = await Promise.all([
        searchPosts(query),
        searchUsers(query)
    ]);

    // Replicate connection/follow mapping logic for Posts
    const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
    });
    const followingIds = new Set(follows.map(f => f.followingId));

    const connections = await prisma.connection?.findMany({
        where: {
            OR: [
                { requesterId: user.id },
                { addresseeId: user.id }
            ]
        }
    }) || [];

    const connectionMap = new Map<string, 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED'>();
    connections.forEach(c => {
        const otherId = c.requesterId === user.id ? c.addresseeId : c.requesterId;
        let status: 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' = 'CONNECTED';
        if (c.status === 'PENDING') {
            status = c.requesterId === user.id ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        }
        connectionMap.set(otherId, status as any);
    });

    const postsWithFollowStatus = posts.map(post => ({
        id: post.id,
        content: post.content,
        timestamp: new Date(post.createdAt).toLocaleString(),
        likes: post.likes.length,
        comments: post._count.comments,
        isLiked: post.likes.some(l => l.userId === user.id),
        codeSnippet: post.codeSnippet,
        image: post.image,
        tags: post.tags ? post.tags.split(',') : [],
        poll: post.poll ? {
            id: post.poll.id,
            question: post.poll.question,
            options: post.poll.options.map(o => ({
                id: o.id,
                text: o.text,
                votes: o.votes
            }))
        } : undefined,
        author: {
            id: post.userId,
            name: post.author.name || "Anonymous",
            handle: post.author.username ? `@${post.author.username}` : "@user",
            avatar: post.author.image,
            headline: post.author.headline,
            isFollowing: followingIds.has(post.userId),
            connectionStatus: (connectionMap.get(post.userId) || 'NONE') as 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED',
            role: post.author.role,
            nodeType: post.author.nodeType,
            isHiring: false
        }
    }));

    const usersWithFollowStatus = users.map(u => ({
        ...u,
        isFollowing: followingIds.has(u.id)
    }));

    return (
        <Suspense fallback={<CoreLoader />}>
            <div className="min-h-screen bg-black pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 mb-6">
                    <h1 className="text-2xl font-heading font-bold text-white mb-2">
                        Search Results
                    </h1>
                    <p className="text-zinc-400">
                        Showing results for <span className="text-violet-400 font-bold">"{query}"</span>
                    </p>
                </div>

                <SearchClient
                    user={{ ...user, plan: user.plan || "BASIC" }}
                    query={query}
                    posts={postsWithFollowStatus}
                    people={usersWithFollowStatus}
                />
            </div>
        </Suspense>
    );
}
