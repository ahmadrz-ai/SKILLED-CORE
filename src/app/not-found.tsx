"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { QodeeLogo } from '@/components/QodeeLogo';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-body)] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            
            {/* Subtle background ambient mesh */}
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--sc-purple-600) 1px, transparent 0)' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--sc-purple-50)] rounded-full blur-[100px] opacity-60 pointer-events-none" />

            <div className="relative z-10 max-w-md w-full text-center space-y-8">
                
                {/* Logo top placement */}
                <div className="flex flex-col items-center gap-2 mb-4">
                    <Image
                        src="/logo.png"
                        alt="SkilledCore"
                        width={40}
                        height={40}
                        className="w-10 h-10 flex-shrink-0 animate-bounce"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[var(--text-heading)] font-black text-sm tracking-tight">SkilledCore</span>
                        <span className="text-[var(--text-secondary)] text-[9px] font-bold mt-0.5 uppercase tracking-wider">Talent Intelligence</span>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-8 shadow-[var(--shadow-modal)] space-y-6">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-sm"
                    >
                        <AlertCircle className="w-8 h-8 text-[var(--text-error)]" />
                    </motion.div>

                    <div className="space-y-3">
                        <h1 className="text-6xl font-black font-heading text-[var(--sc-purple-600)] tracking-tighter leading-none">
                            404
                        </h1>
                        <h2 className="text-xl font-bold text-[var(--text-heading)] tracking-tight">
                            Page Not Found
                        </h2>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
                            The sector you are trying to access does not exist or has been relocated by the protocol.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/feed"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold rounded-lg transition-all shadow-sm group select-none text-xs uppercase tracking-wider"
                        >
                            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Back to Home
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-bg-hover)] text-[var(--btn-secondary-text)] font-bold rounded-lg transition-all shadow-sm select-none text-xs uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Login
                        </Link>
                    </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2 opacity-50">
                    <QodeeLogo className="w-3.5 h-3.5 text-[var(--text-secondary)] grayscale" />
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">Skilled Core Security Protocol</span>
                </div>
            </div>
        </div>
    );
}
