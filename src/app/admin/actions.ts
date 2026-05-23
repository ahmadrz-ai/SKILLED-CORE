'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export async function toggleUserGhostMode(userId: string, currentGhostMode: boolean) {
    try {
        await ensureAdmin();

        const newGhostMode = !currentGhostMode;

        await prisma.user.update({
            where: { id: userId },
            data: { ghostMode: newGhostMode }
        });

        revalidatePath('/admin/users');
        return { success: true, message: `Ghost Protocol set to ${newGhostMode ? 'Stealth (Invisible)' : 'Live (Visible)'}` };
    } catch (error) {
        console.error("Failed to toggle ghost mode:", error);
        return { success: false, message: "Failed to update Ghost Protocol status" };
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

        let dbSize = 0;
        try {
            const sizeRes = await prisma.$queryRawUnsafe<any[]>("SELECT pg_database_size(current_database()) as size");
            const rawSize = sizeRes?.[0]?.size || sizeRes?.[0]?.pg_database_size;
            dbSize = typeof rawSize === 'bigint' ? Number(rawSize) : (Number(rawSize) || 0);
        } catch (e) {
            console.warn("Failed pg_database_size query, using fallback estimate:", e);
            dbSize = (users * 15 + jobs * 20 + applications * 25 + posts * 10) * 1024; // in bytes (est. 15kb per user, etc.)
        }

        return {
            success: true,
            stats: { users, jobs, applications, posts, dbSize }
        };
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return { success: false, stats: { users: 0, jobs: 0, applications: 0, posts: 0, dbSize: 0 } };
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

export async function getCloudinaryFiles() {
    try {
        await ensureAdmin();
        const res = await cloudinary.api.resources({
            resource_type: 'image',
            type: 'upload',
            max_results: 50
        });
        
        const files = res.resources.map((file: any) => ({
            key: file.public_id,
            name: file.public_id.split('/').pop() + '.' + file.format,
            url: file.secure_url,
            size: file.bytes,
            type: file.resource_type,
            createdAt: new Date(file.created_at).getTime(),
        }));
          return { success: true, files };
    } catch (error) {
        console.error("Failed to fetch Cloudinary files:", error);
        return { success: false, files: [] };
    }
}



export async function deleteFiles(fileKeys: string[], provider?: 'uploadthing' | 'cloudinary') {
    try {
        await ensureAdmin();
        if (!fileKeys || fileKeys.length === 0) return { success: false, message: "No files selected" };

        const utKeys: string[] = [];
        const cloudinaryPublicIds: string[] = [];

        for (const key of fileKeys) {
            if (provider === 'uploadthing') {
                utKeys.push(key);
            } else if (provider === 'cloudinary') {
                cloudinaryPublicIds.push(key);
            } else {
                // Auto-detect fallback
                if (key.includes("/") || key.startsWith("skilledcore")) {
                    cloudinaryPublicIds.push(key);
                } else {
                    utKeys.push(key);
                }
            }
        }

        let utSuccess = true;
        let cloudinarySuccess = true;

        if (utKeys.length > 0) {
            const res = await utapi.deleteFiles(utKeys);
            utSuccess = res.success;
        }

        if (cloudinaryPublicIds.length > 0) {
            const res = await cloudinary.api.delete_resources(cloudinaryPublicIds);
            if (res.partial) {
                cloudinarySuccess = false;
            }
        }

        const totalDeleted = utKeys.length + cloudinaryPublicIds.length;
        return {
            success: utSuccess && cloudinarySuccess,
            message: `Successfully deleted ${totalDeleted} files (${utKeys.length} Documents Repository, ${cloudinaryPublicIds.length} Cloudinary Assets)`
        };
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

        const [verifications, reports, stats, utFiles, clFiles] = await Promise.all([
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
            getStorageFiles(),
            getCloudinaryFiles()
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
                uploadthingFiles: utFiles.files || [],
                cloudinaryFiles: clFiles.files || []
            }
        };

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return { success: false, data: null };
    }
}

