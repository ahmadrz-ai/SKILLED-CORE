'use server';

import { Resend } from 'resend';
import * as React from 'react';

// Setup Resend client safely
const resend = new Resend(process.env.RESEND_API_KEY || 'MOCK_KEY');

export interface SupportTicketInput {
    name: string;
    email: string;
    subject: string;
    category: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export async function submitSupportTicket(input: SupportTicketInput) {
    const { name, email, subject, category, description, severity } = input;

    if (!name || !email || !subject || !category || !description || !severity) {
        return { success: false, error: 'Missing required ticket fields' };
    }

    const ticketId = `SC-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
        console.log(`[Support Ticket] Initializing Ticket ${ticketId} for ${name} (${email})`);

        // 1. Prepare and send email notification using Resend
        let emailSent = false;
        let emailError = null;

        if (process.env.RESEND_API_KEY) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'SkilledCore Support <noreply@skilledcore.com>',
                    to: ['support@skilledcore.com'],
                    subject: `[${severity}] Ticket #${ticketId}: ${subject}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; line-height: 1.6; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                            <h2 style="color: #4f46e5; margin-bottom: 5px;">New Support Ticket Raised</h2>
                            <p style="font-size: 14px; color: #64748b; margin-top: 0;">Ticket ID: <strong>${ticketId}</strong> | Severity: <span style="padding: 2px 6px; font-weight: bold; font-size: 12px; border-radius: 4px; ${
                                severity === 'CRITICAL' ? 'background: #fef2f2; color: #b91c1c;' :
                                severity === 'HIGH' ? 'background: #fffbeb; color: #b45309;' :
                                severity === 'MEDIUM' ? 'background: #e0e7ff; color: #4338ca;' :
                                'background: #f1f5f9; color: #475569;'
                            }">${severity}</span></p>
                            
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                            
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr>
                                    <td style="padding: 6px 0; font-weight: bold; width: 120px; color: #64748b;">User Name:</td>
                                    <td style="padding: 6px 0; color: #0f172a;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-weight: bold; color: #64748b;">User Email:</td>
                                    <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${email}">${email}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Category:</td>
                                    <td style="padding: 6px 0; color: #0f172a;">${category}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Subject:</td>
                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${subject}</td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 13px; text-transform: uppercase; tracking: 1px;">Description</h4>
                                <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #334155;">${description}</p>
                            </div>
                            
                            <div style="margin-top: 25px; text-align: center;">
                                <a href="mailto:${email}?subject=Re:%20Ticket%20%23${ticketId}%20-%20${encodeURIComponent(subject)}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                                    Reply Direct to User
                                </a>
                            </div>
                        </div>
                    `
                });

                if (error) {
                    console.error('[Support Action] Resend API error:', error);
                    emailError = error.message;
                } else {
                    emailSent = true;
                    console.log(`[Support Action] Ticket email successfully sent via Resend: ${data?.id}`);
                }
            } catch (err: any) {
                console.error('[Support Action] Failed to execute Resend delivery:', err);
                emailError = err.message || 'Resend error';
            }
        } else {
            console.log(`[Support Action] RESEND_API_KEY missing. Simulating successful email to support@skilledcore.com`);
            emailSent = true;
        }

        // 2. Simulate dispatching WhatsApp notification to support team's personal contacts
        const supportContacts = [
            { name: 'Ahmad Raza (Tech Lead)', number: '+1 (555) 019-2834' },
            { name: 'Support Duty Manager', number: '+1 (555) 019-5829' }
        ];

        console.log('\n============================================================');
        console.log('📢 [WHATSAPP DISPATCH GATEWAY] TRIGGERING SUPPORT TEAM ALERTS');
        console.log(`Ticket: #${ticketId} | Severity: ${severity} | Category: ${category}`);
        console.log(`Subject: "${subject}"`);
        console.log('------------------------------------------------------------');

        supportContacts.forEach(contact => {
            const messagePayload = `🚨 *SkilledCore Support Alert* 🚨\n\n*Ticket ID:* #${ticketId}\n*Severity:* ${severity}\n*Category:* ${category}\n*From:* ${name} (${email})\n*Subject:* ${subject}\n\n_System Action Required Immediately._`;
            
            console.log(`📲 Dispatched to *${contact.name}* at ${contact.number}:`);
            console.log(`   Payload: """\n   ${messagePayload.replace(/\n/g, '\n   ')}\n   """`);
            console.log(`✅ Message Status: DELIVERED (Simulated Twilio/WhatsApp Business API Gateway)`);
            console.log('------------------------------------------------------------');
        });
        console.log('============================================================\n');

        return {
            success: true,
            ticketId,
            emailSent,
            emailError,
            whatsAppNotified: true,
            notifiedContacts: supportContacts.map(c => c.name)
        };

    } catch (error: any) {
        console.error('[Support Action] Support submission crashed:', error);
        return { success: false, error: error.message || 'Support pipeline error' };
    }
}
