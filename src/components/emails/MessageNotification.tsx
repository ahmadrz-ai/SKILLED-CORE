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

interface MessageNotificationProps {
    senderName: string;
    senderEmail: string;
    messageContent: string;
    actionUrl: string;
}

export const MessageNotification = ({
    senderName = 'Someone',
    senderEmail = 'noreply@skilledcore.com',
    messageContent = '',
    actionUrl = '#',
}: MessageNotificationProps) => {
    const previewText = `New message from ${senderName}`;

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
                            <Text style={paragraph}>
                                You have a new message from <strong style={whiteText}>{senderName}</strong>. Click below to reply.
                            </Text>

                            <Hr style={hr} />

                            {/* Message Quote Box */}
                            <div style={messageBox}>
                                <Text style={messageText}>
                                    "{messageContent}"
                                </Text>
                            </div>

                            <Hr style={hr} />

                            {/* Action Button */}
                            <Button style={button} href={actionUrl}>
                                Reply to Message
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

export default MessageNotification;

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

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#d4d4d8', // Light zinc gray (zinc-300) for excellent contrast
    marginBottom: '0',
    marginTop: '0',
};

const whiteText = {
    color: '#ffffff',
    fontWeight: '700',
};

const messageBox = {
    backgroundColor: '#18181b', // Dark zinc-900 background
    borderLeft: '4px solid #FCD34D', // Gold indicator
    padding: '16px 20px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '24px',
    marginTop: '24px',
};

const messageText = {
    margin: '0',
    color: '#e4e4e7', // Very light zinc-200
    fontSize: '16px',
    lineHeight: '26px',
    fontStyle: 'italic',
};

const hr = {
    borderColor: '#27272a',
    margin: '24px 0',
};

const button = {
    backgroundColor: '#FCD34D', // Solid gold button
    borderRadius: '12px',
    color: '#000000', // Deep black text for perfect readability on gold
    fontSize: '16px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '14px 24px',
    boxShadow: '0 4px 14px rgba(252, 211, 77, 0.25)',
};

const footer = {
    textAlign: 'center' as const,
    paddingTop: '32px',
};

const footerText = {
    fontSize: '12px',
    color: '#52525B', // Zinc-600 secondary footer
    margin: '0',
};
