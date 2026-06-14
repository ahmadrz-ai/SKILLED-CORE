"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCreditState, spendCredit, getSpendIntent, type CreditState } from "@/lib/credits";

/** Read-only: will an AI-Resume build use a Resume credit, a General one, or none? */
export async function getResumeSpendIntent() {
    const session = await auth();
    if (!session?.user?.id) return { willUse: "none" as const, category: 0, general: 0 };
    return getSpendIntent(session.user.id, "resume");
}

/** Charge one Resume credit (Resume → General → topUp). Call after a successful build. */
export async function consumeResumeCredit() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    const res = await spendCredit(session.user.id, "resume", { allowGeneralFallback: true });
    if (res.success) revalidatePath("/credits");
    return { success: res.success, usedGeneral: res.used !== "resume" };
}

/** Total spendable credits (sum of all buckets) — used by the topbar. */
export async function getCredits() {
    const session = await auth();
    if (!session?.user?.id) return 0;
    try {
        const state = await getCreditState(session.user.id);
        return state?.total ?? 0;
    } catch (error) {
        console.error("Get Credits Error (returning 0):", error);
        return 0;
    }
}

/** Full per-bucket breakdown — used by the Credits page. */
export async function getMyCreditState(): Promise<CreditState | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    try {
        return await getCreditState(session.user.id);
    } catch (error) {
        console.error("getMyCreditState error:", error);
        return null;
    }
}

// SECURITY: a public `addCredits(amount)` server action previously let ANY
// logged-in user grant themselves unlimited credits (self-increment with no
// payment or admin check) — a total bypass of the paid economy. It had zero
// callers and has been removed. Credits may only change via:
//   - server-internal deduction (deductCredits / the interview $transaction), or
//   - an admin-verified top-up after a confirmed payment.
// Do NOT reintroduce a client-callable credit-increment action.

/**
 * Generic deduction — spends from the General pool (general → topUp). Used by
 * "anywhere" actions (chat unlock, job posting). For category-specific spends
 * (interview/resume) call spendCredit() directly with allowGeneralFallback.
 */
export async function deductCredits(amount: number = 1) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, remaining: 0 };
    try {
        for (let i = 0; i < amount; i++) {
            const res = await spendCredit(session.user.id, "general");
            if (!res.success) {
                const state = await getCreditState(session.user.id);
                return { success: false, remaining: state?.total ?? 0 };
            }
        }
        const state = await getCreditState(session.user.id);
        revalidatePath("/credits");
        return { success: true, remaining: state?.total ?? 0 };
    } catch (error) {
        console.error("Deduct Credits Error:", error);
        return { success: false, remaining: 0 };
    }
}

export async function getBillingContext(): Promise<{ plan: string; role: string; credits: number; breakdown: CreditState | null }> {
    const session = await auth();
    if (!session?.user?.id) return { plan: "BASIC", role: "CANDIDATE", credits: 0, breakdown: null };
    try {
        const [user, breakdown] = await Promise.all([
            prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true, role: true } }),
            getCreditState(session.user.id),
        ]);
        return {
            plan: user?.plan || "BASIC",
            role: user?.role || "CANDIDATE",
            credits: breakdown?.total ?? 0,
            breakdown,
        };
    } catch (error) {
        console.error("getBillingContext error:", error);
        return { plan: "BASIC", role: "CANDIDATE", credits: 0, breakdown: null };
    }
}

export async function getPlan() {
    const session = await auth();
    if (!session?.user?.id) return "BASIC";

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true }
        });
        return user?.plan || "BASIC";
    } catch (error) {
        console.error("Get Plan Error (returning BASIC):", error);
        return "BASIC";
    }
}

export async function cancelSubscription(reason: string, detail?: string): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true },
        });

        // Record the LinkedIn-style cancellation feedback (best-effort; table is created
        // by the deploy build's prisma db push).
        try {
            await prisma.cancellationFeedback.create({
                data: {
                    userId: session.user.id,
                    plan: user?.plan || "BASIC",
                    reason,
                    detail: detail?.trim() || null,
                },
            });
        } catch (feedbackErr) {
            console.error("Cancellation feedback save failed (non-fatal):", feedbackErr);
        }

        // Downgrade to the free tier. (Real proration/billing happens in Round C / Stripe.)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { plan: "BASIC" },
        });

        revalidatePath("/credits");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Cancel Subscription Error:", error);
        return { success: false };
    }
}

export async function upgradePlan(plan: "BASIC" | "PRO" | "ULTRA") {
    const session = await auth();
    if (!session?.user?.id) return;

    // Plans can only be granted by an admin (no self-serve activation). Paid upgrades go
    // through a PENDING transaction that an admin approves in the admin billing panel.
    const caller = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (caller?.role !== "ADMIN") {
        console.warn("upgradePlan blocked: non-admin attempted self-grant");
        return;
    }

    const creditsToAdd = plan === "ULTRA" ? 100 : plan === "PRO" ? 50 : 0;

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            plan,
            credits: { increment: creditsToAdd }
        }
    });

    revalidatePath("/credits");
    revalidatePath("/analytics");
    revalidatePath("/feed");
    revalidatePath("/profile");
    revalidatePath("/", "layout"); // Revalidate sidebar
}
