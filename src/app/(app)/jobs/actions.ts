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
        await prisma.job.create({
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

        revalidatePath('/jobs');
        revalidatePath('/feed');
        return { success: true, message: "Job posted successfully" };

    } catch (error) {
        console.error("Failed to post job:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to post job (Unknown error)" };
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
