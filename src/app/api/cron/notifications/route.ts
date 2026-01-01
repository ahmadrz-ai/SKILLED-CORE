import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { RetentionEmail } from '@/components/emails/RetentionEmail';

export async function GET(req: Request) {
    // 1. Security Check
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. Fetch all unread conversation participants
        // This finds people who ARE waiting for a reply/read
        // We want to notify the USER (userId) that they have unread messages in these conversations.
        const unreadParticipants = await prisma.conversationParticipant.findMany({
            where: {
                hasUnread: true,
                user: {
                    email: { not: null },
                    emailNotifications: true // Respect user preference if exists, defaults to true
                }
            },
            include: {
                user: true, // The recipient
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: true // To find the sender names
                            }
                        }
                    }
                }
            }
        });

        if (unreadParticipants.length === 0) {
            return NextResponse.json({ success: true, message: "No unread messages found." });
        }

        // 3. Group by Recipient (User)
        const userMap = new Map();

        for (const p of unreadParticipants) {
            const recipient = p.user;
            if (!recipient.email) continue;

            if (!userMap.has(recipient.id)) {
                userMap.set(recipient.id, {
                    user: recipient,
                    senders: new Set<string>()
                });
            }

            // Find the OTHER participant(s) who are the senders
            // In a 1:1 chat, it's the other person. In group, it's anyone else.
            const otherParticipants = p.conversation.participants.filter(cp => cp.userId !== recipient.id);
            otherParticipants.forEach(op => {
                if (op.user.name) userMap.get(recipient.id).senders.add(op.user.name);
                else if (op.user.username) userMap.get(recipient.id).senders.add(op.user.username);
            });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const results = [];

        // 4. Send Emails
        for (const [userId, data] of userMap.entries()) {
            const { user, senders } = data;
            const senderNames = Array.from(senders) as string[];

            if (senderNames.length === 0) continue;

            const senderText = senderNames.slice(0, 2).join(', ') + (senderNames.length > 2 ? ` +${senderNames.length - 2}` : '');

            results.push(resend.emails.send({
                from: 'Skilled Core <notifications@skilledcore.com>',
                to: user.email!,
                subject: `You have unread messages from ${senderText}`,
                react: RetentionEmail({
                    userName: user.name || user.username || "Member",
                    senderNames: senderNames
                })
            }));
        }

        await Promise.allSettled(results);

        console.log(`Cron: Sent ${results.length} unread message notifications.`);

        return NextResponse.json({
            success: true,
            processed: unreadParticipants.length,
            emailsSent: results.length
        });

    } catch (error) {
        console.error("Cron Notification Error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
