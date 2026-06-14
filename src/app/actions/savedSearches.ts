"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MAX_SAVED = 20;

async function recruiter() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
    if (!u || (u.role !== "RECRUITER" && u.role !== "ADMIN")) return null;
    return u;
}

export async function saveSearch(query: string) {
    const u = await recruiter();
    if (!u) return { success: false, message: "Recruiters only." };
    const q = (query || "").trim();
    if (q.length < 2) return { success: false, message: "Search is too short to save." };

    const existingCount = await prisma.savedSearch.count({ where: { recruiterId: u.id } });
    if (existingCount >= MAX_SAVED) return { success: false, message: `You can save up to ${MAX_SAVED} searches.` };

    // De-dupe identical queries (case-insensitive).
    const dup = await prisma.savedSearch.findFirst({
        where: { recruiterId: u.id, query: { equals: q, mode: "insensitive" } },
    });
    if (dup) return { success: true, alreadySaved: true };

    await prisma.savedSearch.create({ data: { recruiterId: u.id, query: q } });
    revalidatePath("/hire");
    return { success: true };
}

export async function getSavedSearches() {
    const u = await recruiter();
    if (!u) return [];
    const rows = await prisma.savedSearch.findMany({
        where: { recruiterId: u.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, query: true, createdAt: true },
    });
    return JSON.parse(JSON.stringify(rows));
}

export async function deleteSavedSearch(id: string) {
    const u = await recruiter();
    if (!u) return { success: false };
    await prisma.savedSearch.deleteMany({ where: { id, recruiterId: u.id } });
    revalidatePath("/hire");
    return { success: true };
}

/**
 * Notify recruiters whose saved searches match a freshly verified skill. Called
 * (best-effort) from finalizeInterview when a badge is issued. Matches if the
 * skill name appears in the saved query (simple, predictable contains-match).
 */
export async function alertSavedSearchesForSkill(skillName: string, candidateName: string, candidateId: string) {
    try {
        const skill = (skillName || "").trim().toLowerCase();
        if (!skill) return;
        // Pull recent saved searches and match in-memory (queries are short, volume low).
        const searches = await prisma.savedSearch.findMany({
            select: { id: true, recruiterId: true, query: true, lastAlertAt: true },
        });
        const DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const matched = searches.filter((s) => {
            const q = s.query.toLowerCase();
            const hit = q.includes(skill) || skill.includes(q);
            const notSpammy = !s.lastAlertAt || now - new Date(s.lastAlertAt).getTime() > DAY;
            return hit && notSpammy;
        });
        // One notification per recruiter (dedupe across their matching searches).
        const byRecruiter = new Map<string, string[]>();
        for (const s of matched) {
            byRecruiter.set(s.recruiterId, [...(byRecruiter.get(s.recruiterId) || []), s.id]);
        }
        for (const [recruiterId, searchIds] of byRecruiter) {
            await prisma.notification.create({
                data: {
                    userId: recruiterId,
                    type: "SAVED_SEARCH_MATCH",
                    message: `A new candidate <strong>${candidateName}</strong> just verified <strong>${skillName}</strong> — matches your saved search.`,
                    actorId: candidateId,
                    resourcePath: "/hire",
                },
            }).catch(() => {});
            await prisma.savedSearch.updateMany({ where: { id: { in: searchIds } }, data: { lastAlertAt: new Date() } }).catch(() => {});
        }
    } catch (e) {
        console.error("alertSavedSearchesForSkill failed:", e);
    }
}
