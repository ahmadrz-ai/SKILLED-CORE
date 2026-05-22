"use client";

import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How It Works", href: "#solutions" },
    { label: "For Recruiters", href: "/register?role=recruiter" },
    { label: "For Candidates", href: "/register?role=candidate" },
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
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  },
  {
    name: "GitHub",
    href: "https://github.com",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    )
  },
];

export function LandingFooter() {
  return (
    <footer className="landing-dark" style={{ background: "#090817" }}>
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
                className="flex-shrink-0"
              />
              <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.01em" }}>SkilledCore</span>
            </Link>
            <p style={{ color: "#7C8DB0", fontSize: "14px", lineHeight: 1.7 }} className="mb-6">
              The unified platform for smarter hiring, skill assessments, and talent development. Built for teams that value clarity and efficiency.
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
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#7C8DB0" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(124,58,237,0.15)";
                    e.currentTarget.style.color = "#C4B5FD";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#7C8DB0";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="col-span-1 md:col-span-2">
              <h4 style={{ color: "#E2E8F0", fontWeight: 600, fontSize: "13px", letterSpacing: "0.04em", textTransform: "uppercase" }} className="mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{ color: "#7C8DB0", fontSize: "14px" }}
                      className="transition-colors duration-150 hover:!text-white"
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
            <h4 style={{ color: "#E2E8F0", fontWeight: 600, fontSize: "13px", letterSpacing: "0.04em", textTransform: "uppercase" }} className="mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:contact@skilledcore.com"
                  style={{ color: "#7C8DB0", fontSize: "14px" }}
                  className="transition-colors duration-150 hover:!text-white"
                >
                  contact@skilledcore.com
                </a>
              </li>
              <li>
                <Link
                  href="/support"
                  style={{ color: "#7C8DB0", fontSize: "14px" }}
                  className="transition-colors duration-150 hover:!text-white"
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
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p style={{ color: "#4B5C78", fontSize: "13px" }}>
            © {new Date().getFullYear()} SkilledCore. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/legal/privacy-policy" style={{ color: "#4B5C78", fontSize: "13px" }} className="transition-colors hover:!text-slate-300">Privacy</Link>
            <Link href="/legal/user-agreement" style={{ color: "#4B5C78", fontSize: "13px" }} className="transition-colors hover:!text-slate-300">Terms</Link>
            <Link href="/accessibility" style={{ color: "#4B5C78", fontSize: "13px" }} className="transition-colors hover:!text-slate-300">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
