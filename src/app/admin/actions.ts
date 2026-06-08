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

        // Fetch the request first to check type and user
        const request = await prisma.verificationRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return { success: false, message: "Request not found." };
        }

        if (status === 'REJECTED') {
            if (request.type === 'ROLE_CHANGE') {
                // For role changes, do not delete the candidate's account. Simply mark request as rejected.
                await prisma.verificationRequest.update({
                    where: { id: requestId },
                    data: {
                        status: 'REJECTED',
                        feedback: feedback || 'Rejected by Admin',
                        reviewedBy: session.user?.id,
                        reviewedAt: new Date()
                    }
                });

                revalidatePath('/admin/verifications');
                return { success: true, message: "Recruiter onboarding request rejected." };
            } else {
                // DESTRUCTIVE: Delete the user account to force logout and restart for other verification types (IDENTITY)
                await prisma.user.delete({
                    where: { id: request.userId }
                });

                revalidatePath('/admin/verifications');
                return { success: true, message: "Verification denied. User account deleted." };
            }
        }

        // APPROVED path
        if (request.type === 'ROLE_CHANGE') {
            // Check if corporate email is already taken by another account to prevent unique constraint failures
            const emailInUse = await prisma.user.findFirst({
                where: { email: { equals: request.documentUrl, mode: 'insensitive' } }
            });

            if (emailInUse && emailInUse.id !== request.userId) {
                return { success: false, message: `Approval failed: Corporate email '${request.documentUrl}' is already registered to another user.` };
            }

            // Perform transaction to approve request and promote User
            await prisma.$transaction([
                prisma.verificationRequest.update({
                    where: { id: requestId },
                    data: {
                        status: 'APPROVED',
                        feedback,
                        reviewedBy: session.user?.id,
                        reviewedAt: new Date()
                    }
                }),
                prisma.user.update({
                    where: { id: request.userId },
                    data: {
                        role: 'RECRUITER',
                        email: request.documentUrl
                    }
                })
            ]);

            revalidatePath('/admin/verifications');
            return { success: true, message: "Recruiter onboarding approved! User promoted and email updated." };
        }

        // Standard approval for other types
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


// Extract a Cloudinary public_id from a secure URL (mirror of lib/storage logic).
function cloudinaryPublicIdFromUrl(url: string): string | null {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let path = parts[1];
    if (path.startsWith("v")) {
        const slash = path.indexOf("/");
        if (slash !== -1) path = path.substring(slash + 1);
    }
    const dot = path.lastIndexOf(".");
    return dot !== -1 ? path.substring(0, dot) : path;
}

function uploadthingKeyFromUrl(url: string): string | null {
    return url.split("?")[0].split("/").filter(Boolean).pop() || null;
}

/**
 * Scans UploadThing + Cloudinary storage and classifies every file as LIVE
 * (referenced somewhere in the database) or ORPHAN (no DB reference — i.e. an old
 * copy left behind by a re-upload). The live file is NEVER marked, so deleting the
 * returned orphans can't break a user's profile/post/resume. This is the
 * "find duplicates but protect the one that's actually in use" scanner.
 */
export async function scanStorageForOrphans() {
    try {
        await ensureAdmin();

        // 1. Collect every file URL the app currently references.
        const [users, messages, projects, posts, verifications, companies, applications] = await Promise.all([
            prisma.user.findMany({ select: { image: true, bannerUrl: true, resumeUrl: true } }),
            prisma.message.findMany({ where: { attachmentUrl: { not: null } }, select: { attachmentUrl: true } }),
            prisma.project.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
            prisma.post.findMany({ where: { image: { not: null } }, select: { image: true } }),
            prisma.verificationRequest.findMany({ select: { documentUrl: true } }),
            prisma.company.findMany({ where: { logo: { not: null } }, select: { logo: true } }),
            prisma.application.findMany({ where: { resumeUrl: { not: null } }, select: { resumeUrl: true } }),
        ]);

        const referencedUrls = new Set<string>();
        const add = (u?: string | null) => { if (u && u.trim()) referencedUrls.add(u.trim()); };
        users.forEach(u => { add(u.image); add(u.bannerUrl); add(u.resumeUrl); });
        messages.forEach(m => add(m.attachmentUrl));
        projects.forEach(p => add(p.imageUrl));
        posts.forEach(p => add(p.image));
        verifications.forEach(v => add(v.documentUrl));
        companies.forEach(c => add(c.logo));
        applications.forEach(a => add(a.resumeUrl));

        // 2. Reduce referenced URLs to provider-native identifiers (UT key / Cloudinary id).
        const referencedUtKeys = new Set<string>();
        const referencedCloudIds = new Set<string>();
        for (const url of referencedUrls) {
            if (url.includes("cloudinary.com")) {
                const id = cloudinaryPublicIdFromUrl(url);
                if (id) referencedCloudIds.add(id);
            } else if (url.includes("utfs.io") || url.includes("ufs.sh") || url.includes("uploadthing")) {
                const key = uploadthingKeyFromUrl(url);
                if (key) referencedUtKeys.add(key);
            }
        }

        // 3. List storage and classify each file.
        const [utList, clRes] = await Promise.all([
            utapi.listFiles({ limit: 500 }).catch(() => ({ files: [] as any[] })),
            cloudinary.api.resources({ resource_type: "image", type: "upload", max_results: 500 }).catch(() => ({ resources: [] as any[] })),
        ]);

        const utFiles = ((utList as any).files || []).map((f: any) => ({
            provider: "uploadthing" as const,
            key: f.key,
            name: f.name,
            size: f.size,
            live: referencedUtKeys.has(f.key),
        }));

        const clFiles = ((clRes as any).resources || []).map((f: any) => ({
            provider: "cloudinary" as const,
            key: f.public_id,
            name: (f.public_id.split("/").pop() || f.public_id) + "." + f.format,
            size: f.bytes,
            live: referencedCloudIds.has(f.public_id),
        }));

        const all = [...utFiles, ...clFiles];
        const orphans = all.filter(f => !f.live);
        const orphanBytes = orphans.reduce((sum, f) => sum + (f.size || 0), 0);

        return {
            success: true,
            total: all.length,
            liveCount: all.length - orphans.length,
            orphanCount: orphans.length,
            orphanBytes,
            // keys the admin can safely delete (live files excluded by construction)
            orphanKeys: orphans.map(f => ({ key: f.key, provider: f.provider })),
            files: all,
        };
    } catch (error: any) {
        console.error("scanStorageForOrphans failed:", error);
        return { success: false, total: 0, liveCount: 0, orphanCount: 0, orphanBytes: 0, orphanKeys: [], files: [] as any[] };
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

export async function startReviewingReport(reportId: string) {
    try {
        const session = await ensureAdmin();

        const report = await prisma.report.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return { success: false, message: "Report not found" };
        }

        if (report.status === 'PENDING') {
            await prisma.report.update({
                where: { id: reportId },
                data: {
                    status: 'UNDER_REVIEW',
                    resolvedBy: session.user?.id
                }
            });

            // Create notification for the reporter
            await prisma.notification.create({
                data: {
                    userId: report.reporterId,
                    type: 'SYSTEM',
                    message: `🔍 Inquiry #${reportId.substring(0, 8)}: A team member is actively reviewing your request. We'll update you soon!`,
                    read: false
                }
            });

            revalidatePath('/admin/reports');
            return { success: true, message: "Report status updated to Under Review" };
        }

        return { success: true, message: "Report already under review or processed" };
    } catch (error) {
        console.error("Failed to start reviewing report:", error);
        return { success: false, message: "Failed to update review status" };
    }
}
