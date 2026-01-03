"use client";

import Link from "next/link";
import { QodeeLogo } from "../QodeeLogo";
import { Mail, Twitter, Linkedin, ArrowUpRight, Instagram, Facebook } from "lucide-react";
import { motion } from "framer-motion";

export function PremiumFooter() {
    const footerLinks = {
        product: [
            { label: "AI Interview", href: "/interview" },
            { label: "Find Jobs", href: "/jobs" },
            { label: "Find Talent", href: "/hire/search" },
            { label: "Pricing", href: "/#pricing" }
        ],
        company: [
            { label: "About", href: "/about" },
            { label: "Support", href: "/support" },
            { label: "Feedback", href: "/feedback" },
            { label: "Contact", href: "mailto:support@skilledcore.com" }
        ],
        legal: [
            { label: "Privacy", href: "/legal/privacy-policy" },
            { label: "Terms", href: "/terms" },
            { label: "Security", href: "/legal/security" },
            { label: "Cookies", href: "/legal/cookie-policy" }
        ],
        resources: [
            { label: "Network", href: "/network" },
            { label: "Messages", href: "/messages" },
            { label: "Settings", href: "/settings" },
            { label: "Analytics", href: "/analytics" }
        ]
    };

    return (
        <footer className="relative border-t border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-950/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <QodeeLogo className="w-10 h-10 object-contain" />
                            <div className="flex flex-col">
                                <span className="font-heading font-black tracking-wider text-white text-lg">SKILLED CORE™</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Enterprise Node</span>
                            </div>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6 max-w-xs leading-relaxed">
                            The AI-native infrastructure for connecting exceptional talent with visionary companies.
                        </p>

                        {/* Contact Card */}
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 backdrop-blur-sm"
                        >
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Get in Touch</p>
                            <a
                                href="mailto:support@skilledcore.com"
                                className="flex items-center gap-2 text-white hover:text-violet-400 transition-colors group"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="text-sm font-medium">support@skilledcore.com</span>
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </motion.div>
                    </div>

                    {/* Links sections */}
                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map(link => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map(link => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map(link => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map(link => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <p className="text-xs text-zinc-600">
                            © {new Date().getFullYear()} Skilled Core. All Rights Reserved.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs text-zinc-600">System Status: <span className="text-emerald-500">OPERATIONAL</span></span>
                        </div>
                    </div>

                    {/* Social links */}
                    <div className="flex items-center gap-4">
                        <a
                            href="https://linkedin.com/company/skilledcore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group"
                        >
                            <Linkedin className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        </a>
                        <a
                            href="https://instagram.com/skilledcore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group"
                        >
                            <Instagram className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        </a>
                        <a
                            href="https://www.facebook.com/profile.php?id=61586065347752"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group"
                        >
                            <Facebook className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        </a>
                        <a
                            href="https://www.x.com/SkilledCore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group"
                        >
                            <Twitter className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
