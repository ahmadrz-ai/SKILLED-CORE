"use client";

import Link from "next/link";
import Image from "next/image";
import { SocialIcon } from "@/components/shared/SocialIcon";

const FOOTER_LINKS = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How It Works", href: "#solutions" },
    { label: "Interactive Demo", href: "#platform" },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
    { label: "Support", href: "/support" },
    { label: "About Us", href: "/about" },
    { label: "Feedback", href: "/feedback" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "User Agreement", href: "/legal/user-agreement" },
    { label: "Cookie Policy", href: "/legal/cookie-policy" },
    { label: "Copyright Policy", href: "/legal/copyright-policy" },
    { label: "Security", href: "/legal/security" },
    { label: "Accessibility", href: "/accessibility" },
  ],
};

const SOCIAL_LINKS = [
  {
    name: "Twitter / X",
    href: "https://x.com",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
  },
  {
    name: "GitHub",
    href: "https://github.com",
  },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-slate-200/90" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer */}
        <div className="pt-16 pb-12 grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <Image
                src="/logo.png"
                alt="SkilledCore"
                width={36}
                height={36}
                className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
              />
              <span style={{ color: "#1E1B4B", fontWeight: 800, fontSize: "17px", letterSpacing: "-0.02em" }}>
                SkilledCore
              </span>
            </Link>
            <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.7 }} className="mb-6 font-medium">
              The unified talent intelligence platform for smarter hiring, custom sandboxed verification, and accelerated engineering discovery.
            </p>

            {/* Social Links */}
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="block shrink-0"
                >
                  <SocialIcon platform={s.name} className="w-9 h-9 hover:bg-sc-purple-650 [&_svg]:hover:text-white transition-all duration-200" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="col-span-1 md:col-span-2">
              <h4 style={{ color: "#1E1B4B", fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }} className="mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{ color: "#475569", fontSize: "14px" }}
                      className="transition-colors duration-150 font-medium hover:text-[#4A28C9]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-2">
            <h4 style={{ color: "#1E1B4B", fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }} className="mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:contact@skilledcore.com"
                  style={{ color: "#475569", fontSize: "14px" }}
                  className="transition-colors duration-150 font-medium hover:text-[#4A28C9]"
                >
                  contact@skilledcore.com
                </a>
              </li>
              <li>
                <Link
                  href="/support"
                  style={{ color: "#475569", fontSize: "14px" }}
                  className="transition-colors duration-150 font-medium hover:text-[#4A28C9]"
                >
                  Support Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="py-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <p style={{ color: "#64748B", fontSize: "13px", fontWeight: 555 }}>
            © {new Date().getFullYear()} SkilledCore. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/legal/privacy-policy" style={{ color: "#64748B", fontSize: "13px" }} className="transition-colors font-medium hover:text-[#4A28C9]">Privacy</Link>
            <Link href="/legal/user-agreement" style={{ color: "#64748B", fontSize: "13px" }} className="transition-colors font-medium hover:text-[#4A28C9]">Terms</Link>
            <Link href="/accessibility" style={{ color: "#64748B", fontSize: "13px" }} className="transition-colors font-medium hover:text-[#4A28C9]">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
