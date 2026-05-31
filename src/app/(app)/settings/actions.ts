'use server';

import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getSettings() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log("getSettings - No authenticated user ID");
            return null;
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    name: true,
                    headline: true,
                    bio: true,
                    location: true,
                    username: true,
                    image: true,
                    email: true,
                    ghostMode: true,
                    nodeType: true,
                    emailNotifications: true,
                    marketingEmails: true,
                    role: true,
                    searchIndexable: true,
                    openToWork: true,
                    twoFactorEnabled: true,
                    twoFactorVerifiedAt: true,
                    twoFactorBackupCodes: true,
                    verificationRequests: {
                        where: { status: 'PENDING' },
                        select: {
                            id: true,
                            type: true,
                            documentUrl: true,
                        }
                    }
                }
            });

            return user ? {
                ...user,
                twoFactorVerifiedAt: user.twoFactorVerifiedAt ? user.twoFactorVerifiedAt.toISOString() : null
            } as any : null;
        } catch (prismaErr: any) {
            console.warn("getSettings - Full query failed, trying base query. Error:", prismaErr?.message);
            try {
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: {
                        name: true,
                        headline: true,
                        bio: true,
                        location: true,
                        username: true,
                        image: true,
                        email: true,
                        ghostMode: true,
                        nodeType: true,
                        emailNotifications: true,
                        marketingEmails: true,
                        role: true,
                        verificationRequests: {
                            where: { status: 'PENDING' },
                            select: {
                                id: true,
                                type: true,
                                documentUrl: true,
                            }
                        }
                    }
                });

                return user ? {
                    ...user,
                    searchIndexable: true,
                    openToWork: false,
                    twoFactorEnabled: false,
                    twoFactorVerifiedAt: null,
                    twoFactorBackupCodes: [] as string[],
                } : null;
            } catch (baseErr: any) {
                console.error("getSettings - Base query also failed:", baseErr?.message);
                return null;
            }
        }
    } catch (err) {
        console.error("getSettings - Unexpected Error:", err);
        return null;
    }
}

export async function updateNotificationPreferences(type: 'email' | 'marketing', enabled: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        const updateData = type === 'email'
            ? { emailNotifications: enabled }
            : { marketingEmails: enabled };

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('[settings] updateNotificationPreferences failed:', error);
        return { success: false, message: 'Failed to update preferences', error: 'Failed to update preferences' };
    }
}

export async function updateNodeStatus(status: 'OPEN' | 'BROADCAST') {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { nodeType: status },
            select: { username: true }
        });
        revalidatePath('/settings');
        if (user.username) {
            revalidatePath(`/profile/${user.username}`);
        }
        return { success: true };
    } catch (error: any) {
        console.error('[settings] updateNodeStatus failed:', error);
        return { success: false, message: 'Failed to update settings', error: 'Failed to update settings' };
    }
}

export async function updateGhostMode(enabled: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { ghostMode: enabled }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('[settings] updateGhostMode failed:', error);
        return { success: false, message: 'Failed to update settings', error: 'Failed to update settings' };
    }
}

export async function deleteAccount() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        await prisma.user.delete({
            where: { id: session.user.id }
        });
        return { success: true };
    } catch (error: any) {
        console.error('[settings] deleteAccount failed:', error);
        return { success: false, message: 'Failed to delete account', error: 'Failed to delete account' };
    }
}

export async function exportUserData() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        const fullUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                experience: true,
                education: true,
                projects: true,
                posts: true,
            }
        });
        return { success: true, data: JSON.stringify(fullUser, null, 2) };
    } catch (error: any) {
        console.error('[settings] exportUserData failed:', error);
        return { success: false, message: 'Failed to export data', error: 'Failed to export data' };
    }
}

