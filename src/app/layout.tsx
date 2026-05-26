import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

/* ── V1 DARK DESIGN (Hibernated) ─────────────────────────────────
   To restore: see src/components/landing-v1-dark/README.md
   Fonts removed: Cinzel (import + variable "--font-cinzel")
   ThemeColor was: "#09090b"
   Html class was: "dark"
   ParticleBackground was rendered here from landing-v1-dark/
──────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "SkilledCore | Talent Intelligence Platform",
  description: "AI-powered talent intelligence, hiring, and skill analytics. Combines ATS, LMS, and AI-driven skill profiling for modern teams.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "SkilledCore — Talent Intelligence Platform",
    description: "AI-powered hiring, skill analytics, and talent management for modern enterprises.",
    type: "website",
    url: "https://skilledcore.com",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

import { CommandPalette } from "@/components/CommandPalette";
import SessionWrapper from "@/components/auth/SessionWrapper";
import { GlobalAiAssistant } from "@/components/GlobalAiAssistant";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch (err: any) {
    console.warn("[layout] auth() failed (stale cookie?):", err?.message ?? err);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground font-sans relative`}
      >
        {/* ── Google Analytics 4 + Consent Mode v2 ─────────────────────────
            IMPORTANT: The consent 'default' block MUST run before
            gtag('config', ...) so GA4 knows to hold data until the user
            accepts. This is a Google Consent Mode v2 requirement.
            The CookieConsentBanner component calls gtag('consent','update')
            when the user makes a choice, unlocking full measurement.
        ──────────────────────────────────────────────────────────────── */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QYCWDJSRZ5"
          strategy="afterInteractive"
        />
        <Script id="ga4-consent-default" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // ── Consent Mode v2: default to denied until user decides ──
            // Check if user has already saved a preference in localStorage
            (function() {
              try {
                var saved = localStorage.getItem('skilledcore_consent_v2');
                if (saved) {
                  var prefs = JSON.parse(saved);
                  // Re-apply saved consent immediately (no banner flash)
                  gtag('consent', 'default', {
                    analytics_storage:   prefs.analytics_storage   || 'denied',
                    ad_storage:          prefs.ad_storage           || 'denied',
                    ad_user_data:        prefs.ad_user_data         || 'denied',
                    ad_personalization:  prefs.ad_personalization   || 'denied',
                    wait_for_update: 500,
                  });
                } else {
                  // First-time visitor: deny everything until banner response
                  gtag('consent', 'default', {
                    analytics_storage:  'denied',
                    ad_storage:         'denied',
                    ad_user_data:       'denied',
                    ad_personalization: 'denied',
                    wait_for_update: 3000,
                  });
                }
              } catch(e) {
                gtag('consent', 'default', {
                  analytics_storage:  'denied',
                  ad_storage:         'denied',
                  ad_user_data:       'denied',
                  ad_personalization: 'denied',
                  wait_for_update: 3000,
                });
              }
            })();

            gtag('js', new Date());
            gtag('config', 'G-QYCWDJSRZ5', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <SessionWrapper session={session}>
          <Script src="https://pl29525465.effectivecpmnetwork.com/ef/98/25/ef98254b199dcd319964f5315bb46e8c.js" strategy="lazyOnload" />
          <CommandPalette />
          <GlobalAiAssistant />
          {children}
          <Toaster richColors position="bottom-right" theme="dark" closeButton />
          {/* ── Cookie Consent Banner (Consent Mode v2) ── */}
          <CookieConsentBanner />
        </SessionWrapper>
      </body>
    </html>
  );
}
