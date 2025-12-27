'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function searchPosts(query: string) {
    const session = await auth();
    // Allow search even if not logged in? Ideally yes, but FeedClient expects user.
    // For consistency with Feed, we might want to ensure auth, but public search is okay too if we handle user mapping.
    // However, FeedClient REQUIREs a user object. So we will rely on Page to handle auth redirect if needed.

    if (!query) return [];

    try {
        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { content: { contains: query, mode: 'insensitive' } },
                    { tags: { contains: query.replace('#', ''), mode: 'insensitive' } } // Approximate tag search
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true,
                        headline: true,
                        nodeType: true,
                        role: true
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

        return posts;
    } catch (error) {
        console.error("Search Posts Error:", error);
        return [];
    }
}

export async function searchUsers(query: string) {
    if (!query) return [];

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 20,
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                headline: true,
                role: true,
                plan: true
            }
        });

        // Add 'isFollowing' and 'connectionStatus' manually if needed, 
        // but for now let's return the basic data and let the Client handle actions via existing hooks/actions?
        // Actually, the UI wants "Connect/Follow".
        // We can fetch that info in the Page component similar to posts, or just map it here if we pass currentUserId.
        // For simplicity, we will return the user data and let the client assume 'false' or fetch status on component mount if strictly needed,
        // OR we can do what we did in FeedPage and map it in the Page.

        return users;
    } catch (error) {
        console.error("Search Users Error:", error);
        return [];
    }
}
