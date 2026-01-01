'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { MessageNotification } from '@/components/emails/MessageNotification';

export async function getConversations() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, conversations: [] };

    try {
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
                                // online status is not persisted, we can infer last active later
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

            if (!otherParticipant) return null; // Should not happen

            return {
                id: c.id,
                contactId: otherParticipant.userId,
                name: otherParticipant.user.name || otherParticipant.user.username || "Unknown",
                role: otherParticipant.user.headline || otherParticipant.user.role,
                avatar: otherParticipant.user.image, // URL
                online: false, // Placeholder
                lastMessage: lastMessage ? lastMessage.content : "Start a conversation",
                time: lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                unread: myParticipant?.hasUnread ? 1 : 0, // Boolean to count
                updatedAt: c.updatedAt
            };
        }).filter(Boolean);

        return { success: true, conversations: formatted };
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

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: { sender: true }
        });

        console.log(`Fetching messages for ${conversationId}, found: ${messages.length}`);
        return {
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                text: m.content,
                attachmentUrl: m.attachmentUrl,
                attachmentType: m.attachmentType,
                sender: m.senderId === session.user!.id ? 'me' : 'them',
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
        };
    } catch (error) {
        console.error("Get Messages Error:", error);
        return { success: false, messages: [] };
    }
}

export async function sendMessage(recipientId: string, content: string | null, attachmentUrl?: string, attachmentType?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    if (!content?.trim() && !attachmentUrl) return { success: false, message: "Empty message" }; // Must have either content or attachment

    try {
        const userId = session.user.id;

        // 1. Find existing conversation OR create new
        // We need to find a conversation where BOTH participants exist
        // Prisma doesn't have a direct "find conversation with exact participants" query easily without raw SQL or double checking
        // Easier approach: Find active conversations for ME, then filter in memory or via improved query.

        // Better:
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

        // Filter for exactly 2 participants to avoid group chat confusions (if we ever add them)
        const match = existingConversations.find(c => c.participants.length === 2);

        let conversationId = match?.id;

        if (!conversationId) {
            // Create new
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
            // Update existing: Set unread for recipient
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

        // 2. Create Message
        const newMessage = await prisma.message.create({
            data: {
                content: content || "", // Content can be empty string if attachment exists
                attachmentUrl,
                attachmentType,
                senderId: userId,
                conversationId
            }
        });

        // 3. Send Email Notification (Async - fire and forget)
        (async () => {
            try {
                // Fetch recipient email
                const recipient = await prisma.user.findUnique({
                    where: { id: recipientId },
                    select: { email: true, emailNotifications: true }
                });

                if (recipient?.email && recipient.emailNotifications) {
                    const sender = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { name: true, username: true }
                    });

                    const senderName = sender?.name || sender?.username || "A user";
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://skilledcore.com'}/messages?userId=${userId}`;

                    await resend.emails.send({
                        from: 'Skilled Core <notifications@skilledcore.com>',
                        to: recipient.email,
                        replyTo: 'ahmad@skilledcore.com',
                        subject: `New message from ${senderName}`,
                        react: MessageNotification({
                            senderName,
                            senderEmail: 'notifications@skilledcore.com',
                            messageContent: content || "Sent an attachment",
                            actionUrl
                        })
                    });
                }
            } catch (err) {
                console.error("Failed to send email notification:", err);
            }
        })();

        revalidatePath('/messages');
        return { success: true, message: newMessage, conversationId };
    } catch (error) {
        console.error("Send Message Error:", error);
        return { success: false, message: "Failed to send" };
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
