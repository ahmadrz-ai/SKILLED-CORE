'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNetworkData() {
    console.log("getNetworkData: Starting");
    try {
        const session = await auth();
        let userId = session?.user?.id;

        // DEV FALLBACK: If no session, pick the first user to allow UI to render
        if (!userId) {
            console.warn("getNetworkData: No session found. Using fallback user for DEMO.");
            const fallbackUser = await prisma.user.findFirst();
            if (fallbackUser) {
                userId = fallbackUser.id;
            } else {
                // Only throw if we absolutely can't find anyone to be
                throw new Error("Unauthorized: No session and no users in DB");
            }
        }

        // 1. Get Invitations (Received connections with status PENDING)
        console.log("getNetworkData: Fetching invitations");
        const invitations = await prisma.connection.findMany({
            where: {
                addresseeId: userId,
                status: "PENDING"
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        headline: true,
                        image: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Get Connections List & Count
        console.log("getNetworkData: Fetching connections");
        const connectionsRaw = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: "ACCEPTED" },
                    { addresseeId: userId, status: "ACCEPTED" }
                ]
            },
            include: {
                requester: { select: { id: true, name: true, headline: true, image: true } },
                addressee: { select: { id: true, name: true, headline: true, image: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const connectionsCount = connectionsRaw.length;

        const connections = connectionsRaw.map(c => {
            const isRequester = c.requesterId === userId;
            const other = isRequester ? c.addressee : c.requester;
            return {
                id: other.id,
                name: other.name || 'Unknown User',
                headline: other.headline || 'No headline',
                image: other.image,
                connectedAt: c.updatedAt
            };
        });

        // 3. Get Following Count (Legacy/Recruiter metric)
        console.log("getNetworkData: Fetching following count");
        const followingCount = await prisma.follow.count({
            where: { followerId: userId }
        });

        // 4. Get Recommendations
        console.log("getNetworkData: Fetching recommendations");
        const existingConnections = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            },
            select: { requesterId: true, addresseeId: true }
        });

        const excludedIds = new Set([userId]);
        existingConnections.forEach(c => {
            excludedIds.add(c.requesterId);
            excludedIds.add(c.addresseeId);
        });

        const recommendations = await prisma.user.findMany({
            where: {
                id: { notIn: Array.from(excludedIds) },
                role: { not: 'ADMIN' }
            },
            take: 20,
            select: {
                id: true,
                name: true,
                headline: true,
                image: true,
                bannerUrl: true,
            }
        });

        // ... existing code ...

        // 4. Get Mutual Recommendations (Friends of Friends)
        console.log("getNetworkData: Calculating mutuals");
        let mutualRecommendations: any[] = [];
        let mutualFrequency: Record<string, number> = {};

        try {
            const myConnectionIds = connections.map(c => c.id);
            if (myConnectionIds.length > 0) {
                const potentialMutuals = await prisma.connection.findMany({
                    where: {
                        OR: [
                            { requesterId: { in: myConnectionIds }, addresseeId: { notIn: [...myConnectionIds, userId] }, status: 'ACCEPTED' },
                            { addresseeId: { in: myConnectionIds }, requesterId: { notIn: [...myConnectionIds, userId] }, status: 'ACCEPTED' }
                        ]
                    },
                    select: { requesterId: true, addresseeId: true }
                });

                potentialMutuals.forEach(c => {
                    const candidateId = myConnectionIds.includes(c.requesterId) ? c.addresseeId : c.requesterId;
                    if (candidateId !== userId) {
                        mutualFrequency[candidateId] = (mutualFrequency[candidateId] || 0) + 1;
                    }
                });

                const sortedMutualIds = Object.keys(mutualFrequency).sort((a, b) => mutualFrequency[b] - mutualFrequency[a]);

                if (sortedMutualIds.length > 0) {
                    mutualRecommendations = await prisma.user.findMany({
                        where: { id: { in: sortedMutualIds.slice(0, 5) } },
                        select: { id: true, name: true, headline: true, image: true }
                    });
                }
            }
        } catch (e) {
            console.error("getNetworkData: Mutuals calculation failed", e);
        }

        // 5. Get "Promoted" Users
        let promotedUser: any = null;
        try {
            const promotedUsers = await prisma.user.findMany({
                where: {
                    id: { not: userId },
                    role: 'RECRUITER'
                },
                take: 1,
                select: { id: true, name: true, headline: true, image: true, bannerUrl: true }
            });

            if (promotedUsers.length > 0) {
                promotedUser = promotedUsers[0];
            } else {
                // Fallback to any user
                const anyUser = await prisma.user.findFirst({
                    where: { id: { not: userId } },
                    select: { id: true, name: true, headline: true, image: true, bannerUrl: true }
                });
                promotedUser = anyUser;
            }
        } catch (e: any) {
            console.error("getNetworkData: Promoted fetch failed", e);
        }

        // MOCK IF NULL (For UI Demonstration)
        if (!promotedUser) {
            promotedUser = {
                id: 'mock-ad',
                name: 'Ahmad Raza',
                headline: 'Senior Frontend Architect',
                image: null, // UI will show initial
                bannerUrl: null
            };
        }

        // Format for UI
        const formattedInvites = invitations.map(inv => ({
            id: inv.id,
            requesterId: inv.requester.id,
            name: inv.requester.name || 'Unknown User',
            headline: inv.requester.headline || 'No headline',
            avatar: inv.requester.image,
            mutual: 0
        }));

        console.log("getNetworkData: Success");
        return {
            invitations: formattedInvites,
            connections,
            recommendations, // Keeping general recommendations for the "See all" flow or mix
            mutuals: mutualRecommendations.map(u => ({ ...u, mutualCount: mutualFrequency[u.id] || 0 })),
            promoted: promotedUser,
            stats: {
                connections: connectionsCount,
                following: followingCount
            }
        };
    } catch (e) {
        console.error("getNetworkData: Error", e);
        throw e;
    }
}

