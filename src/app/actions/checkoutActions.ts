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

        const updates: any[] = [
            prisma.transaction.create({
                data: {
                    userId: session.user.id,
                    amount,
                    credits,
                    status: 'COMPLETED',
                    provider: 'CARD',
                    refId,
                    type,
                    planName
                }
            })
        ];

        if (type === 'PLAN' && planName) {
            const creditsToAdd = planName === "ULTRA" ? 100 : planName === "PRO" ? 50 : 0;
            updates.push(
                prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        plan: planName,
                        credits: { increment: creditsToAdd }
                    }
                })
            );
        } else {
            updates.push(
                prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        credits: { increment: credits }
                    }
                })
            );
        }

        await prisma.$transaction(updates);

        // Revalidate cache to sync instant UI updates
        revalidatePath('/credits');
        revalidatePath('/feed');
        revalidatePath('/settings');
        revalidatePath('/', 'layout');

        return { 
            success: true, 
            message: "Direct Card Payment processed successfully!",
            refId
        };
    } catch (error) {
        console.error("Direct Card Payment Database Transaction Error:", error);
        return { success: false, message: "Failed to process payment database ledger updates." };
    }
}
