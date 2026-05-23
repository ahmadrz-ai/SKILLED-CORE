import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SinglePostClient } from "./SinglePostClient";

export default async function SinglePostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // Fetch the post from Neon DB
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
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

    if (!post) {
        notFound();
    }

    // Determine connection status and follow status of the author relative to current user
    const isFollowing = await prisma.follow.findFirst({
        where: {
            followerId: session.user.id,
            followingId: post.userId
        }
    });

    const connection = await prisma.connection?.findFirst({
        where: {
            OR: [
                { requesterId: session.user.id, addresseeId: post.userId },
                { requesterId: post.userId, addresseeId: session.user.id }
            ]
        }
    });

    let connectionStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' = 'NONE';
    if (connection) {
        if (connection.status === 'ACCEPTED') {
            connectionStatus = 'CONNECTED';
        } else if (connection.status === 'PENDING') {
            connectionStatus = connection.requesterId === session.user.id ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        }
    }

    const postWithStatus = {
        ...post,
        author: {
            ...post.author,
            isFollowing: !!isFollowing,
            connectionStatus
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-4">
            <SinglePostClient post={postWithStatus} currentUserId={session.user.id} />
        </div>
    );
}
