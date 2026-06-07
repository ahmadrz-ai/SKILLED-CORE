"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Why SkilledCore", href: "#why" },
  { label: "How It Works", href: "#how" },
  { label: "Interactive Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="SkilledCore"
              width={36}
              height={36}
              priority
              className="flex-shrink-0 w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-[#1E1B4B] font-bold text-lg tracking-tight leading-none">
              SkilledCore
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-[#1E1B4B] hover:bg-slate-50 transition-all duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-[#1E1B4B] transition-colors rounded-lg"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                background: "var(--sc-purple-600)",
                color: "#FFFFFF",
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1E1B4B] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-center rounded-lg transition-colors"
                style={{ background: "var(--sc-purple-600)", color: "#FFFFFF" }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
