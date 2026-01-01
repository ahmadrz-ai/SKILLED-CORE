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
    userName,
    senderNames = [],
}: RetentionEmailProps) => {
    const senderText = senderNames.slice(0, 3).join(', ') + (senderNames.length > 3 ? ` and ${senderNames.length - 3} others` : '');
    const previewText = `You have unread messages from ${senderText}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>SKILLED CORE</Heading>
                    </Section>

                    <Section style={content}>
                        <Text style={greeting}>Hi {userName},</Text>

                        <Text style={paragraph}>
                            You have unread messages waiting for you from <span style={highlight}>{senderText}</span>.
                        </Text>

                        <div style={messageBox}>
                            <Text style={messageText}>
                                "Hey, are you available for a quick chat?"
                            </Text>
                        </div>

                        <Hr style={hr} />

                        <Button style={button} href="https://skilledcore.com/messages">
                            View Messages
                        </Button>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Skilled Core. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default RetentionEmail;

// Styles
const main = {
    backgroundColor: '#000000',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '560px',
};

const header = {
    marginBottom: '32px',
    textAlign: 'center' as const,
};

const logo = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '0.2em',
    margin: '0',
    textTransform: 'uppercase' as const,
    textShadow: '0 0 10px rgba(255,255,255,0.3)',
};

const content = {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1F1F1F',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
    background: 'linear-gradient(145deg, #111111, #050505)',
};

const greeting = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '16px',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#A1A1AA', // Zinc-400
    marginBottom: '24px',
};

const highlight = {
    color: '#E879F9', // Purple-400 equivalent or similar
    fontWeight: '600',
};

const messageBox = {
    backgroundColor: '#1E1E1E',
    borderLeft: '4px solid #8B5CF6', // Purple-500
    padding: '16px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '24px',
};

const messageText = {
    margin: '0',
    color: '#D4D4D8', // Zinc-300
    fontStyle: 'italic',
};

const hr = {
    borderColor: '#1F1F1F',
    margin: '32px 0',
};

const button = {
    backgroundColor: '#8B5CF6', // Purple-500
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
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
    color: '#52525B', // Zinc-600
};
