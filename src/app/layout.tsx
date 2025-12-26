import type { Metadata } from "next";
import { Inter, Cinzel, JetBrains_Mono } from "next/font/google"; // Import Cinzel
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "SkilledCore | Enterprise Recruitment Node",
  description: "The AI-native infrastructure for hiring.",
};



import { CommandPalette } from "@/components/CommandPalette";
import SessionWrapper from "@/components/auth/SessionWrapper";

import { QodeeLogo } from "@/components/QodeeLogo";
import { GlobalAiAssistant } from "@/components/GlobalAiAssistant";

import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cinzel.variable} ${jetbrainsMono.variable} antialiased bg-obsidian text-foreground font-sans relative`}
      >
        <SessionWrapper session={session}>
          <div className="fixed inset-0 z-[-1]">
          </div>
          <CommandPalette />
          <GlobalAiAssistant />
          {children}
          <Toaster richColors position="bottom-right" theme="dark" closeButton />
        </SessionWrapper>
      </body>
    </html>
  );
}
