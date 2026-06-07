import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface LoginAlertEmailProps {
    username: string;
    location: string;
    device: string;
    ipAddress: string;
}

export const LoginAlertEmail = ({
    username = 'User',
    location = 'Unknown Location',
    device = 'Unknown Device',
    ipAddress = '127.0.0.1',
}: LoginAlertEmailProps) => {
    const previewText = `New login to SkilledCore from ${device}`;

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
                            <Heading style={h1}>
                                We noticed a login to your account @{username} from a new device. Was this you?
                            </Heading>

                            {/* Metadata Details Table Section */}
                            <Section style={detailsContainer}>
                                <Heading style={detailsHeader}>New login details</Heading>
                                <table style={table}>
                                    <tbody>
                                        <tr>
                                            <td style={labelCell}><strong>Location*</strong></td>
                                            <td style={valueCell}>{location}</td>
                                        </tr>
                                        <tr>
                                            <td style={labelCell}><strong>Device</strong></td>
                                            <td style={valueCell}>{device}</td>
                                        </tr>
                                        <tr>
                                            <td style={labelCell}><strong>IP Address</strong></td>
                                            <td style={valueCell}>{ipAddress}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <Text style={legendText}>
                                    *Location is approximate based on the login's IP address.
                                </Text>
                            </Section>

                            {/* Action Options */}
                            <Section style={actionSection}>
                                <Text style={actionTitle}>If this was you</Text>
                                <Text style={actionBody}>
                                    You can safely ignore this message. There's no need to take any action.
                                </Text>
                            </Section>

                            <Section style={actionSection}>
                                <Text style={actionTitle}>If this wasn't you</Text>
                                <Text style={actionBody}>
                                    Please complete these steps immediately to protect your account:
                                </Text>
                                
                                <ul style={bulletList}>
                                    <li style={bulletItem}>
                                        <Link href="https://skilledcore.com/settings" style={indigoLink}>
                                            Change your password
                                        </Link>
                                        {' '}to log out of all active SkilledCore sessions except the current one.
                                    </li>
                                    <li style={bulletItem}>
                                        <Link href="https://skilledcore.com/settings" style={indigoLink}>
                                            Review authorized apps
                                        </Link>
                                        {' '}that have access to your account and revoke access to any unfamiliar devices or services.{' '}
                                        <Link href="https://skilledcore.com/settings" style={indigoLink}>
                                            Learn more
                                        </Link>
                                        .
                                    </li>
                                </ul>
                            </Section>

                            <Hr style={hr} />

                            {/* Footer Links */}
                            <Section style={footerLinksContainer}>
                                <Link href="https://skilledcore.com/support" style={footerLink}>
                                    Help Center
                                </Link>
                                <span style={footerSeparator}> | </span>
                                <Link href="https://skilledcore.com/legal/security" style={footerLink}>
                                    Email Security Tips
                                </Link>
                            </Section>

                            {/* Legal Disclaimers */}
                            <Section style={legalContainer}>
                                <Text style={legalText}>
                                    We sent this notification to protect your account @{username}
                                </Text>
                                <Text style={legalAddress}>
                                    SkilledCore Inc., 1355 Market Street, Suite 900, San Francisco, CA 94103
                                </Text>
                            </Section>
                        </Section>
                    </Container>
                </Section>
            </Body>
        </Html>
    );
};

export default LoginAlertEmail;

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
    color: '#0f172a', // Slate-900 header
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '26px',
    margin: '0 0 24px',
};

const detailsContainer = {
    backgroundColor: '#f8fafc', // Light slate-50 box
    border: '1px solid #e2e8f0', // Soft border
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
};

const detailsHeader = {
    color: '#0f172a', // Slate-900 details heading
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 12px',
};

const table = {
    width: '100%',
    borderCollapse: 'collapse' as const,
};

const labelCell = {
    color: '#64748b', // Slate-500 labels
    fontSize: '14px',
    padding: '6px 0',
    width: '120px',
    verticalAlign: 'top' as const,
};

const valueCell = {
    color: '#0f172a', // Slate-900 values
    fontSize: '14px',
    padding: '6px 0',
    fontWeight: '500',
    verticalAlign: 'top' as const,
};

const legendText = {
    color: '#94a3b8', // Slate-400 legend
    fontSize: '11px',
    margin: '12px 0 0',
    lineHeight: '16px',
};

const actionSection = {
    marginBottom: '24px',
};

const actionTitle = {
    color: '#0f172a', // Slate-900 title
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 8px',
};

const actionBody = {
    color: '#334155', // Slate-700 description
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 8px',
};

const bulletList = {
    margin: '0',
    paddingLeft: '20px',
    color: '#334155',
};

const bulletItem = {
    fontSize: '14px',
    lineHeight: '22px',
    marginBottom: '10px',
};

const indigoLink = {
    color: '#4A28C9', // Sleek Indigo accent
    fontWeight: '600',
    textDecoration: 'underline',
};

const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0',
};

const footerLinksContainer = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const footerLink = {
    color: '#4A28C9', // Corporate Indigo-600 link
    fontSize: '13px',
    textDecoration: 'none',
    fontWeight: '600',
};

const footerSeparator = {
    color: '#e2e8f0',
    fontSize: '13px',
};

const legalContainer = {
    textAlign: 'center' as const,
};

const legalText = {
    color: '#94a3b8', // Slate-400 legal disclaimer
    fontSize: '12px',
    margin: '0 0 8px',
};

const legalAddress = {
    color: '#64748b', // Slate-500 address
    fontSize: '11px',
    lineHeight: '16px',
    margin: '0',
};
