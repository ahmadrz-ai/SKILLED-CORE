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
                {/* Clean, professional outer background wrapper */}
                <Section style={outerWrapper}>
                    <Container style={container}>
                        {/* Header Branding */}
                        <Section style={header}>
                            <Heading style={logo}>SKILLED CORE</Heading>
                        </Section>

                        {/* White Content Card with Slate Borders */}
                        <Section style={content}>
                            <Heading style={h1}>Authentication Required</Heading>
                            
                            <Text style={paragraph}>
                                Enter the following code to verify your identity and complete your login.
                            </Text>

                            {/* Elegant Verification Code Box */}
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

const h1 = {
    color: '#0f172a', // Clear Slate-900 title
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '28px',
    margin: '0 0 16px',
    textAlign: 'center' as const,
};

const paragraph = {
    fontSize: '15px',
    lineHeight: '24px',
    color: '#334155', // Slate-700 body text for ultimate readability
    marginBottom: '24px',
    marginTop: '0',
    textAlign: 'center' as const,
};

const codeContainer = {
    padding: '24px 0',
    backgroundColor: '#f8fafc', // Light slate-50 background for OTP
    border: '1px solid #e2e8f0', // Soft border
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginTop: '24px',
    marginBottom: '24px',
};

const code = {
    color: '#0f172a', // Sleek Slate-900 code
    fontSize: '36px',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
    fontWeight: '700',
    letterSpacing: '8px',
    margin: '0',
};

const warning = {
    fontSize: '13px',
    color: '#b91c1c', // Soft, high-contrast professional red-700
    textAlign: 'center' as const,
    fontWeight: '600',
    margin: '0',
};

const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0',
};

const footerText = {
    fontSize: '12px',
    color: '#64748b', // Slate-500 secondary text
    textAlign: 'center' as const,
    lineHeight: '18px',
    margin: '0',
};
