'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';


export async function getConversations() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, conversations: [] };

    try {
        // Fetch current user role for UI permissions
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: session.user.id }
                }
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                                role: true,
                                headline: true,
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        // Format for frontend
        const formatted = conversations.map(c => {
            const otherParticipant = c.participants.find(p => p.userId !== session.user!.id);
            const myParticipant = c.participants.find(p => p.userId === session.user!.id);
            const lastMessage = c.messages[0];

            if (!otherParticipant) return null;

            return {
                id: c.id,
                contactId: otherParticipant.userId,
                name: otherParticipant.user.name || otherParticipant.user.username || "Unknown",
                role: otherParticipant.user.headline || otherParticipant.user.role,
                avatar: otherParticipant.user.image,
                online: false,
                lastMessage: lastMessage ? lastMessage.content : "Start a conversation",
                time: lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                unread: myParticipant?.hasUnread ? 1 : 0,
                updatedAt: c.updatedAt
            };
        }).filter(Boolean);

        return { success: true, conversations: formatted, userRole: currentUser?.role || 'User' };
    } catch (error) {
        console.error("Get Conversations Error:", error);
        return { success: false, conversations: [] };
    }
}

export async function getMessages(conversationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, messages: [] };

    try {
        // Mark as read
        await prisma.conversationParticipant.update({
            where: {
                userId_conversationId: {
                    userId: session.user.id,
                    conversationId: conversationId
                }
            },
            data: { hasUnread: false }
        });

        // Get updated conversation status to check if OTHER user has read messages
        const conversationCallback = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: true }
        });

        const otherParticipant = conversationCallback?.participants.find(p => p.userId !== session.user!.id);
        const isReadByRecipient = otherParticipant ? !otherParticipant.hasUnread : false;

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: {
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { name: true } }
                    }
                }
            }
        });

        console.log(`Fetching messages for ${conversationId}, found: ${messages.length}`);
        return {
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                text: m.isDeleted ? "Message unsent" : m.content,
                attachmentUrl: m.isDeleted ? null : m.attachmentUrl,
                attachmentType: m.isDeleted ? null : m.attachmentType,
                sender: m.senderId === session.user!.id ? 'me' : 'them',
                senderId: m.senderId,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: isReadByRecipient ? 'read' : 'sent', // Simplified logic: if they are up to date, all are read.
                reactions: m.reactions || [],
                isDeleted: m.isDeleted,
                replyTo: m.replyTo ? {
                    id: m.replyTo.id,
                    content: m.replyTo.content,
                    senderName: m.replyTo.sender.name
                } : null
            })),
            isReadByRecipient
        };
    } catch (error) {
        console.error("Get Messages Error:", error);
        return { success: false, messages: [] };
    }
}

export async function sendMessage(recipientId: string, content: string | null, attachmentUrl?: string, attachmentType?: string, replyToId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    if (!content?.trim() && !attachmentUrl) return { success: false, message: "Empty message" };

    try {
        const userId = session.user.id;

        const existingConversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    every: {
                        userId: { in: [userId, recipientId] }
                    }
                }
            },
            include: { participants: true }
        });

        const match = existingConversations.find(c => c.participants.length === 2);
        let conversationId = match?.id;

        if (!conversationId) {
            const newConv = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: userId },
                            { userId: recipientId, hasUnread: true }
                        ]
                    }
                }
            });
            conversationId = newConv.id;
        } else {
            await prisma.conversationParticipant.updateMany({
                where: {
                    conversationId,
                    userId: recipientId
                },
                data: { hasUnread: true }
            });
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });
        }

        // Create Message
        const newMessage = await prisma.message.create({
            data: {
                content: content || "",
                attachmentUrl,
                attachmentType,
                senderId: userId,
                conversationId,
                replyToId
            }
        });

        // Create System Notification for Bell
        const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, username: true }
        });
        const senderName = sender?.name || sender?.username || "A user";

        await prisma.notification.create({
            data: {
                userId: recipientId,
                type: 'MESSAGE',
                message: `New message from <strong>${senderName}</strong>`,
                resourcePath: `/messages?userId=${userId}`,
                read: false
            }
        });

        revalidatePath('/messages');
        return { success: true, message: newMessage, conversationId };
    } catch (error) {
        console.error("Send Message Error:", error);
        return { success: false, message: "Failed to send" };
    }
}

export async function reactToMessage(messageId: string, emoji: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return { success: false };

        const currentReactions = (message.reactions as any[]) || [];
        // Toggle reaction
        const existingIndex = currentReactions.findIndex((r: any) => r.userId === session.user?.id && r.emoji === emoji);

        let newReactions;
        if (existingIndex > -1) {
            // Remove
            newReactions = currentReactions.filter((_, i) => i !== existingIndex);
        } else {
            // Add
            newReactions = [...currentReactions, { userId: session.user?.id, emoji }];
        }

        await prisma.message.update({
            where: { id: messageId },
            data: { reactions: newReactions }
        });
        revalidatePath('/messages');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function unsendMessage(messageId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== session.user.id) return { success: false };

        await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: "Message unsent", attachmentUrl: null }
        });
        revalidatePath('/messages');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function startConversation(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    // Just essentially "Get or Create" logic without sending a message yet
    // Reuse confirm existing logic
    try {
        const userId = session.user.id;
        const existingConversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    every: {
                        userId: { in: [userId, targetUserId] }
                    }
                }
            },
            include: { participants: true }
        });

        const match = existingConversations.find(c => c.participants.length === 2);
        if (match) return { success: true, conversationId: match.id };

        const newConv = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: userId },
                        { userId: targetUserId }
                    ]
                }
            }
        });
        return { success: true, conversationId: newConv.id };

    } catch (e) {
        return { success: false };
    }
}

export async function getUserDetails(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                role: true,
                headline: true
            }
        });
        if (!user) return { success: false };

        return {
            success: true,
            user: {
                id: user.id,
                name: user.name || "Unknown",
                avatar: user.image,
                role: user.headline || user.role
            }
        };
    } catch (error) {
        return { success: false };
    }
}
