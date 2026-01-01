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
}

export const RetentionEmail = ({
    userName,
}: RetentionEmailProps) => {
    const previewText = `We miss you at Skilled Core`;

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
                        <Text style={paragraph}>Hi {userName},</Text>

                        <Text style={paragraph}>
                            We noticed you haven't checked your dashboard in a while. You might be missing opportunities.
                        </Text>

                        <Hr style={hr} />

                        <Button style={button} href="https://skilledcore.com/feed">
                            See What's New
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
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const header = {
    padding: '20px 0',
    textAlign: 'center' as const,
};

const logo = {
    color: '#FCD34D', // Amber-300 / Gold
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    margin: '0',
    textTransform: 'uppercase' as const,
};

const content = {
    backgroundColor: '#111111',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#E5E7EB', // Gray-200
    marginBottom: '20px',
};

const hr = {
    borderColor: '#333333',
    margin: '20px 0',
};

const button = {
    backgroundColor: '#FCD34D', // Gold
    borderRadius: '8px',
    color: '#000000', // Black text on Gold
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 20px',
    marginTop: '20px',
};

const footer = {
    textAlign: 'center' as const,
    paddingTop: '20px',
};

const footerText = {
    fontSize: '12px',
    color: '#6B7280', // Gray-500
};
