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
                {/* Outer wrapper to force dark background in all email clients */}
                <Section style={outerWrapper}>
                    <Container style={container}>
                        {/* Header */}
                        <Section style={header}>
                            <Heading style={logo}>SKILLED CORE</Heading>
                        </Section>

                        {/* Main Content Card */}
                        <Section style={content}>
                            <Heading style={h1}>
                                We noticed a login to your account @{username} from a new device. Was this you?
                            </Heading>

                            {/* Metadata Details Table */}
                            <Section style={detailsContainer}>
                                <Heading style={detailsHeader}>New login</Heading>
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
                                    You can ignore this message. There's no need to take any action.
                                </Text>
                            </Section>

                            <Section style={actionSection}>
                                <Text style={actionTitle}>If this wasn't you</Text>
                                <Text style={actionBody}>
                                    Complete these steps now to protect your account.
                                </Text>
                                
                                <ul style={bulletList}>
                                    <li style={bulletItem}>
                                        <Link href="https://skilledcore.com/settings" style={blueLink}>
                                            Change your password.
                                        </Link>{' '}
                                        You'll be logged out of all your active SkilledCore sessions except the one you're using at this time.
                                    </li>
                                    <li style={bulletItem}>
                                        <Link href="https://skilledcore.com/settings" style={blueLink}>
                                            Review the apps
                                        </Link>{' '}
                                        that have access to your account and revoke access to any unfamiliar apps.{' '}
                                        <Link href="https://skilledcore.com/settings" style={blueLink}>
                                            Learn more.
                                        </Link>
                                    </li>
                                </ul>
                            </Section>

                            <Hr style={hr} />

                            {/* Footer Links */}
                            <Section style={footerLinksContainer}>
                                <Link href="https://skilledcore.com/support" style={footerLink}>
                                    Help
                                </Link>
                                <span style={footerSeparator}> | </span>
                                <Link href="https://skilledcore.com/legal/security" style={footerLink}>
                                    Email security tips
                                </Link>
                            </Section>

                            {/* Legal Disclaimers */}
                            <Section style={legalContainer}>
                                <Text style={legalText}>
                                    We sent this email to @{username}
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

// Premium Tech Noir / Obsidian Theme Styles
const main = {
    backgroundColor: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    padding: '20px 0',
    textAlign: 'center' as const,
};

const logo = {
    color: '#FCD34D', // Premium SkilledCore Gold
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    margin: '0',
};

const content = {
    backgroundColor: '#09090b', // Deep Dark Obsidian Grey
    border: '1px solid #27272a', // Subtle zinc border
    borderRadius: '8px',
    padding: '40px 30px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
};

const h1 = {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '28px',
    margin: '0 0 24px',
};

const detailsContainer = {
    backgroundColor: '#18181b', // Zinc-900 background for details
    border: '1px solid #27272a',
    borderRadius: '6px',
    padding: '20px',
    marginBottom: '24px',
};

const detailsHeader = {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 16px',
};

const table = {
    width: '100%',
    borderCollapse: 'collapse' as const,
};

const labelCell = {
    color: '#a1a1aa', // Zinc-400
    fontSize: '14px',
    padding: '6px 0',
    width: '120px',
    verticalAlign: 'top' as const,
};

const valueCell = {
    color: '#ffffff',
    fontSize: '14px',
    padding: '6px 0',
    verticalAlign: 'top' as const,
};

const legendText = {
    color: '#71717a', // Zinc-500
    fontSize: '11px',
    margin: '12px 0 0',
    lineHeight: '16px',
};

const actionSection = {
    marginBottom: '24px',
};

const actionTitle = {
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 8px',
};

const actionBody = {
    color: '#a1a1aa',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 8px',
};

const bulletList = {
    margin: '0',
    paddingLeft: '20px',
    color: '#a1a1aa',
};

const bulletItem = {
    fontSize: '14px',
    lineHeight: '22px',
    marginBottom: '10px',
};

const blueLink = {
    color: '#3b82f6', // Premium blue for hyperlinks
    textDecoration: 'underline',
};

const hr = {
    borderColor: '#27272a',
    margin: '30px 0',
};

const footerLinksContainer = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const footerLink = {
    color: '#3b82f6',
    fontSize: '13px',
    textDecoration: 'none',
};

const footerSeparator = {
    color: '#27272a',
    fontSize: '13px',
};

const legalContainer = {
    textAlign: 'center' as const,
};

const legalText = {
    color: '#71717a',
    fontSize: '12px',
    margin: '0 0 8px',
};

const legalAddress = {
    color: '#52525b', // Zinc-600
    fontSize: '11px',
    lineHeight: '16px',
    margin: '0',
};
