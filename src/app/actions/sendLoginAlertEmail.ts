'use server';

import { Resend } from 'resend';
import LoginAlertEmail from '@/components/emails/LoginAlertEmail';
import * as React from 'react';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendLoginAlertParams {
    email: string;
    username: string;
    device: string;
    location: string;
    ipAddress: string;
}

/**
 * Parses user agent string to extract human-friendly device & browser description
 * matches format: e.g. "ChromeDesktop on Windows", "SafariMobile on iOS"
 */
export async function parseUserAgent(uaString: string): Promise<{ device: string }> {
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    const ua = uaString.toLowerCase();

    // 1. Detect OS
    if (ua.includes('windows')) {
        os = 'Windows';
    } else if (ua.includes('macintosh') || ua.includes('mac os x') || ua.includes('mac_powerpc')) {
        os = 'macOS';
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        os = 'iOS';
    } else if (ua.includes('android')) {
        os = 'Android';
    } else if (ua.includes('linux')) {
        os = 'Linux';
    }

    // 2. Detect Browser
    if (ua.includes('edg/')) {
        browser = 'Edge';
    } else if (ua.includes('opr/') || ua.includes('opera')) {
        browser = 'Opera';
    } else if (ua.includes('chrome') || ua.includes('crios')) {
        browser = 'Chrome';
    } else if (ua.includes('firefox') || ua.includes('fxios')) {
        browser = 'Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) {
        browser = 'Safari';
    }

    // 3. Format device style
    const isMobile = ua.includes('mobile') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('android');
    const deviceType = isMobile ? 'Mobile' : 'Desktop';

    return {
        device: `${browser}${deviceType} on ${os}`,
    };
}

/**
 * Triggers the login alert security email immediately upon successful user login.
 */
export async function sendLoginAlertEmail({
    email,
    username,
    device,
    location,
    ipAddress,
}: SendLoginAlertParams) {
    if (!email) {
        console.error('Error: sendLoginAlertEmail failed because email was missing.');
        return { error: 'Missing target email address' };
    }

    try {
        // Query database to check user's email notification preferences
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { emailNotifications: true }
        });

        if (user && user.emailNotifications === false) {
            console.log(`[Login Alert] Bypassed security alert email to ${email} as user has disabled Security Alerts.`);
            return { success: true, message: 'Bypassed due to user preferences' };
        }
        console.log(`[Login Alert] Dispatching security email to ${email} (User: @${username})`);
        console.log(`[Login Alert] Parameters: Device = ${device}, Location = ${location}, IP = ${ipAddress}`);

        const { data, error } = await resend.emails.send({
            from: 'Skilled Core <noreply@skilledcore.com>',
            to: [email],
            subject: `New login to SkilledCore from ${device}`,
            react: LoginAlertEmail({
                username,
                location,
                device,
                ipAddress,
            }) as React.ReactElement,
        });

        if (error) {
            console.error('[Login Alert] Resend SDK returned an error:', error);
            return { error: error.message };
        }

        console.log('[Login Alert] Email sent successfully. Resend ID:', data?.id);
        return { success: true, data };
    } catch (err: any) {
        console.error('[Login Alert] Unhandled exception occurred while sending email:', err);
        return { error: err?.message || 'Failed to dispatch security notification' };
    }
}
