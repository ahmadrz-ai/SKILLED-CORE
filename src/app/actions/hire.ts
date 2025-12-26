"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getRecruiterJobs() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Ideally restrict to role='RECRUITER', but for now specific to user
    return prisma.job.findMany({
        where: { userId: session.user.id },
        include: {
            _count: { select: { applications: true } },
            applications: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { applicant: { select: { name: true, image: true } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getJobAnalytics() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const jobs = await prisma.job.findMany({
        where: { userId: session.user.id },
        include: { _count: { select: { applications: true } } }
    });

    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((acc, job) => acc + job._count.applications, 0);
    const activeJobs = jobs.filter(j => j.status === "OPEN").length;

    return { totalJobs, totalApplications, activeJobs };
}
