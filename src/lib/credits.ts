import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Three-bucket credit engine — single source of truth for balances and spending.
 *
 *  - resume   : AI Resume → Profile builder runs
 *  - interview: AI Interview runs
 *  - general  : usable anywhere (incl. accepting bookings)
 *  - topUp    : purchased credits — PERMANENT, never reset, spent as general
 *
 * Plan buckets reset every 30 days; topUp survives resets. Legacy single-field
 * `credits` is migrated into topUp on first access (so existing balances become
 * permanent general-usable, honoring "existing → General" without being wiped by
 * the monthly reset).
 */

export type CreditKind = "resume" | "interview" | "general";
type Tier = "BASIC" | "PRO" | "ULTRA";

export const PLAN_CREDITS: Record<Tier, { resume: number; interview: number; general: number }> = {
    BASIC: { resume: 3, interview: 3, general: 4 },
    PRO: { resume: 10, interview: 10, general: 20 },
    ULTRA: { resume: 10, interview: 10, general: 20 }, // Elite
};

const CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

function allocFor(plan?: string | null) {
    const p = (plan || "BASIC").toUpperCase() as Tier;
    return PLAN_CREDITS[p] || PLAN_CREDITS.BASIC;
}

const STATE_SELECT = {
    plan: true,
    credits: true,
    creditsResetAt: true,
    resumeCredits: true,
    interviewCredits: true,
    generalCredits: true,
    topUpCredits: true,
} as const;

export interface CreditState {
    resume: number;
    interview: number;
    general: number;   // plan general bucket
    topUp: number;     // permanent purchased credits (also general-usable)
    generalTotal: number; // general + topUp (what's spendable on bookings/fallback)
    total: number;     // everything
    resetAt: Date | null;
    plan: string;
}

/** Lazily migrate (first access) and apply the monthly reset, then return the row. */
async function ensureFresh(userId: string) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: STATE_SELECT });
    if (!u) return null;
    const alloc = allocFor(u.plan);

    // First-ever access under the new system: grant plan buckets and fold the old
    // single `credits` value into permanent topUp (existing balance → general-usable).
    if (!u.creditsResetAt) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                resumeCredits: alloc.resume,
                interviewCredits: alloc.interview,
                generalCredits: alloc.general,
                topUpCredits: (u.topUpCredits || 0) + (u.credits || 0),
                credits: 0,
                creditsResetAt: new Date(),
            },
            select: STATE_SELECT,
        });
    }

    // Monthly reset of plan buckets (topUp is permanent — untouched).
    if (Date.now() - new Date(u.creditsResetAt).getTime() >= CYCLE_MS) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                resumeCredits: alloc.resume,
                interviewCredits: alloc.interview,
                generalCredits: alloc.general,
                creditsResetAt: new Date(),
            },
            select: STATE_SELECT,
        });
    }

    return u;
}

export async function getCreditState(userId: string): Promise<CreditState | null> {
    const u = await ensureFresh(userId);
    if (!u) return null;
    return {
        resume: u.resumeCredits,
        interview: u.interviewCredits,
        general: u.generalCredits,
        topUp: u.topUpCredits,
        generalTotal: u.generalCredits + u.topUpCredits,
        total: u.resumeCredits + u.interviewCredits + u.generalCredits + u.topUpCredits,
        resetAt: u.creditsResetAt,
        plan: u.plan,
    };
}

/**
 * What will be charged if we spend `kind` right now — WITHOUT spending. Drives the
 * "this will use a General credit" confirmation popup.
 */
export async function getSpendIntent(
    userId: string,
    kind: CreditKind,
): Promise<{ willUse: "category" | "general" | "none"; category: number; general: number }> {
    const s = await getCreditState(userId);
    if (!s) return { willUse: "none", category: 0, general: 0 };
    if (kind === "general") {
        return { willUse: s.generalTotal > 0 ? "general" : "none", category: 0, general: s.generalTotal };
    }
    const category = kind === "resume" ? s.resume : s.interview;
    if (category > 0) return { willUse: "category", category, general: s.generalTotal };
    if (s.generalTotal > 0) return { willUse: "general", category: 0, general: s.generalTotal };
    return { willUse: "none", category: 0, general: s.generalTotal };
}

/**
 * Atomically spend one credit. For resume/interview, drains the category bucket
 * first, then (if allowGeneralFallback) general, then topUp. For 'general', drains
 * general then topUp. Returns which pool was used.
 */
export async function spendCredit(
    userId: string,
    kind: CreditKind,
    opts: { allowGeneralFallback?: boolean } = {},
): Promise<{ success: boolean; used?: "resume" | "interview" | "general" | "topup"; reason?: string }> {
    await ensureFresh(userId);
    return prisma.$transaction(async (tx) => {
        const u = await tx.user.findUnique({
            where: { id: userId },
            select: { resumeCredits: true, interviewCredits: true, generalCredits: true, topUpCredits: true },
        });
        if (!u) return { success: false, reason: "no-user" };

        const dec = (field: string) => tx.user.update({ where: { id: userId }, data: { [field]: { decrement: 1 } } });

        if (kind === "resume" || kind === "interview") {
            const field = kind === "resume" ? "resumeCredits" : "interviewCredits";
            if ((u as any)[field] > 0) { await dec(field); return { success: true, used: kind }; }
            if (opts.allowGeneralFallback) {
                if (u.generalCredits > 0) { await dec("generalCredits"); return { success: true, used: "general" }; }
                if (u.topUpCredits > 0) { await dec("topUpCredits"); return { success: true, used: "topup" }; }
            }
            return { success: false, reason: "no-credits" };
        }

        // general
        if (u.generalCredits > 0) { await dec("generalCredits"); return { success: true, used: "general" }; }
        if (u.topUpCredits > 0) { await dec("topUpCredits"); return { success: true, used: "topup" }; }
        return { success: false, reason: "no-credits" };
    });
}

/** Add purchased (permanent) credits. */
export async function addTopUpCredits(userId: string, amount: number) {
    if (amount <= 0) return;
    await prisma.user.update({ where: { id: userId }, data: { topUpCredits: { increment: amount } } });
}

/** (Re)grant a plan's monthly buckets — call on signup/upgrade. topUp untouched. */
export async function grantPlanCredits(userId: string, plan: string) {
    const alloc = allocFor(plan);
    await prisma.user.update({
        where: { id: userId },
        data: {
            resumeCredits: alloc.resume,
            interviewCredits: alloc.interview,
            generalCredits: alloc.general,
            creditsResetAt: new Date(),
        },
    });
}