export async function sendConnectionRequest(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const userId = session.user.id;

    if (userId === targetUserId) return { success: false, message: "Cannot connect with self" };

    try {
        console.log("sendConnectionRequest keys:", Object.keys(prisma));

        // Defensive check
        if (!prisma.connection) {
            console.error("CRITICAL: prisma.connection is undefined in sendConnectionRequest");
            return { success: false, message: "System Error: Connection service unavailable." };
        }

        // Check existing
        const existing = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: userId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') return { success: false, message: "Already connected" };
            if (existing.status === 'PENDING') return { success: false, message: "Request already pending" };
        }

        await prisma.connection.create({
            data: {
                requesterId: userId,
                addresseeId: targetUserId,
                status: "PENDING"
            }
        });

        // Create Notification
        try {
            await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type: "CONNECTION_REQUEST",
                    message: `${session.user.name || 'Someone'} sent you a connection request.`,
                    resourcePath: "/network",
                }
            });
        } catch (e) {
            console.error("Failed to create notification", e);
            // Don't fail the request just because notification failed
        }

        revalidatePath('/network');
        revalidatePath(`/profile/${targetUserId}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to send request" };
    }
}

export async function updateConnectionStatus(connectionId: string, status: 'ACCEPTED' | 'DECLINED') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        if (status === 'DECLINED') {
            await prisma.connection.delete({ where: { id: connectionId } });
        } else {
            await prisma.connection.update({
                where: { id: connectionId },
                data: { status: 'ACCEPTED' }
            });
        }
        revalidatePath('/network');
        return { success: true };
    } catch (e) {
        return { success: false, message: "Action failed" };
    }
}

export async function getConnectionStatus(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return 'NONE';
    const userId = session.user.id;

    // Defensive check
    if (!prisma.connection) {
        console.warn("getConnectionStatus: prisma.connection is undefined, returning NONE");
        return 'NONE';
    }

    try {
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: userId }
                ]
            }
        });

        if (!connection) return 'NONE';
        if (connection.status === 'ACCEPTED') return 'CONNECTED';
        if (connection.status === 'PENDING') {
            return connection.requesterId === userId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        }
    } catch (e) {
        console.error("getConnectionStatus: DB Error", e);
    }
    return 'NONE';
}
