"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Fetch a company's public profile by slug, with its open jobs and the recruiters
 * who belong to it. Returns null when no company matches (page renders notFound).
 */
export async function getCompanyBySlug(slug: string) {
    if (!slug) return null;
    try {
        const company = await prisma.company.findUnique({
            where: { slug },
            include: {
                jobs: {
                    where: { status: "OPEN" },
                    orderBy: { createdAt: "desc" },
                    take: 50,
                },
                recruiters: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        headline: true,
                    },
                },
            },
        });
        return company;
    } catch (e) {
        console.error("getCompanyBySlug failed:", e);
        return null;
    }
}

export interface CompanyProfileInput {
    tagline?: string;
    description?: string;
    website?: string;
    industry?: string;
    location?: string;
    foundedYear?: string;
    companySize?: string;
    techStack?: string;
    logo?: string;
    banner?: string;
}

/**
 * Update a company's public profile. Only a recruiter who belongs to that company
 * (or an admin) may edit it. Returns { success } so the client can toast + refresh.
 */
export async function updateCompanyProfile(companyId: string, input: CompanyProfileInput) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, companyId: true },
    });
    const owns = me?.companyId === companyId;
    const isAdmin = me?.role === "ADMIN";
    if (!owns && !isAdmin) return { success: false, message: "You can only edit your own company." };

    // Whitelist + trim the editable fields — never trust the raw payload shape.
    const clean = (v?: string) => (typeof v === "string" ? v.trim() || null : undefined);

    try {
        const updated = await prisma.company.update({
            where: { id: companyId },
            data: {
                tagline: clean(input.tagline),
                description: clean(input.description),
                website: clean(input.website),
                industry: clean(input.industry),
                location: clean(input.location),
                foundedYear: clean(input.foundedYear),
                companySize: clean(input.companySize),
                techStack: clean(input.techStack),
                logo: clean(input.logo),
                banner: clean(input.banner),
            },
            select: { slug: true },
        });
        if (updated.slug) revalidatePath(`/company/${updated.slug}`);
        return { success: true, message: "Company profile updated." };
    } catch (e) {
        console.error("updateCompanyProfile failed:", e);
        return { success: false, message: "Failed to update company profile." };
    }
}
