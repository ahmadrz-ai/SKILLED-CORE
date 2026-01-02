'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function resetPassword(email: string, code: string, newCode: string) {
    if (!email || !code || !newCode) {
        return { error: 'Missing required fields' };
    }

    try {
        // 1. Verify Token
        const token = await prisma.verificationToken.findFirst({
            where: {
                identifier: email,
                token: code,
            },
        });

        if (!token) {
            return { error: 'Invalid or expired reset code.' };
        }

        if (new Date() > token.expires) {
            // Cleanup expired
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: token.identifier,
                        token: token.token
                    }
                }
            });
            return { error: 'Reset code expired. Please request a new one.' };
        }

        // 2. Hash New Password
        const hashedPassword = await bcrypt.hash(newCode, 10);

        // 3. Update User Password
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                emailVerified: new Date() // Treat password reset as verification too
            },
        });

        // 4. Delete Token
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
        console.error('Reset Password Error:', error);
        return { error: 'Failed to reset password. Please try again.' };
    }
}
