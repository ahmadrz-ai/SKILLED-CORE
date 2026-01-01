'use server';

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import OtpEmail from '@/components/emails/OtpEmail';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCode(email: string) {
    try {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete existing tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });

        // Save new token
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: code,
                expires,
            },
        });

        // Send email
        await resend.emails.send({
            from: 'Skilled Core <noreply@skilledcore.com>',
            to: [email],
            subject: 'Secure Login Code',
            react: OtpEmail({ validationCode: code }),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Failed to send verification code:', error);
        return { error: 'Failed to send code. Please try again.' };
    }
}

export async function verifyCode(email: string, code: string) {
    if (!email || !code) return { error: 'Missing email or code' };

    try {
        // Find token
        const token = await prisma.verificationToken.findFirst({
            where: {
                identifier: email,
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

        // Verify User
        await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() },
        });

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
