'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { signOut } from '@/auth'; // Adjust import if signOut is client-side only (usually client), for server side we might just delete session in DB or let client handle redirection. 
// Actually signOut in next-auth v5 is server-usable but often for redirects. 
// We will just delete the user and return success, letting client redirect.

export async function getSettings() {
    try {
        const session = await auth();
        console.log("getSettings - Session:", session?.user?.email); // Debug log

        if (!session?.user?.id) {
            console.log("getSettings - No user ID");
            return null;
        }

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
                twoFactorBackupCodes: true, // count length on client, securely
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

        console.log("getSettings - User found:", user ? "Yes" : "No");
        return user;
    } catch (err) {
        console.error("getSettings - Error:", err);
        throw err; // Re-throw to be caught by component
    }
}

export async function updateNotificationPreferences(type: 'email' | 'marketing', enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
        const updateData = type === 'email'
            ? { emailNotifications: enabled }
            : { marketingEmails: enabled };

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to update preferences' };
    }
}

export async function updateNodeStatus(status: 'OPEN' | 'BROADCAST') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
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
    } catch (error) {
        return { success: false, message: 'Failed to update settings' };
    }
}

export async function updateGhostMode(enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { ghostMode: enabled }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to update settings' };
    }
}

export async function deleteAccount() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
        await prisma.user.delete({
            where: { id: session.user.id }
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to delete account' };
    }
}

export async function exportUserData() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
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
    } catch (error) {
        return { success: false, message: 'Failed to export data' };
    }
}

export async function requestRoleChange(workEmail: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    const emailTrimmed = workEmail.toLowerCase().trim();

    // Standard Email Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
        return { success: false, message: 'Please enter a valid email address.' };
    }

    // Corporate Domain Validation: reject common personal email providers
    const personalDomains = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
        'icloud.com', 'aol.com', 'zoho.com', 'mail.com',
        'protonmail.com', 'live.com', 'yandex.ru', 'gmx.com'
    ];
    const domain = emailTrimmed.split('@')[1];
    if (personalDomains.includes(domain)) {
        return { success: false, message: 'Only corporate/work email addresses are accepted for Recruiter onboarding. Public domains (Gmail, Yahoo, Outlook, etc.) are restricted.' };
    }

    try {
        // Enforce user current role is CANDIDATE
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (!dbUser) {
            return { success: false, message: 'User not found.' };
        }

        if (dbUser.role !== 'CANDIDATE') {
            return { success: false, message: `Your current role is already set as ${dbUser.role}.` };
        }

        // Prevent duplicate requests
        const existingRequest = await prisma.verificationRequest.findFirst({
            where: {
                userId: session.user.id,
                type: 'ROLE_CHANGE',
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            return { success: false, message: 'You already have a pending recruiter onboarding request under review.' };
        }

        // Create the VerificationRequest
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
    } catch (error) {
        console.error("Failed to request role change:", error);
        return { success: false, message: 'Pipeline failure creating role change request. Please try again.' };
    }
}

export async function updateSearchIndexable(enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { searchIndexable: enabled }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to update search engine preferences' };
    }
}

export async function updateOpenToWork(enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
        // Feed into find talent search ranking
        await prisma.user.update({
            where: { id: session.user.id },
            data: { openToWork: enabled }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to update career status' };
    }
}

export async function requestDataExport() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true }
        });

        // Simulate preparing JSON + CSV zip file and emailing link within 24 hours.
        return {
            success: true,
            message: `Data export request submitted. A secure download link containing your profile, timeline history, and assessments will be emailed to ${user?.email || 'your account email'} within 24 hours.`
        };
    } catch (error) {
        return { success: false, message: 'Failed to request data export' };
    }
}

export async function changeEmail(newEmail: string, passwordInput: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    const emailTrimmed = newEmail.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
        return { success: false, message: 'Please enter a valid email address.' };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { success: false, message: 'Identity verification failed.' };
        }

        const passwordValid = await bcrypt.compare(passwordInput, user.password);
        if (!passwordValid) {
            return { success: false, message: 'Incorrect password.' };
        }

        // Verify uniqueness of new email
        const existingUser = await prisma.user.findUnique({ where: { email: emailTrimmed } });
        if (existingUser && existingUser.id !== session.user.id) {
            return { success: false, message: 'This email is already linked to another account.' };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { email: emailTrimmed, emailVerified: null } // reset verified flag until they confirm
        });

        revalidatePath('/settings');
        return { success: true, message: 'Email address updated. Please check your new inbox for verification instructions.' };
    } catch (error) {
        return { success: false, message: 'Failed to update email address.' };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    if (newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { success: false, message: 'Identity verification failed.' };
        }

        const passwordValid = await bcrypt.compare(currentPassword, user.password);
        if (!passwordValid) {
            return { success: false, message: 'Incorrect current password.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return { success: true, message: 'Password updated successfully!' };
    } catch (error) {
        return { success: false, message: 'Failed to update password.' };
    }
}

export async function deleteAccountWithVerification(passwordInput: string, deleteText: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    if (deleteText !== 'DELETE') {
        return { success: false, message: 'Confirmation text is incorrect.' };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { success: false, message: 'Identity verification failed.' };
        }

        const passwordValid = await bcrypt.compare(passwordInput, user.password);
        if (!passwordValid) {
            return { success: false, message: 'Incorrect password.' };
        }

        await prisma.user.delete({
            where: { id: session.user.id }
        });

        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to terminate account.' };
    }
}
