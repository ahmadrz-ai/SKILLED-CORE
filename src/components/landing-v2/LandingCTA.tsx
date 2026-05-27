"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function LandingCTA() {
  return (
    <section
      className="py-24 relative overflow-hidden landing-dark"
      style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)" }}
    >
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ letterSpacing: "-0.02em", color: "#FFFFFF" }}
        >
          Ready to Build Your Future?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg mb-10 max-w-xl mx-auto"
          style={{ color: "#E9D5FF" }}
        >
          Create your execution-based profile in 5 minutes, pass technical sandboxes, and get discovered by top engineering teams seeking verified builders.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href="/register?role=candidate"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold rounded-xl transition-all duration-200 text-base group shadow-lg hover:shadow-xl"
            style={{ background: "#FFFFFF", color: "#5B21B6" }}
          >
            Create Your Profile — It's Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/register?role=recruiter"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold rounded-xl border-2 transition-all duration-200 text-base"
            style={{ borderColor: "rgba(255,255,255,0.3)", color: "#FFFFFF", background: "rgba(255,255,255,0.1)" }}
          >
            Register as Recruiter
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
