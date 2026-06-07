"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function processDirectCardPayment(
    amount: number, // in Cents, e.g. 500 for $5
    credits: number,
    type: 'CREDITS' | 'PLAN' = 'CREDITS',
    planName?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const refId = "CARD_" + Math.random().toString(36).substring(2, 12).toUpperCase();
        const isPlan = type === 'PLAN' && !!planName;

        // IMPORTANT: plan purchases NEVER auto-activate. They are recorded as PENDING and
        // a plan is only granted when an admin approves it in the admin billing panel.
        // Credit top-ups (low-stakes) still activate instantly on card.
        await prisma.transaction.create({
            data: {
                userId: session.user.id,
                amount,
                credits: isPlan ? 0 : credits,
                status: isPlan ? 'PENDING' : 'COMPLETED',
                provider: 'CARD',
                refId,
                type,
                planName,
            }
        });

        if (!isPlan) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { credits: { increment: credits } }
            });
        }

        // Revalidate cache to sync instant UI updates
        revalidatePath('/credits');
        revalidatePath('/feed');
        revalidatePath('/settings');
        revalidatePath('/admin/billing');
        revalidatePath('/', 'layout');

        return {
            success: true,
            pending: isPlan,
            message: isPlan
                ? "Plan request submitted — an admin will review and activate it shortly."
                : "Payment processed successfully!",
            refId
        };
    } catch (error) {
        console.error("Direct Card Payment Database Transaction Error:", error);
        return { success: false, message: "Failed to process payment database ledger updates." };
    }
}
