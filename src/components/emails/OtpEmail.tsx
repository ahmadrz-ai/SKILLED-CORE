import {
    Body,
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

interface OtpEmailProps {
    validationCode: string;
}

export const OtpEmail = ({ validationCode = '123456' }: OtpEmailProps) => {
    const previewText = `Your verification code: ${validationCode}`;

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
                            <Heading style={h1}>Authentication Required</Heading>
                            <Text style={paragraph}>
                                Enter the following code to verify your identity.
                            </Text>

                            {/* Verification Code Box */}
                            <Section style={codeContainer}>
                                <Text style={code}>{validationCode}</Text>
                            </Section>

                            <Text style={warning}>
                                This code expires in 10 minutes.
                            </Text>

                            <Hr style={hr} />

                            <Text style={footerText}>
                                If you did not request this code, secure your account immediately.
                            </Text>
                        </Section>
                    </Container>
                </Section>
            </Body>
        </Html>
    );
};

export default OtpEmail;

// Premium Obsidian / Tech Noir Styles
const main = {
    backgroundColor: '#000000',
    fontFamily: 'monospace', // Dedicated tech-noir feel
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

const h1 = {
    color: '#ffffff', // High-contrast white
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '0.05em',
    margin: '0 0 20px',
    textTransform: 'uppercase' as const,
};

const paragraph = {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#d4d4d8', // High-contrast light grey
    marginBottom: '20px',
    margin: '0 0 20px',
};

const codeContainer = {
    padding: '24px',
    backgroundColor: '#18181b', // Zinc-900 background for OTP
    border: '1px dashed #FCD34D', // Gold dashed outline
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginTop: '24px',
    marginBottom: '24px',
};

const code = {
    color: '#FCD34D', // SkilledCore Premium Gold
    fontSize: '36px',
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: '10px',
    margin: '0',
};

const warning = {
    fontSize: '12px',
    color: '#ef4444', // Red-500 for important security alerts
    textAlign: 'center' as const,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0',
};

const hr = {
    borderColor: '#27272a',
    margin: '30px 0',
};

const footerText = {
    fontSize: '11px',
    color: '#71717a', // Zinc-500 secondary text
    textAlign: 'center' as const,
    lineHeight: '16px',
    margin: '0',
};
