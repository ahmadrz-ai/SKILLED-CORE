"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HoloPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function HoloPanel({ children, className, ...props }: HoloPanelProps) {
    return (
        <div
            className={cn(
                "relative bg-obsidian/20 backdrop-blur-md border border-cyan-neon/20 overflow-visible",
                className
            )}
            {...props}
        >
            {/* Top Holographic Rail */}
            <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-neon to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] opacity-80" />
            <div className="absolute -top-1 left-4 right-4 h-[1px] bg-cyan-neon/50" />

            {/* Top Corner Accents */}
            <div className="absolute -top-1 left-0 w-8 h-2 border-l-2 border-t-2 border-cyan-neon rounded-tl-md" />
            <div className="absolute -top-1 right-0 w-8 h-2 border-r-2 border-t-2 border-cyan-neon rounded-tr-md" />

            {/* Content */}
            <div className="relative z-10">{children}</div>

            {/* Bottom Corner Accents */}
            <div className="absolute -bottom-1 left-0 w-8 h-2 border-l-2 border-b-2 border-cyan-neon rounded-bl-md" />
            <div className="absolute -bottom-1 right-0 w-8 h-2 border-r-2 border-b-2 border-cyan-neon rounded-br-md" />

            {/* Bottom Holographic Rail */}
            <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-neon to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] opacity-80" />

            {/* Scanline Effect (Optional subtle grid) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-0" />
        </div>
    );
}
