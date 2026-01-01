import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import FeedClient from "./FeedClient";
import { getUserStats, getTrendingTopics } from "./actions";
import { Suspense } from "react";
import CoreLoader from "@/components/ui/CoreLoader";

export default async function FeedPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // Safe User Fetch
    let user = null;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });
    } catch (dbError) {
        console.error("FeedPage: DB Error fetching user", dbError);
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-xl font-bold text-red-500">Account Error</h1>
                <p className="text-zinc-500 mb-4">We could not retrieve your user profile from the database.</p>
                <div className="text-xs font-mono text-zinc-700 bg-zinc-900 p-2 rounded mb-4">
                    ID: {session.user.id}
                </div>
                <a href="/api/auth/signout" className="px-4 py-2 bg-red-600 rounded text-white font-bold text-sm">
                    Force Sign Out
                </a>
            </div>
        );
    }

    try {
        const latestJobs = await prisma.job.findMany({
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                location: true,
                salaryMin: true,
                salaryMax: true,
                company: {
                    select: { name: true }
                }
            }
        });

        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                        username: true,
                        headline: true,
                        nodeType: true,
                        role: true,
                        plan: true
                    }
                },
                likes: true,
                _count: {
                    select: { comments: true }
                },
                poll: {
                    include: {
                        options: true
                    }
                }
            }
        });

        // Fetch follows for the current user to map 'isFollowing' status
        const follows = await prisma.follow.findMany({
            where: { followerId: user.id },
            select: { followingId: true }
        });
        const followingIds = new Set(follows.map(f => f.followingId));

        // Fetch connections
        console.log('Prisma Keys:', Object.keys(prisma));
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
            connectionMap.set(otherId, status as any); // Type assertion for safety
        });

        const postsWithFollowStatus = posts.map(post => ({
            ...post,
            author: {
                ...post.author,
                isFollowing: followingIds.has(post.userId),
                connectionStatus: connectionMap.get(post.userId) || 'NONE'
            }
        }));

        // Fetch a promoted user (Pro/Ultra) to display as an Ad
        const promotedUser = await prisma.user.findFirst({
            where: {
                OR: [{ plan: "PRO" }, { plan: "ULTRA" }],
                NOT: { id: user.id }
            },
            select: {
                id: true,
                name: true,
                headline: true,
                image: true
            }
        });

        const stats = await getUserStats(user.id);
        const trendingTopics = await getTrendingTopics();

        return (
            <Suspense fallback={<CoreLoader />}>
                <FeedClient
                    user={{ ...user, plan: user.plan || "BASIC" }}
                    latestJobs={latestJobs}
                    initialPosts={postsWithFollowStatus}
                    stats={stats}
                    trendingTopics={trendingTopics}
                    promotedUser={promotedUser}
                />
            </Suspense>
        );
    } catch (e: any) {
        if (e?.digest?.startsWith('NEXT_REDIRECT')) {
            throw e;
        }
        const msg = e?.message || "";
        if (msg.includes("Can't reach database server")) {
            console.warn("FeedPage WARN: Database unreachable. Showing System Offline UI.");
        } else {
            console.error("FeedPage Error:", e);
        }
        // Fallback UI for Database Connection Failure
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-xl font-bold text-red-500">System Offline</h1>
                    <p className="text-zinc-500">Unable to establish uplink with the main recruitment database. The system may be undergoing maintenance or the connection bandwidth is restricted.</p>
                    <a
                        href="/feed"
                        className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700 transition inline-block text-sm font-bold"
                    >
                        Retry Connection
                    </a>
                </div>
            </div>
        );
    }
}
