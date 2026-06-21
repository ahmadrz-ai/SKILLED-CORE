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

        // SECURITY (V6): there is NO real card charge in this stub, and `amount`/`credits`
        // are client-supplied. Auto-granting here let any logged-in user mint unlimited
        // free credits by calling this action directly. So NOTHING auto-activates: every
        // purchase is recorded PENDING and only granted when an admin verifies + approves
        // it in the billing panel (approveTransaction → topUp credits / plan + notifies).
        // Wire a real payment processor (e.g. Stripe webhook) to restore instant grants.
        await prisma.transaction.create({
            data: {
                userId: session.user.id,
                amount,
                credits: isPlan ? 0 : credits,
                status: 'PENDING',
                provider: 'CARD',
                refId,
                type,
                planName,
            }
        });

        revalidatePath('/credits');
        revalidatePath('/settings');
        revalidatePath('/admin/billing');
        revalidatePath('/', 'layout');

        return {
            success: true,
            pending: true,
            message: "Payment request submitted — an admin will review and activate it shortly.",
            refId
        };
    } catch (error) {
        console.error("Direct Card Payment Database Transaction Error:", error);
        return { success: false, message: "Failed to process payment database ledger updates." };
    }
}
