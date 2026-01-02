"use client";

import Link from "next/link";
import { Button3D } from "@/components/ui/Button3D";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { MetricMarquee } from "@/components/landing/MetricMarquee";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { PremiumFooter } from "@/components/landing/PremiumFooter";
import { QodeeLogo } from "@/components/QodeeLogo";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function LandingContent() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
    const logoRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

    return (
        <div className="min-h-screen bg-black text-foreground selection:bg-violet-500/30 relative">
            {/* HERO SECTION */}
            <section
                ref={heroRef}
                className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden"
            >
                {/* Animated 3D Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                        rotateZ: logoRotate,
                        transformStyle: "preserve-3d"
                    }}
                    className="mb-10 relative"
                >
                    <QodeeLogo className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_50px_rgba(139,92,246,0.6)]" />

                    {/* Orbiting particles around logo */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0"
                    >
                        <div className="absolute top-0 left-1/2 w-2 h-2 bg-violet-400 rounded-full blur-sm" />
                        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-fuchsia-400 rounded-full blur-sm" />
                    </motion.div>
                </motion.div>

                {/* Glassmorphic Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{ opacity, scale }}
                    className="max-w-5xl mx-auto relative"
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-3xl rounded-full" />

                    <div className="relative p-8 md:p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
                        {/* New Tagline */}
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-white tracking-tight mb-6 leading-tight"
                        >
                            Where Talent Meets
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 animate-gradient">
                                Opportunity
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="text-lg md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed"
                        >
                            AI-powered matching, immersive 3D profiles, and a hiring process that actually works.
                            <span className="text-violet-400 font-medium"> Your career, amplified.</span>
                        </motion.p>

                        {/* CTAs with 3D Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                            className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto justify-center items-center mb-16"
                        >
                            <Link href="/register?role=recruiter" className="w-full sm:w-auto">
                                <Button3D variant="primary" className="w-full">
                                    HIRE TALENT
                                    <ArrowRight className="w-4 h-4" />
                                </Button3D>
                            </Link>
                            <Link href="/register?role=candidate" className="w-full sm:w-auto">
                                <Button3D variant="secondary" className="w-full">
                                    FIND WORK
                                    <Sparkles className="w-4 h-4" />
                                </Button3D>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 animate-bounce"
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest">Scroll to explore</span>
                        <ChevronDown className="w-6 h-6 text-violet-400" />
                    </div>
                </motion.div>
            </section>

            {/* STATS MARQUEE */}
            <MetricMarquee />

            {/* HOW IT WORKS */}
            <HowItWorks />

            {/* BENTO GRID FEATURES */}
            <BentoGrid />

            {/* PRICING */}
            <PricingSection />

            {/* TESTIMONIALS */}
            <Testimonials />

            {/* FINAL CTA */}
            <section className="py-32 px-4 text-center relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto space-y-8 relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/10 border border-violet-500/20 backdrop-blur-sm mb-4">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-violet-300 font-medium">Join 10,000+ Professionals</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-heading font-black text-white leading-tight">
                        Ready to Transform Your Career?
                    </h2>

                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Start connecting with opportunities that match your unique talents. No resume spam, no endless applications—just real matches.
                    </p>

                    <Link href="/register">
                        <Button3D variant="primary" className="text-lg px-12 py-6">
                            GET STARTED FREE
                            <ArrowRight className="w-5 h-5" />
                        </Button3D>
                    </Link>

                    <p className="text-xs text-zinc-600 mt-8">
                        No credit card required • Setup in 2 minutes
                    </p>
                </motion.div>
            </section>

            {/* PREMIUM FOOTER */}
            <PremiumFooter />
        </div>
    );
}
