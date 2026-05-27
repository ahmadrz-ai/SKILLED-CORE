'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
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
