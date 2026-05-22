import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
        <SessionWrapper session={session}>
          <CommandPalette />
          <GlobalAiAssistant />
          {children}
          <Toaster richColors position="bottom-right" theme="dark" closeButton />
        </SessionWrapper>
      </body>
    </html>
  );
}
