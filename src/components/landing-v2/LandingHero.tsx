"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden" style={{ background: "linear-gradient(165deg, #FAFAFE 0%, #F1EEFF 40%, #EDE9FE 70%, #FAFAFE 100%)" }}>
      {/* Subtle mesh background */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #7C3AED 1px, transparent 1px), radial-gradient(circle at 75% 75%, #7C3AED 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Soft gradient orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-100px] w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">

          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-8"
          >
            <Image
              src="/logo.png"
              alt="SkilledCore"
              width={72}
              height={72}
              className="drop-shadow-lg"
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-bold tracking-tight mb-6"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1E1B4B" }}
          >
            The smarter way to{" "}
            <span style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              hire, assess,
            </span>
            <br />
            and grow talent
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: "#64748B" }}
          >
            SkilledCore unifies your hiring pipeline, skill assessments, and team analytics
            into one powerful platform. Built for recruiters and candidates who value clarity.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6"
          >
            <Link
              href="/register?role=recruiter"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-base group"
              style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
            >
              Start hiring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/register?role=candidate"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-semibold rounded-xl border-2 transition-all duration-200 text-base"
              style={{ borderColor: "#E2E8F0", color: "#475569", background: "white" }}
            >
              Find opportunities
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="text-sm"
            style={{ color: "#94A3B8" }}
          >
            Free to get started · No credit card required
          </motion.p>
        </div>
      </div>
    </section>
  );
}
