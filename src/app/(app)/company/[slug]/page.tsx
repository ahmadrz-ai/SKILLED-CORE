import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "./actions";
import CompanyClient, { type CompanyView } from "./CompanyClient";
import type { JobProps } from "@/components/JobCard";

export const dynamic = "force-dynamic";

/** "3 days ago" style relative time from a Date. */
function relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
}

function splitList(raw?: string | null): string[] {
    if (!raw) return [];
    // skills/techStack are stored as comma-separated or JSON array strings.
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
        /* not JSON — fall through to comma split */
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const company = await getCompanyBySlug(slug);
    if (!company) notFound();

    // Can the current viewer edit this company? (belongs to it, or is an admin)
    const session = await auth();
    let canEdit = false;
    if (session?.user?.id) {
        const me = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, companyId: true },
        });
        canEdit = me?.role === "ADMIN" || me?.companyId === company.id;
    }

    const jobs: JobProps[] = company.jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: company.name,
        type: (j.workplaceType === "On-site" ? "On-Site" : j.workplaceType) as JobProps["type"],
        postedTime: relativeTime(j.createdAt),
        salary: j.salaryMin || j.salaryMax ? "" : "Not disclosed",
        experience: (j.experienceLevel || "Mid") as JobProps["experience"],
        tags: splitList(j.skills),
        logo: company.logo || undefined,
        contract: (j.type || "Full-Time") as JobProps["contract"],
        salaryMin: j.salaryMin ?? undefined,
        salaryMax: j.salaryMax ?? undefined,
        currency: j.currency,
        payPeriod: j.payPeriod,
    }));

    const view: CompanyView = {
        id: company.id,
        name: company.name,
        slug: company.slug || slug,
        tagline: company.tagline,
        description: company.description,
        logo: company.logo,
        banner: company.banner,
        website: company.website,
        industry: company.industry,
        location: company.location,
        foundedYear: company.foundedYear,
        companySize: company.companySize,
        techStack: splitList(company.techStack),
        verified: company.verified,
        jobs,
        people: company.recruiters,
    };

    return <CompanyClient company={view} canEdit={canEdit} />;
}
