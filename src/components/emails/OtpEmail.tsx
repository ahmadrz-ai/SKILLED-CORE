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
    return (
        <Html>
            <Head />
            <Preview>Your verification code: {validationCode}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>SKILLED CORE</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Authentication Required</Heading>
                        <Text style={paragraph}>
                            Enter the following code to verify your identity.
                        </Text>

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
            </Body>
        </Html>
    );
};

export default OtpEmail;

// Styles - Tech Noir / Obsidian
const main = {
    backgroundColor: '#000000',
    fontFamily: 'monospace', // Tech feel
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
    color: '#FCD34D', // Gold
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    margin: '0',
};

const content = {
    backgroundColor: '#111111',
    border: '1px solid #333333',
    borderRadius: '4px',
    padding: '40px',
    boxShadow: '0 0 20px rgba(252, 211, 77, 0.1)', // Subtle gold glow
};

const h1 = {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 'normal',
    letterSpacing: '0.05em',
    margin: '0 0 20px',
    textTransform: 'uppercase' as const,
};

const paragraph = {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#9CA3AF', // Gray-400
    marginBottom: '20px',
};

const codeContainer = {
    padding: '20px',
    backgroundColor: '#000000',
    border: '1px dashed #FCD34D',
    textAlign: 'center' as const,
    marginTop: '20px',
    marginBottom: '20px',
};

const code = {
    color: '#FCD34D', // Gold
    fontSize: '32px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: '10px',
    margin: '0',
};

const warning = {
    fontSize: '12px',
    color: '#EF4444', // Red-500
    textAlign: 'center' as const,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
};

const hr = {
    borderColor: '#333333',
    margin: '30px 0',
};

const footerText = {
    fontSize: '10px',
    color: '#4B5563', // Gray-600
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
};
