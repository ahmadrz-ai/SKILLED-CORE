"use client";

import Link from "next/link";

interface LegalPagePlaceholderProps {
    title: string;
    description: string;
}

export default function LegalPagePlaceholder({ title, description }: LegalPagePlaceholderProps) {
    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-heading font-bold text-white mb-4">{title}</h1>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 space-y-4">
                <p className="text-zinc-300">{description}</p>
                <div className="h-4 w-3/4 bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-zinc-800/50 rounded animate-pulse" />
            </div>
            <p className="text-sm text-zinc-500">
                This policy is currently being updated. Please check back later or contact <Link href="/legal/user-agreement#contact" className="text-violet-400">Legal Department</Link>.
            </p>
        </div>
    );
}
