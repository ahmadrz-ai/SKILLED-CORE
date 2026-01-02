"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">

            {/* Background Noise */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
            />

            <div className="relative z-10 space-y-8 max-w-lg">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse"
                >
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </motion.div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-black font-heading text-white tracking-tighter">
                        4<span className="text-red-500 animate-pulse">0</span>4
                    </h1>
                    <h2 className="text-xl font-bold font-mono text-white/80 uppercase tracking-widest">
                        Coordinates Invalid
                    </h2>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        The sector you are trying to access does not exist or has been redacted by the protocol.
                    </p>
                </div>

                <div className="pt-8">
                    <Link
                        href="/feed"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] group"
                    >
                        <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        INITIATE RETURN SEQUENCE
                    </Link>
                </div>
            </div>

            {/* Decorative Glitch Overlay */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50 animate-scan" />
        </div>
    );
}
