"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Button3DProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

export function Button3D({ children, className, onClick, variant = 'primary', type = 'button', disabled = false }: Button3DProps) {
    const isPrimary = variant === 'primary';

    return (
        <motion.button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "group relative px-8 py-4 rounded-2xl font-bold text-base tracking-wide overflow-hidden",
                "transform-gpu transition-all duration-300",
                isPrimary ? "bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-600" : "bg-transparent border-2 border-white/20",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            style={{
                transformStyle: 'preserve-3d',
            }}
        >
            {/* 3D depth layer */}
            <div
                className={cn(
                    "absolute inset-0 rounded-2xl transition-all duration-300",
                    isPrimary
                        ? "bg-gradient-to-br from-violet-700 to-fuchsia-700 group-hover:from-violet-800 group-hover:to-fuchsia-800"
                        : "bg-white/5"
                )}
                style={{
                    transform: 'translateZ(-8px)',
                    filter: 'blur(4px)',
                }}
            />

            {/* Glassmorphism overlay */}
            <div className={cn(
                "absolute inset-0 rounded-2xl backdrop-blur-sm transition-opacity duration-300",
                isPrimary ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"
            )} />

            {/* Glow effect */}
            <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                isPrimary ? "shadow-[0_0_40px_rgba(139,92,246,0.6)]" : "shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            )} />

            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                />
            </div>

            {/* Content */}
            <span className={cn(
                "relative z-10 flex items-center gap-2",
                isPrimary ? "text-white" : "text-white group-hover:text-violet-300"
            )}>
                {children}
            </span>
        </motion.button>
    );
}
