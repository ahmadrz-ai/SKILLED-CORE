"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function LandingHero() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden" style={{ background: "linear-gradient(165deg, #FAFAFE 0%, #F1EEFF 40%, #EDE9FE 70%, #FAFAFE 100%)" }}>
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
            className="flex justify-center mb-6"
          >
            <Image
              src="/logo.png"
              alt="SkilledCore"
              width={64}
              height={64}
              className="drop-shadow-lg"
            />
          </motion.div>

          {/* Pain Statement Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-black tracking-tight mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.15, letterSpacing: "-0.03em", color: "#1E1B4B" }}
          >
            Your ATS tells you who applied.{" "}
            <span style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              It still can't tell you who can build.
            </span>
          </motion.h1>

          {/* Sub-headline Category Shift */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8 font-medium"
            style={{ color: "#475569" }}
          >
            SkilledCore evaluates execution, not credentials.<br />
            <span className="text-sm font-semibold text-indigo-650 block mt-2">
              For candidates: build your execution profile and get discovered. For companies: evaluate who can actually build.
            </span>
          </motion.p>

          {/* Single Focused Social Proof */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-indigo-100 rounded-2xl shadow-sm mb-10 max-w-xl text-left"
          >
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <p className="text-xs md:text-sm font-semibold text-zinc-700 leading-tight">
              Join engineers already building their verified skill profile to skip screening loops.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6"
          >
            <Link
              href="/register?role=candidate"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-base group border-none active:scale-95 duration-100"
              style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
            >
              Create Your Profile — It's Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button
              onClick={() => scrollToSection("apply-pilot")}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl border border-zinc-200 text-base bg-white hover:bg-zinc-50 transition-all shadow-sm active:scale-95 duration-100 text-zinc-700"
            >
              Apply as Design Partner
              <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xs font-semibold tracking-wider"
            style={{ color: "#94A3B8" }}
          >
            Join elite developers showcasing verified coding & distributed system execution traces.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