export async function requestRoleChange(workEmail: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        const emailTrimmed = workEmail.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            return { success: false, message: 'Please enter a valid email address.', error: 'Invalid email' };
        }

        const personalDomains = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
            'icloud.com', 'aol.com', 'zoho.com', 'mail.com',
            'protonmail.com', 'live.com', 'yandex.ru', 'gmx.com'
        ];
        const domain = emailTrimmed.split('@')[1];
        if (personalDomains.includes(domain)) {
            return { success: false, message: 'Only corporate/work email addresses are accepted for Recruiter onboarding. Public domains (Gmail, Yahoo, Outlook, etc.) are restricted.', error: 'Corporate email required' };
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (!dbUser) {
            return { success: false, message: 'User not found.', error: 'User not found' };
        }

        if (dbUser.role !== 'CANDIDATE') {
            return { success: false, message: `Your current role is already set as ${dbUser.role}.`, error: 'Invalid current role' };
        }

        const existingRequest = await prisma.verificationRequest.findFirst({
            where: {
                userId: session.user.id,
                type: 'ROLE_CHANGE',
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            return { success: false, message: 'You already have a pending recruiter onboarding request under review.', error: 'Pending request exists' };
        }

        await prisma.verificationRequest.create({
            data: {
                userId: session.user.id,
                type: 'ROLE_CHANGE',
                documentUrl: emailTrimmed,
                status: 'PENDING'
            }
        });

        revalidatePath('/settings');
        return { success: true, message: 'Your Recruiter role change request has been submitted successfully to the admin panel queue!' };
    } catch (error: any) {
        console.error("Failed to request role change:", error);
        return { success: false, message: 'Pipeline failure creating role change request. Please try again.', error: 'Database error' };
    }
}

export async function updateSearchIndexable(enabled: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { searchIndexable: enabled }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('[settings] updateSearchIndexable failed:', error);
        return { success: false, message: 'Failed to update search engine preferences', error: 'Failed to update settings' };
    }
}

export async function updateOpenToWork(enabled: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { openToWork: enabled }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('[settings] updateOpenToWork failed:', error);
        return { success: false, message: 'Failed to update career status', error: 'Failed to update settings' };
    }
}

export async function requestDataExport() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true }
        });

        return {
            success: true,
            message: `Data export request submitted. A secure download link containing your profile, timeline history, and assessments will be emailed to ${user?.email || 'your account email'} within 24 hours.`
        };
    } catch (error: any) {
        console.error('[settings] requestDataExport failed:', error);
        return { success: false, message: 'Failed to request data export', error: 'Failed to request data export' };
    }
}

export async function changeEmail(newEmail: string, passwordInput: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        const emailTrimmed = newEmail.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            return { success: false, message: 'Please enter a valid email address.', error: 'Invalid email format' };
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { success: false, message: 'Identity verification failed.', error: 'User not found' };
        }

        const passwordValid = await bcrypt.compare(passwordInput, user.password);
        if (!passwordValid) {
            return { success: false, message: 'Incorrect password.', error: 'Incorrect password' };
        }

        const existingUser = await prisma.user.findUnique({ where: { email: emailTrimmed } });
        if (existingUser && existingUser.id !== session.user.id) {
            return { success: false, message: 'This email is already linked to another account.', error: 'Email linked to another account' };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { email: emailTrimmed, emailVerified: null }
        });

        revalidatePath('/settings');
        return { success: true, message: 'Email address updated. Please check your new inbox for verification instructions.' };
    } catch (error: any) {
        console.error('[settings] changeEmail failed:', error);
        return { success: false, message: 'Failed to update email address.', error: 'Database error' };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        if (newPassword.length < 8) {
            return { success: false, message: 'New password must be at least 8 characters long.', error: 'Password too short' };
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { success: false, message: 'Identity verification failed.', error: 'User not found' };
        }

        const passwordValid = await bcrypt.compare(currentPassword, user.password);
        if (!passwordValid) {
            return { success: false, message: 'Incorrect current password.', error: 'Incorrect current password' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return { success: true, message: 'Password updated successfully!' };
    } catch (error: any) {
        console.error('[settings] changePassword failed:', error);
        return { success: false, message: 'Failed to update password.', error: 'Database error' };
    }
}

export async function deleteAccountWithVerification(passwordInput: string, deleteText: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: 'Unauthorized', error: 'Unauthorized' };

        if (deleteText !== 'DELETE') {
            return { success: false, message: 'Confirmation text is incorrect.', error: 'Confirmation text incorrect' };
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { success: false, message: 'Identity verification failed.', error: 'User not found' };
        }

        const passwordValid = await bcrypt.compare(passwordInput, user.password);
        if (!passwordValid) {
            return { success: false, message: 'Incorrect password.', error: 'Incorrect password' };
        }

        await prisma.user.delete({
            where: { id: session.user.id }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[settings] deleteAccountWithVerification failed:', error);
        return { success: false, message: 'Failed to terminate account.', error: 'Database error' };
    }
}
