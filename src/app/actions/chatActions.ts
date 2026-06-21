"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { spendCredit } from "@/lib/credits";
import { checkRateLimit } from "@/lib/ratelimit";

export async function unlockConversation(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const currentUserId = session.user.id;

    try {
        // 1. Check if conversation already exists between these two users
        const existingParticipant = await prisma.conversationParticipant.findFirst({
            where: {
                userId: currentUserId,
                conversation: {
                    participants: {
                        some: { userId: targetUserId }
                    }
                }
            },
            include: { conversation: true }
        });

        if (existingParticipant) {
            return { success: true, conversationId: existingParticipant.conversationId, alreadyUnlocked: true };
        }

        // Dedup guard: a double-click / concurrent retry could pass the check above
        // twice and double-charge the user before either conversation is committed.
        // Allow only one unlock per (user → target) per 10s window.
        const dedup = await checkRateLimit(`unlock:${currentUserId}:${targetUserId}`, currentUserId, 1, 10);
        if (!dedup.success) {
            return { success: false, error: "Unlock already in progress. Please wait a moment." };
        }

        // 2. No conversation exists — charge 1 General credit (general → topUp) to unlock.
        const spend = await spendCredit(currentUserId, "general");
        if (!spend.success) {
            throw new Error("Insufficient credits");
        }

        let result;
        try {
        result = await prisma.$transaction(async (tx) => {
            // Create the new conversation and participants
            const conversation = await tx.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: currentUserId },
                            { userId: targetUserId }
                        ]
                    }
                }
            });

            // Record transaction for billing history
            await tx.transaction.create({
                data: {
                    userId: currentUserId,
                    amount: 0, // Since it's a credit deduction, monetary amount is 0
                    credits: -1,
                    type: "MESSAGE_UNLOCK",
                    status: "COMPLETED",
                    provider: "INTERNAL",
                    refId: `unlock_chat_${targetUserId}`
                }
            });

            return conversation;
        });
        } catch (txErr) {
            // Refund the credit we charged if the unlock couldn't be created.
            const field = spend.used === "topup" ? "topUpCredits" : "generalCredits";
            await prisma.user.update({ where: { id: currentUserId }, data: { [field]: { increment: 1 } } }).catch(() => {});
            throw txErr;
        }

        revalidatePath("/credits");
        revalidatePath("/messages");

        return { success: true, conversationId: result.id, alreadyUnlocked: false };

    } catch (error: any) {
        if (error.message === "Insufficient credits") {
            return { success: false, error: "Insufficient credits" };
        }
        console.error("Error unlocking conversation:", error);
        return { success: false, error: "Failed to unlock conversation" };
    }
}
