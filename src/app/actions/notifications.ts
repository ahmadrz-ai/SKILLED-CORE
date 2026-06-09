"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return { success: false, error: "User not found" };

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50
        });

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, read: false }
        });

        return { success: true, notifications, unreadCount };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Failed to fetch notifications" };
    }
}

// Lightweight unread counts for the sidebar/topbar badges. Polled client-side so
// badges update live as events occur, without a full page navigation.
export type BadgeCounts = {
    network: number;
    notifications: number;
    messages: number;
    bookings: number;
    support: number;
};

const EMPTY_BADGES: BadgeCounts = { network: 0, notifications: 0, messages: 0, bookings: 0, support: 0 };

export async function getBadgeCounts(): Promise<BadgeCounts> {
    const session = await auth();
    if (!session?.user?.id) return EMPTY_BADGES;

    try {
        const uid = session.user.id;
        const [network, notifications, messages, bookings, support] = await Promise.all([
            prisma.connection.count({ where: { addresseeId: uid, status: "PENDING" } }),
            prisma.notification.count({ where: { userId: uid, read: false } }),
            prisma.conversationParticipant.count({ where: { userId: uid, hasUnread: true } }),
            // Incoming interview requests awaiting the candidate's response.
            prisma.booking.count({ where: { candidateId: uid, status: "REQUESTED" } }),
            // Unread support-thread replies from the team.
            prisma.notification.count({ where: { userId: uid, read: false, type: "REPORT_REPLY" } }),
        ]);
        return { network, notifications, messages, bookings, support };
    } catch (error) {
        console.error("getBadgeCounts failed:", error);
        return EMPTY_BADGES;
    }
}

export async function markAsRead(notificationId: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false };

    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllAsRead() {
    const session = await auth();
    if (!session?.user?.email) return { success: false };

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return { success: false };

        await prisma.notification.updateMany({
            where: { userId: user.id, read: false },
            data: { read: true }
        });

        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// Internal utility to create notifications
export async function createNotification(data: {
    userId: string, // Recipient
    type: string,
    message: string,
    actorId?: string,
    entityId?: string,
    resourcePath?: string
}) {
    try {
        await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                message: data.message,
                actorId: data.actorId,
                entityId: data.entityId,
                resourcePath: data.resourcePath
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to create notification:", error);
        return { success: false };
    }
}
