'use server';

import { Resend } from 'resend';
import MessageNotification from '@/components/emails/MessageNotification';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    if (!name || !email || !message) {
        return { error: 'Missing required fields' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Skilled Core <noreply@skilledcore.com>',
            to: ['ahmad@skilledcore.com'],
            subject: `New Message from ${name}`,
            react: MessageNotification({
                senderName: name,
                senderEmail: email,
                messageContent: message
            }) as React.ReactElement,
        });

        if (error) {
            console.error('Resend error:', error);
            return { error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Email sending failed:', error);
        return { error: error.message || 'Failed to send email' };
    }
}
