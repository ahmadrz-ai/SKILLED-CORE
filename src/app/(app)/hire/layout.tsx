"use client";

import { Sidebar } from "@/components/Sidebar";

export default function HireLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-obsidian text-foreground font-sans">
            <Sidebar />
            <div className="pl-16 transition-all duration-300">
                {children}
            </div>
        </div>
    );
}
