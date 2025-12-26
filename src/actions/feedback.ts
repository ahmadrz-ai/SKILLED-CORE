'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitFeedback(data: {
    type: string;
    description: string;
    severity?: string;
    category?: string;
    title: string;
    files: string[];
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const report = await prisma.report.create({
            data: {
                reporterId: session.user.id,
                targetType: data.type === 'BUG' ? 'SYSTEM_BUG' : 'SUGGESTION',
                reason: data.title, // Using reason field for title/summary
                adminNotes: JSON.stringify({
                    description: data.description,
                    files: data.files
                }),
                severity: data.severity || 'LOW',
                category: data.category || 'OTHER',
                status: 'PENDING'
            }
        });

        // Notify Admins (Optional: could create notifications for admin users here)

        return { success: true, reportId: report.id };
    } catch (error) {
        console.error("Feedback error:", error);
        return { success: false, message: "Failed to submit feedback" };
    }
}

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, notifications: [] };

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return { success: true, notifications };
    } catch (error) {
        return { success: false, notifications: [] };
    }
}

export async function markNotificationRead(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.notification.update({
            where: { id, userId: session.user.id },
            data: { read: true }
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllNotificationsRead() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.notification.updateMany({
            where: { userId: session.user.id, read: false },
            data: { read: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
