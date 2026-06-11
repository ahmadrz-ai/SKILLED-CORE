"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCredits() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });
        return user?.credits || 0;
    } catch (error) {
        console.error("Get Credits Error (returning 0):", error);
        return 0;
    }
}

// SECURITY: a public `addCredits(amount)` server action previously let ANY
// logged-in user grant themselves unlimited credits (self-increment with no
// payment or admin check) — a total bypass of the paid economy. It had zero
// callers and has been removed. Credits may only change via:
//   - server-internal deduction (deductCredits / the interview $transaction), or
//   - an admin-verified top-up after a confirmed payment.
// Do NOT reintroduce a client-callable credit-increment action.

export async function deductCredits(amount: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, remaining: 0 };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });

        if (!user || user.credits < amount) {
            return { success: false, remaining: user?.credits || 0 };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: amount } }
        });

        const updatedUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });

        revalidatePath("/credits");
        return { success: true, remaining: updatedUser?.credits || 0 };
    } catch (error) {
        console.error("Deduct Credits Error:", error);
        return { success: false, remaining: 0 };
    }
}

export async function getBillingContext(): Promise<{ plan: string; role: string; credits: number }> {
    const session = await auth();
    if (!session?.user?.id) return { plan: "BASIC", role: "CANDIDATE", credits: 0 };
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true, role: true, credits: true },
        });
        return { plan: user?.plan || "BASIC", role: user?.role || "CANDIDATE", credits: user?.credits || 0 };
    } catch (error) {
        console.error("getBillingContext error:", error);
        return { plan: "BASIC", role: "CANDIDATE", credits: 0 };
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
