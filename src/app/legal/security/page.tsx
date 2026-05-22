import type { Metadata } from "next";
import { Shield, Lock, Server, Bell, Search, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Security | SkilledCore",
    description: "SkilledCore's security architecture, data encryption standards, incident response policy, and vulnerability disclosure process.",
    openGraph: {
        title: "Security — SkilledCore",
        description: "Enterprise-grade security posture documentation for SkilledCore.",
        type: "website",
    },
};

const SECTIONS = [
    {
        icon: Lock,
        title: "Data Encryption",
        color: "text-violet-400",
        bg: "bg-violet-500/10 border-violet-500/20",
        content: [
            "All data transmitted between your browser and SkilledCore servers is encrypted using TLS 1.3.",
            "All data at rest — including user profiles, messages, and credentials — is encrypted using AES-256.",
            "User passwords are hashed using bcrypt with a cost factor of 12. We never store plaintext passwords.",
            "Database backups are encrypted and stored in a separate geographic region."
        ]
    },
    {
        icon: Shield,
        title: "Authentication & Session Security",
        color: "text-teal-400",
        bg: "bg-teal-500/10 border-teal-500/20",
        content: [
            "Session tokens are signed with a rotating AUTH_SECRET key using JWT (JSON Web Tokens).",
            "Sessions expire after 30 days of inactivity and are invalidated on password change.",
            "Email verification is required for all new accounts before accessing the platform.",
            "OAuth providers (Google, GitHub) are used only with verified scopes — we never request write access to your accounts.",
            "Two-factor authentication (2FA) is on our roadmap for Q3 2026."
        ]
    },
    {
        icon: Server,
        title: "Infrastructure",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        content: [
            "SkilledCore is deployed on Vercel's global edge network with automatic scaling and DDoS protection.",
            "Our database is hosted on managed PostgreSQL infrastructure with automated daily backups and point-in-time recovery.",
            "We target 99.9% uptime. Planned maintenance windows are announced via our status page.",
            "All API routes are protected by server-side authentication — we do not rely on client-side guards alone.",
            "Content Security Policy (CSP) headers are enforced on all responses to mitigate XSS attacks."
        ]
    },
    {
        icon: Bell,
        title: "Incident Response",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        content: [
            "In the event of a data breach or security incident, affected users will be notified within 72 hours, per GDPR Article 33.",
            "Our incident response team triages security reports within 24 hours of receipt.",
            "Post-incident reports are published for significant security events affecting user data.",
            "We maintain audit logs of all administrative actions with tamper-detection."
        ]
    },
    {
        icon: Search,
        title: "Vulnerability Disclosure",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        content: [
            "We welcome responsible disclosure from security researchers.",
            "To report a security vulnerability, email: security@skilledcore.com",
            "Please include: a description of the vulnerability, steps to reproduce, and your contact information.",
            "We commit to acknowledging your report within 24 hours and providing a fix timeline within 7 days.",
            "We do not pursue legal action against researchers acting in good faith under this policy."
        ]
    }
];

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-transparent text-white">
            {/* Header */}
            <section className="relative py-20 px-4 border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-300 text-sm mb-8">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Security Posture — Last Updated May 2026
                    </div>
                    <h1 className="text-5xl font-heading font-black text-white tracking-tight mb-4">
                        Security at SkilledCore
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                        We take security seriously. Here is a full account of how we protect your data,
                        our infrastructure posture, and how to report vulnerabilities.
                    </p>
                </div>
            </section>

            {/* Security sections */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto space-y-10">
                    {SECTIONS.map(section => (
                        <div key={section.title} className={`p-8 rounded-2xl bg-zinc-900/40 border border-white/5`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-xl ${section.bg} border flex items-center justify-center`}>
                                    <section.icon className={`w-5 h-5 ${section.color}`} />
                                </div>
                                <h2 className="text-xl font-bold text-white">{section.title}</h2>
                            </div>
                            <ul className="space-y-3">
                                {section.content.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-zinc-400 text-sm leading-relaxed">
                                        <span className="text-zinc-600 mt-1">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Roadmap */}
                    <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/5">
                        <h2 className="text-xl font-bold text-white mb-4">Security Roadmap</h2>
                        <div className="space-y-3 text-sm">
                            {[
                                { item: "SOC 2 Type II Certification", date: "Q3 2026", status: "Planned" },
                                { item: "Two-Factor Authentication (TOTP / Passkeys)", date: "Q3 2026", status: "In Progress" },
                                { item: "Advanced rate limiting via Redis", date: "Q2 2026", status: "In Progress" },
                                { item: "Bug Bounty Program", date: "Q4 2026", status: "Planned" },
                            ].map(r => (
                                <div key={r.item} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                                        <span className="text-zinc-300">{r.item}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-zinc-600">{r.date}</span>
                                        <span className={`px-2 py-0.5 rounded-full border text-xs ${r.status === 'In Progress' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 text-center">
                        <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Report a Vulnerability</h2>
                        <p className="text-zinc-400 mb-4 text-sm max-w-md mx-auto">
                            Spotted something? We appreciate responsible disclosure.
                            Please do not publicly disclose vulnerabilities before we have had a chance to address them.
                        </p>
                        <a
                            href="mailto:security@skilledcore.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-300 hover:bg-emerald-600/30 transition-all text-sm font-medium"
                        >
                            security@skilledcore.com
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
