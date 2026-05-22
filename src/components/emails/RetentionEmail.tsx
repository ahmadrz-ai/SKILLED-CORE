import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface RetentionEmailProps {
    userName: string;
    senderNames?: string[];
}

export const RetentionEmail = ({
    userName = 'Skilled Core User',
    senderNames = [],
}: RetentionEmailProps) => {
    const senderText = senderNames.length > 0 
        ? senderNames.slice(0, 3).join(', ') + (senderNames.length > 3 ? ` and ${senderNames.length - 3} others` : '')
        : 'another user';
        
    const previewText = `You have unread messages from ${senderText}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                {/* Clean, professional outer background wrapper */}
                <Section style={outerWrapper}>
                    <Container style={container}>
                        {/* Header Branding */}
                        <Section style={header}>
                            <Heading style={logo}>SKILLED CORE</Heading>
                        </Section>

                        {/* White Content Card with Slate Borders */}
                        <Section style={content}>
                            <Text style={greeting}>Hi {userName},</Text>

                            <Text style={paragraph}>
                                You have unread messages waiting for you from <span style={highlight}>{senderText}</span>.
                            </Text>

                            {/* Elegant Message Preview Box */}
                            <div style={messageBox}>
                                <Text style={messageText}>
                                    "Hey, are you available for a quick chat?"
                                </Text>
                            </div>

                            <Hr style={hr} />

                            {/* Solid high-contrast indigo action button */}
                            <Button style={button} href="https://skilledcore.com/messages">
                                View Messages
                            </Button>
                        </Section>

                        {/* Minimalist Corporate Footer */}
                        <Section style={footer}>
                            <Text style={footerText}>
                                © {new Date().getFullYear()} Skilled Core. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Section>
            </Body>
        </Html>
    );
};

export default RetentionEmail;

// SaaS Professional Light Styles
const main = {
    backgroundColor: '#f8fafc', // Soft slate-50 background frame
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: '0',
    padding: '0',
};

const outerWrapper = {
    backgroundColor: '#f8fafc',
    width: '100%',
    padding: '40px 0',
};

const container = {
    margin: '0 auto',
    padding: '0 20px',
    maxWidth: '560px',
};

const header = {
    marginBottom: '24px',
    textAlign: 'center' as const,
};

const logo = {
    color: '#0f172a', // Sleek dark slate branding
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    margin: '0',
};

const content = {
    backgroundColor: '#ffffff', // Clean pure white card
    border: '1px solid #e2e8f0', // Crisp slate border
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025)',
};

const greeting = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a', // Clear Slate-900 greeting
    marginBottom: '16px',
    margin: '0 0 16px',
};

const paragraph = {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#334155', // Slate-700 body text for ultimate readability
    marginBottom: '24px',
    margin: '0 0 24px',
};

const highlight = {
    color: '#4f46e5', // Corporate Indigo-600 highlight
    fontWeight: '700',
};

const messageBox = {
    backgroundColor: '#f8fafc', // Light slate-50 message background
    borderLeft: '4px solid #4f46e5', // Indigo indicator bar
    padding: '16px 20px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '24px',
    marginTop: '24px',
};

const messageText = {
    margin: '0',
    color: '#475569', // Medium slate-600 message text
    fontSize: '14px',
    lineHeight: '22px',
    fontStyle: 'italic',
};

const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0',
};

const button = {
    backgroundColor: '#4f46e5', // Professional Indigo background
    borderRadius: '8px',
    color: '#ffffff', // Pure white text
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
};

const footer = {
    textAlign: 'center' as const,
    paddingTop: '24px',
};

const footerText = {
    fontSize: '12px',
    color: '#94a3b8', // Subtle slate-400 footer text
    margin: '0',
};
