"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getJobs(searchParams: any) {
    const { query, type, remote, minSalary, experience } = searchParams;

    const where: any = { status: "OPEN" };

    if (query) {
        where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { company: { name: { contains: query, mode: "insensitive" } } },
        ];
    }

    if (type && type !== "All") where.type = type;
    if (remote === "true") where.workplaceType = "Remote";
    if (minSalary) where.salaryMin = { gte: parseInt(minSalary) };
    if (experience && experience !== "All") where.experienceLevel = experience;

    const jobs = await prisma.job.findMany({
        where,
        include: {
            company: true,
            _count: { select: { applications: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return jobs;
}

export async function toggleSaveJob(jobId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const existing = await prisma.savedJob.findUnique({
        where: {
            userId_jobId: { userId: session.user.id, jobId }
        }
    });

    if (existing) {
        await prisma.savedJob.delete({
            where: { id: existing.id }
        });
        revalidatePath("/jobs");
        return { saved: false };
    } else {
        await prisma.savedJob.create({
            data: { userId: session.user.id, jobId }
        });
        revalidatePath("/jobs");
        return { saved: true };
    }
}

export async function getSavedJobIds() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const saved = await prisma.savedJob.findMany({
        where: { userId: session.user.id },
        select: { jobId: true }
    });

    return saved.map(s => s.jobId);
}

// ... (previous code)

// New Action: AI Rewrite
export async function rewriteJobDescription(currentDescription: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    // Deduct 1 Credit
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true, plan: true }
    });

    if (!user || user.credits < 1) {
        return { success: false, message: "Insufficient credits. Please top up." };
    }

    if (user.plan === "BASIC") {
        return { success: false, message: "Upgrade to PRO to access Neural Rewrite." }; // Enforcing Plan as requested
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: 1 } }
    });
    revalidatePath("/credits");
    revalidatePath("/", "layout"); // Update sidebar/header credits

    // Real AI Logic
    const apiKey = process.env.QODEE_API_KEY;
    if (!apiKey) {
        console.error("Missing QODEE_API_KEY");
        return { success: false, message: "AI Service Unavailable (Config Error)" };
    }

    try {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');

        const google = createGoogleGenerativeAI({ apiKey });

        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            system: `You are an expert technical recruiter and copywriter. 
Your task is to rewrite and improve the following job description.
Make it professional, engaging, and structured with clear sections (Role, Responsibilities, Requirements).
Use Markdown formatting. Keep the tone exciting but professional.`,
            prompt: currentDescription,
        });

        return { success: true, description: text, message: "Content enhanced (1 Credit used)." };
    } catch (error: any) {
        console.error("AI Rewrite Error:", error);
        // Refund credit if failed
        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { increment: 1 } }
        });
        return { success: false, message: "AI enhancement failed. Credit refunded." };
    }
}

export async function createJob(data: {
    // ... (same types)
    title: string;
    companyName: string;
    companyLogo?: string;
    location: string;
    type: string;
    workplaceType: string;
    experienceLevel: string;
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    skills: string;
    applyMethod: string;
    externalUrl?: string;
    questions?: any[];
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        // Deduct 1 Credit for Job Post
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } });
        if (!user || user.credits < 1) {
            return { success: false, message: "Insufficient credits to post a job." };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: 1 } }
        });
        revalidatePath("/credits");
        revalidatePath("/", "layout");

        // Find or Create Company
        let company = await prisma.company.findFirst({
            where: { name: { equals: data.companyName, mode: "insensitive" } }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: data.companyName,
                    logo: data.companyLogo,
                    description: "Created via Job Post",
                    recruiters: { connect: { id: session.user.id } }
                }
            });
        } else if (data.companyLogo && !company.logo) {
            // Update logo if existing company has none but new post provides one
            company = await prisma.company.update({
                where: { id: company.id },
                data: { logo: data.companyLogo }
            });
        }

        await prisma.job.create({
            data: {
                title: data.title,
                location: data.location,
                type: data.type,
                workplaceType: data.workplaceType,
                experienceLevel: data.experienceLevel,
                salaryMin: data.salaryMin,
                salaryMax: data.salaryMax,
                description: data.description,
                skills: data.skills,
                applyMethod: data.applyMethod,
                externalUrl: data.externalUrl,
                questions: data.questions,
                userId: session.user.id,
                companyId: company.id,
                status: "OPEN"
            }
        });

        revalidatePath("/jobs");
        revalidatePath("/hire/dashboard");
        return { success: true, message: "Job posted successfully (1 Credit used)!" };

    } catch (error) {
        return { success: false, message: "Failed to create job." };
    }
}

export async function applyToJob(jobId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized. Please Login." };

    try {
        const existing = await prisma.application.findUnique({
            where: {
                jobId_userId: {
                    jobId,
                    userId: session.user.id
                }
            }
        });

        if (existing) {
            return { success: false, message: "You have already applied to this position." };
        }

        await prisma.application.create({
            data: {
                jobId,
                userId: session.user.id,
                status: "PENDING"
            }
        });

        revalidatePath(`/jobs/${jobId}`);
        revalidatePath("/hire/dashboard");
        return { success: true, message: "Application submitted successfully!" };
    } catch (error) {
        console.error("Apply Error:", error);
        return { success: false, message: "Failed to submit application." };
    }
}
