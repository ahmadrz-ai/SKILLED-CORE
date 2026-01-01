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
        // 2. Calculate Date (7 days ago)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 3. Query Users
        // Logic: Last login was BEFORE 7 days ago OR lastLogin is null (never logged in? maybe exclude never logged in if we only want re-engagement, but let's include valid users)
        // Optimization: Limit to 20 to prevent rate limits
        const users = await prisma.user.findMany({
            where: {
                lastLogin: {
                    lt: sevenDaysAgo
                },
                email: { not: null } // Ensure email exists
                // Note: In a real/strict marketing scenario, we would check marketingEmails: true
            },
            take: 20,
            select: {
                id: true,
                email: true,
                name: true,
                username: true
            }
        });

        if (users.length === 0) {
            return NextResponse.json({ success: true, message: "No inactive users found." });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const subjectLines = [
            "Your profile is getting noticed 👀",
            "Don't let your rank drop..."
        ];

        // 4. Send Emails
        const results = await Promise.allSettled(users.map(async (user) => {
            if (!user.email) return;

            const subject = subjectLines[Math.floor(Math.random() * subjectLines.length)];
            const userName = user.name || user.username || "Friend";

            return resend.emails.send({
                from: 'Ahmad from Skilled Core <ahmad@skilledcore.com>',
                to: user.email,
                subject: subject,
                react: RetentionEmail({ userName })
            });
        }));

        // Log results
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Cron: Sent ${successful}/${users.length} retention emails.`);

        return NextResponse.json({
            success: true,
            processed: users.length,
            sent: successful
        });

    } catch (error) {
        console.error("Cron Retention Error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
