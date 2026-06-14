'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Ensure user is Recruiter or Admin to post jobs
async function ensureRecruiter() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'RECRUITER' && session?.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized: Recruiter Access Required");
    }
    return session;
}

export async function createJob(data: {
    title: string;
    companyName: string;
    location: string;
    type: string;
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    skills: string;
    externalUrl?: string;
}) {
    try {
        const session = await ensureRecruiter();
        const userId = session.user?.id;

        if (!userId) throw new Error("User ID missing");

        // 1. Find or Create Company
        // For MVP, we'll just find by name or create new. 
        // In a real app, recruiters would select from their companies.
        let company = await prisma.company.findFirst({
            where: { name: data.companyName }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: data.companyName,
                    recruiters: { connect: { id: userId } }
                }
            });
        }

        // 2. Create Job
        const job = await prisma.job.create({
            data: {
                title: data.title,
                location: data.location,
                type: data.type,
                salaryMin: data.salaryMin || 0,
                salaryMax: data.salaryMax || 0,
                description: data.description,
                skills: data.skills,
                externalUrl: data.externalUrl,
                companyId: company.id,
                userId: userId
            }
        });

        // 3. JOB_MATCH — notify candidates whose skills overlap this job (capped).
        try {
            const tokens = Array.from(new Set(
                (data.skills || "")
                    .split(/[,|]/)
                    .map((s) => s.trim().toLowerCase())
                    .filter((s) => s.length >= 2)
            )).slice(0, 12);
            if (tokens.length) {
                const matches = await prisma.user.findMany({
                    where: {
                        role: "CANDIDATE",
                        OR: tokens.map((t) => ({ skills: { contains: t, mode: "insensitive" as const } })),
                    },
                    select: { id: true },
                    take: 50,
                });
                if (matches.length) {
                    await prisma.notification.createMany({
                        data: matches.map((m) => ({
                            userId: m.id,
                            type: "JOB_MATCH",
                            message: `💼 A new role matches your skills: <strong>${data.title}</strong> at ${data.companyName}.`,
                            resourcePath: `/jobs/${job.id}`,
                            read: false,
                        })),
                    });
                    const { notifyUser } = await import("@/lib/ably");
                    await Promise.allSettled(matches.map((m) => notifyUser(m.id)));
                }
            }
        } catch (e) { console.error("JOB_MATCH notify failed:", e); }

        revalidatePath('/jobs');
        revalidatePath('/feed');
        return { success: true, message: "Job posted successfully" };

    } catch (error) {
        console.error("Failed to post job:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to post job (Unknown error)" };
    }
}

/** Recruiter opened an application → notify the applicant once (APPLICATION_VIEWED). */
export async function markApplicationViewed(applicationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false };
        const callerId = session.user.id;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { id: true, userId: true, viewedAt: true, job: { select: { userId: true, title: true } } },
        });
        if (!application) return { success: false };
        // Only the job's recruiter (or admin) viewing counts, and only once.
        if (application.job.userId !== callerId) return { success: false };
        if (application.viewedAt) return { success: true, already: true };

        await prisma.application.update({ where: { id: applicationId }, data: { viewedAt: new Date() } });

        if (application.userId !== callerId) {
            await prisma.notification.create({
                data: {
                    userId: application.userId,
                    type: "APPLICATION_VIEWED",
                    message: `👀 A recruiter reviewed your application for <strong>${application.job.title}</strong>.`,
                    resourcePath: "/applications",
                    read: false,
                },
            });
            const { notifyUser } = await import("@/lib/ably");
            await notifyUser(application.userId);
        }
        return { success: true };
    } catch (error) {
        console.error("markApplicationViewed failed:", error);
        return { success: false };
    }
}

export async function applyToJob(jobId: string) {
    try {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");

        const userId = session.user.id;
        if (!userId) throw new Error("User ID missing");

        // Check if already applied
        const existing = await prisma.application.findFirst({
            where: { jobId, userId }
        });

        if (existing) {
            return { success: false, message: "You have already applied to this position." };
        }

        await prisma.application.create({
            data: {
                jobId,
                userId,
                status: 'PENDING'
            }
        });

        // Notify Recruiter
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { userId: true, title: true }
        });

        if (job) {
            await prisma.notification.create({
                data: {
                    userId: job.userId,
                    type: "APPLICATION",
                    message: `${session.user.name || "A candidate"} applied for ${job.title}`,
                    resourcePath: `/jobs/${jobId}`,
                    read: false
                }
            });
        }

        revalidatePath('/jobs');
        return { success: true, message: "Application submitted successfully" };

    } catch (error) {
        console.error("Failed to apply:", error);
        return { success: false, message: "Failed to submit application" };
    }
}
