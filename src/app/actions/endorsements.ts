"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/ably";

/**
 * Toggle an endorsement of someone's skill. Notifies the endorsed user
 * (ENDORSEMENT) on the first endorsement of that skill from this endorser.
 */
export async function endorseSkill(targetUserId: string, skill: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };
    const endorserId = session.user.id;

    const clean = (skill || "").trim().slice(0, 60);
    if (!clean) return { success: false, message: "No skill specified." };
    if (endorserId === targetUserId) return { success: false, message: "You can't endorse yourself." };

    try {
        const existing = await prisma.endorsement.findUnique({
            where: { endorserId_userId_skill: { endorserId, userId: targetUserId, skill: clean } },
        });

        if (existing) {
            await prisma.endorsement.delete({ where: { id: existing.id } });
            const count = await prisma.endorsement.count({ where: { userId: targetUserId, skill: clean } });
            return { success: true, endorsed: false, count };
        }

        await prisma.endorsement.create({ data: { endorserId, userId: targetUserId, skill: clean } });
        const count = await prisma.endorsement.count({ where: { userId: targetUserId, skill: clean } });

        await prisma.notification.create({
            data: {
                userId: targetUserId,
                type: "ENDORSEMENT",
                message: `👍 <strong>${session.user.name || "Someone"}</strong> endorsed your <strong>${clean}</strong> skill.`,
                resourcePath: "/profile/me",
                read: false,
            },
        });
        await notifyUser(targetUserId);

        revalidatePath("/profile/me");
        return { success: true, endorsed: true, count };
    } catch (error) {
        console.error("endorseSkill failed:", error);
        return { success: false, message: "Failed to endorse." };
    }
}

/**
 * Endorsement counts per skill for a user, plus which ones the current viewer
 * has endorsed (so the UI can render filled/active state).
 */
export async function getEndorsements(userId: string): Promise<{
    counts: Record<string, number>;
    mine: string[];
}> {
    try {
        const session = await auth();
        const viewerId = session?.user?.id;

        const all = await prisma.endorsement.findMany({
            where: { userId },
            select: { skill: true, endorserId: true },
        });

        const counts: Record<string, number> = {};
        const mine: string[] = [];
        for (const e of all) {
            counts[e.skill] = (counts[e.skill] || 0) + 1;
            if (viewerId && e.endorserId === viewerId) mine.push(e.skill);
        }
        return { counts, mine };
    } catch (error) {
        console.error("getEndorsements failed:", error);
        return { counts: {}, mine: [] };
    }
}
