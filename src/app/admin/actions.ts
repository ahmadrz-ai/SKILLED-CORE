'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();


// Helper to ensure admin access
async function ensureAdmin() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized: Admin Access Required");
    }
    return session;
}

export async function toggleUserRole(userId: string, currentRole: string) {
    try {
        await ensureAdmin();

        const newRole = currentRole === 'CANDIDATE' ? 'RECRUITER' : 'CANDIDATE';

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });

        revalidatePath('/admin/users');
        return { success: true, message: `Role updated to ${newRole}` };
    } catch (error) {
        console.error("Failed to toggle role:", error);
        return { success: false, message: "Failed to update role" };
    }
}

export async function deleteUser(userId: string) {
    try {
        await ensureAdmin();

        await prisma.user.delete({
            where: { id: userId }
        });

        revalidatePath('/admin/users');
        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, message: "Failed to delete user" };
    }
}

export async function updateVerificationStatus(requestId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) {
    try {
        const session = await ensureAdmin();

        if (status === 'REJECTED') {
            // Fetch the request to get the userId
            const request = await prisma.verificationRequest.findUnique({
                where: { id: requestId }
            });

            if (request) {
                // DESTRUCTIVE: Delete the user account to force logout and restart
                await prisma.user.delete({
                    where: { id: request.userId }
                });

                revalidatePath('/admin/verifications');
                return { success: true, message: "Verification denied. User account deleted." };
            } else {
                return { success: false, message: "Request not found." };
            }
        }

        await prisma.verificationRequest.update({
            where: { id: requestId },
            data: {
                status,
                feedback,
                reviewedBy: session.user?.id,
                reviewedAt: new Date()
            }
        });

        revalidatePath('/admin/verifications');
        return { success: true, message: `Request ${status}` };
    } catch (error) {
        console.error("Failed to update verification:", error);
        return { success: false, message: "Failed to update verification status" };
    }
}

export async function updateReportStatus(reportId: string, status: 'RESOLVED' | 'DISMISSED', notes?: string) {
    try {
        const session = await ensureAdmin();

        // Fetch the report with reporter info
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { reporter: true }
        });

        if (!report) {
            return { success: false, message: "Report not found" };
        }

        // Update report status
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status,
                adminNotes: notes,
                resolvedBy: session.user?.id
            }
        });

        // Create notification for the reporter
        const notificationMessages = {
            RESOLVED: "✅ Your Report Successfully Reviewed!\n\nYour report has been successfully reviewed and implemented by the author. You can enjoy the features now. Thank you for helping us improve! 🎉",
            DISMISSED: "📋 Report Update\n\nYour suggestion/report has been revoked due to insufficient evidence or incorrect information. If you believe this was an error, please submit additional details. Thank you for your understanding."
        };

        await prisma.notification.create({
            data: {
                userId: report.reporterId,
                type: 'SYSTEM',
                message: notificationMessages[status],
                read: false
            }
        });

        revalidatePath('/admin/reports');
        return { success: true, message: `Report marked as ${status}` };
    } catch (error) {
        console.error("Failed to update report:", error);
        return { success: false, message: "Failed to update report status" };
    }
}
export async function getAdminStats() {
    try {
        await ensureAdmin();
        const [users, jobs, applications, posts] = await Promise.all([
            prisma.user.count(),
            prisma.job.count(),
            prisma.application.count(),
            prisma.post.count()
        ]);

        return {
            success: true,
            stats: { users, jobs, applications, posts }
        };
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return { success: false, stats: { users: 0, jobs: 0, applications: 0, posts: 0 } };
    }
}

export async function getStorageFiles() {
    try {
        await ensureAdmin();
        const files = await utapi.listFiles({ limit: 50 });
        return { success: true, files: files.files };
    } catch (error) {
        console.error("Failed to fetch storage files:", error);
        return { success: false, files: [] };
    }
}

export async function deleteFiles(fileKeys: string[]) {
    try {
        await ensureAdmin();
        if (!fileKeys || fileKeys.length === 0) return { success: false, message: "No files selected" };

        const res = await utapi.deleteFiles(fileKeys);

        // revalidatePath('/admin'); // Not strictly needed if client updates state, but good practice
        return { success: res.success, message: `Deleted ${fileKeys.length} files` };
    } catch (error) {
        console.error("Failed to delete files:", error);
        return { success: false, message: "Failed to delete files" };
    }
}


export async function getPendingReportsCount() {
    try {
        await ensureAdmin();
        const count = await prisma.report.count({
            where: { status: 'PENDING' }
        });
        return { success: true, count };
    } catch (error) {
        return { success: false, count: 0 };
    }
}

export async function getDashboardData() {
    try {
        await ensureAdmin();

        const [verifications, reports, stats, files] = await Promise.all([
            prisma.verificationRequest.findMany({
                where: { status: 'PENDING' },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { email: true, name: true, company: true } } }
            }),
            prisma.report.findMany({
                where: { status: 'PENDING' },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { reporter: { select: { name: true } } }
            }),
            getAdminStats(),
            getStorageFiles()
        ]);

        return {
            success: true,
            data: {
                verifications: verifications.map(v => ({
                    id: v.id,
                    company: v.user.company?.name || v.user.name || "Unknown",
                    email: v.user.email,
                    doc: v.documentUrl,
                    type: v.type
                })),
                reports: reports.map(r => ({
                    id: r.id,
                    type: r.category,
                    reason: r.reason,
                    reporter: r.reporter.name,
                    content: r.targetType === 'USER' ? `User Report: ${r.targetId}` : `Content Report: ${r.targetId}`,
                    severity: r.severity
                })),
                stats: stats.stats,
                files: files.files
            }
        };

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return { success: false, data: null };
    }
}
