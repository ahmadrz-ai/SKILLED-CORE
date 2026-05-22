"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

        // 2. No conversation exists. We must charge 1 credit to unlock.
        // Check balance using a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: currentUserId },
                select: { credits: true }
            });

            if (!user || user.credits < 1) {
                throw new Error("Insufficient credits");
            }

            // Deduct 1 credit
            await tx.user.update({
                where: { id: currentUserId },
                data: { credits: { decrement: 1 } }
            });

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
