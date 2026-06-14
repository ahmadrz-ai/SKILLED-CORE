'use server';

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import OtpEmail from '@/components/emails/OtpEmail';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCode(email: string) {
    try {
        const cleanEmail = email.toLowerCase().trim();
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete existing tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { identifier: { equals: cleanEmail, mode: 'insensitive' } },
        });

        // Save new token
        await prisma.verificationToken.create({
            data: {
                identifier: cleanEmail,
                token: code,
                expires,
            },
        });

        // Send email
        const { data, error } = await resend.emails.send({
            from: 'Skilled Core <noreply@skilledcore.com>',
            to: [cleanEmail],
            subject: 'Secure Login Code',
            react: OtpEmail({ validationCode: code }),
        });

        if (error) {
            console.error('Failed to send verification code via Resend:', error);
            return { error: `Failed to send verification code: ${error.message || 'Unknown Resend error'}` };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Failed to send verification code:', error);
        return { error: error.message || 'Failed to send code. Please try again.' };
    }
}

export async function verifyCode(email: string, code: string) {
    if (!email || !code) return { error: 'Missing email or code' };

    try {
        const cleanEmail = email.toLowerCase().trim();
        // Find token
        const token = await prisma.verificationToken.findFirst({
            where: {
                identifier: { equals: cleanEmail, mode: 'insensitive' },
                token: code,
            },
        });

        if (!token) {
            return { error: 'Invalid code.' };
        }

        if (new Date() > token.expires) {
            // Optional: delete expired token
            return { error: 'Code expired.' };
        }

        // Find User safely to get their exact ID
        const dbUser = await prisma.user.findFirst({
            where: { email: { equals: cleanEmail, mode: 'insensitive' } }
        });

        if (!dbUser) {
            return { error: 'User not found.' };
        }

        // Verify User using unique DB ID
        await prisma.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: new Date() },
        });

        try {
            await prisma.notification.create({
                data: { userId: dbUser.id, type: "EMAIL_VERIFIED", message: "✅ Your email is verified. Your account is fully active.", resourcePath: "/feed", read: false },
            });
            const { notifyUser } = await import("@/lib/ably");
            await notifyUser(dbUser.id);
        } catch (e) { console.error("EMAIL_VERIFIED notify failed:", e); }

        // Delete token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: token.identifier,
                    token: token.token
                }
            }
        });

        return { success: true };

    } catch (error: any) {
        console.error('Verification error:', error);
        return { error: 'Verification failed.' };
    }
}
