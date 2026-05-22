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
                {/* Outer wrapper to force dark background in all email clients */}
                <Section style={outerWrapper}>
                    <Container style={container}>
                        {/* Header */}
                        <Section style={header}>
                            <Heading style={logo}>SKILLED CORE</Heading>
                        </Section>

                        {/* Content Card */}
                        <Section style={content}>
                            <Text style={greeting}>Hi {userName},</Text>

                            <Text style={paragraph}>
                                You have unread messages waiting for you from <span style={highlight}>{senderText}</span>.
                            </Text>

                            {/* Message Preview Box */}
                            <div style={messageBox}>
                                <Text style={messageText}>
                                    "Hey, are you available for a quick chat?"
                                </Text>
                            </div>

                            <Hr style={hr} />

                            {/* Solid high-contrast action button */}
                            <Button style={button} href="https://skilledcore.com/messages">
                                View Messages
                            </Button>
                        </Section>

                        {/* Footer */}
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

// Premium Obsidian / Tech Noir Styles
const main = {
    backgroundColor: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    margin: '0',
    padding: '0',
};

const outerWrapper = {
    backgroundColor: '#000000',
    width: '100%',
    padding: '40px 0',
};

const container = {
    margin: '0 auto',
    padding: '0 20px',
    maxWidth: '560px',
};

const header = {
    marginBottom: '32px',
    textAlign: 'center' as const,
};

const logo = {
    color: '#FCD34D', // SkilledCore Premium Gold
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    margin: '0',
};

const content = {
    backgroundColor: '#09090b', // Deep Obsidian card background
    border: '1px solid #27272a', // Sleek Zinc-800 border
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8)',
};

const greeting = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff', // Explicitly pure white for high contrast
    marginBottom: '16px',
    margin: '0 0 16px',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#d4d4d8', // Light zinc gray (zinc-300) for excellent contrast
    marginBottom: '24px',
    margin: '0 0 24px',
};

const highlight = {
    color: '#FCD34D', // SkilledCore Premium Gold for emphasis
    fontWeight: '700',
};

const messageBox = {
    backgroundColor: '#18181b', // Dark zinc-900 background
    borderLeft: '4px solid #8B5CF6', // Purple-500 indicator
    padding: '16px 20px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '24px',
    marginTop: '24px',
};

const messageText = {
    margin: '0',
    color: '#e4e4e7', // Very light zinc-200
    fontSize: '15px',
    lineHeight: '22px',
    fontStyle: 'italic',
};

const hr = {
    borderColor: '#27272a',
    margin: '32px 0',
};

const button = {
    backgroundColor: '#8B5CF6', // Solid premium purple
    borderRadius: '12px',
    color: '#ffffff', // Explicit pure white text for perfect legibility
    fontSize: '16px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '14px 24px',
    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
};

const footer = {
    textAlign: 'center' as const,
    paddingTop: '32px',
};

const footerText = {
    fontSize: '12px',
    color: '#52525B', // Darker zinc for secondary footer
    margin: '0',
};
