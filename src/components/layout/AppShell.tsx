"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RealtimeBadgeProvider } from "@/components/realtime/RealtimeBadgeProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  counts?: {
    network?: number;
    messages?: number;
    notifications?: number;
    jobs?: number;
    learning?: number;
    analytics?: boolean;
    salary?: boolean;
  };
  plan?: string;
  credits?: number;
  userId?: string;
  companySlug?: string;
}

export function AppShell({ children, counts, plan = "BASIC", credits = 0, userId, companySlug }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Live badge counts now live in RealtimeBadgeProvider (Ably-backed, seeded from
  // the server `counts`), consumed by the Sidebar + bell via useBadges().

  // Auto-collapse logic per Correction 3
  const getInitialCollapseState = (path: string) => {
    const autoCollapseRoutes = [
      '/messages',
      '/analytics',
      '/hire',            // candidate search page
      '/jobs/create',
      '/search',
    ];

    const isAutoCollapsed =
      autoCollapseRoutes.includes(path) ||
      path.startsWith('/admin') ||
      path.startsWith('/hire/search') ||
      path.startsWith('/assessments/');

    if (isAutoCollapsed) return true;

    // Fallback to localStorage if available
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem("sc-sidebar-collapsed");
      if (persisted !== null) {
        return persisted === "true";
      }
    }
    return false;
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize and sync sidebar state on mount and route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCollapsed(getInitialCollapseState(pathname));
  }, [pathname]);

  const handleToggle = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sc-sidebar-collapsed", String(nextState));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileOpen(false);
  }, [pathname]);

  // Mode Detection (Correction 2)
  const noShellRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const strippedShellRoutes = ['/onboarding', '/about', '/help', '/terms', '/accessibility'];

  const isNoShell =
    noShellRoutes.includes(pathname) ||
    (pathname.startsWith('/interview/') && pathname !== '/interview');

  const isStrippedShell =
    strippedShellRoutes.includes(pathname) ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/legal/');

  // MODE 1: NO SHELL AT ALL
  if (isNoShell) {
    return <>{children}</>;
  }

  // MODE 2: STRIPPED SHELL (logo-only topbar, no sidebar, Pattern C max-w-3xl)
  if (isStrippedShell) {
    // Extract a readable title for stripped views
    let title = "Document";
    if (pathname === "/onboarding") title = "Welcome to SkilledCore";
    else if (pathname === "/about") title = "About SkilledCore";
    else if (pathname === "/help") title = "Help & Support Center";
    else if (pathname === "/terms") title = "Terms of Service";
    else if (pathname === "/accessibility") title = "Accessibility Statement";
    else if (pathname.startsWith("/legal/")) {
      const policy = pathname.split("/").pop() || "";
      title = policy.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }

    return (
      <div className="min-h-screen bg-bg-secondary-panel text-text-body font-sans flex flex-col">
        {/* Stripped Topbar: Height exactly 56px (h-14) */}
        <header className="h-14 fixed top-0 left-0 right-0 border-b border-border-topbar bg-bg-topbar flex items-center justify-between px-6 z-50">
          <Link href="/feed" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="SkilledCore"
              width={28}
              height={28}
              priority
              unoptimized
              className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
            />
            <div className="flex flex-col leading-none">
              <span className="text-text-heading font-bold text-sm tracking-tight">SkilledCore</span>
              <span className="text-text-secondary text-[9px] font-medium mt-0.5">Talent Intelligence</span>
            </div>
          </Link>

          <Link 
            href="/feed" 
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-heading transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </header>

        {/* Stripped Content Area: Padding top 56px (below fixed topbar), Pattern C */}
        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-14 pb-12">
          <div className="space-y-6">
            <div className="border-b border-border-subtle pb-6">
              <h1 className="text-2xl font-bold tracking-tight text-text-heading">{title}</h1>
              <p className="text-xs text-text-secondary mt-1 font-medium">Last updated: June 2026</p>
            </div>
            <div className="text-base text-text-body leading-relaxed space-y-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // MODE 3: FULL SHELL (full topbar + sidebar)
  return (
    <RealtimeBadgeProvider userId={userId} initial={counts as Record<string, number | boolean>}>
    <div className="min-h-screen bg-bg-secondary-panel text-text-body font-sans flex relative">

      {/* Desktop Sidebar — Fixed Left */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        plan={plan}
        companySlug={companySlug}
      />

      {/* Mobile Drawer Dark Overlay (Correction 2: Lightweight CSS-only overlay) */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-200 lg:hidden"
        />
      )}

      {/* Main Content & Topbar Wrapper */}
      <div 
        className={cn(
          "flex flex-col min-h-screen w-full transition-all duration-200 ease-in-out",
          // Deskop layout spacing adjustment matching sidebar width
          isCollapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        {/* Topbar: Full Width, Fixed Top, Height exactly 56px (h-14) */}
        <Header 
          credits={credits} 
          onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Main Page Area: Padding top 56px (pt-14) to sit nicely under topbar */}
        <main className="w-full min-h-screen pt-14 overflow-x-clip">
          {children}
        </main>
      </div>
    </div>
    </RealtimeBadgeProvider>
  );
}
