"use client";

import { motion } from "framer-motion";
import {
  Brain, Target, BarChart3, Users, BookOpen, Shield,
  Zap, MessageSquare, TrendingUp
} from "lucide-react";

const FEATURES = [
  {
    icon: Target, color: "#7C3AED", bg: "#EDE9FE",
    title: "Direct Sandbox Execution",
    description: "Measure capability directly. We test actual code execution, task decomposition, and debugging under time pressure — never pseudoscientific proxies or behavior heuristics."
  },
  {
    icon: Brain, color: "#0891B2", bg: "#ECFEFF",
    title: "Explainable Reasoning Chains",
    description: "Gain complete explainability. Every report delivers granular reasoning chains outlining what the candidate did, why they scored, and specific failed assertions."
  },
  {
    icon: Zap, color: "#059669", bg: "#ECFDF5",
    title: "Instant Candidate Discovery",
    description: "Unlock high-intent interview requests. Build your profile once, complete verification sandboxes, and get noticed by engineering teams looking for actual builders."
  },
  {
    icon: Users, color: "#D97706", bg: "#FFFBEB",
    title: "Verified Execution Badges",
    description: "Earn public technical credibility. Show off your real-world debugging speed, systems architecture depth, and modular coding standards on your profile."
  },
  {
    icon: BookOpen, color: "#7C3AED", bg: "#EDE9FE",
    title: "Human-in-the-Loop Override",
    description: "Empower engineering managers to edit, annotate, and override AI decisions, allowing local models to actively learn from your team's feedback."
  },
  {
    icon: Shield, color: "#DC2626", bg: "#FEF2F2",
    title: "GDPR Ghost Protocol",
    description: "Stealth candidate profile protection. Encrypts and shields developer search status from current employers, building total candidate trust."
  }
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24" style={{ background: "#FAFAFE" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{ background: "#EDE9FE", border: "1px solid #DDD6FE", color: "#6D28D9" }}
          >
            Platform Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ letterSpacing: "-0.02em", color: "#1E1B4B" }}
          >
            Everything you need to hire{" "}
            <span style={{ color: "#7C3AED" }}>with confidence</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg leading-relaxed"
            style={{ color: "#64748B" }}
          >
            From sourcing to onboarding — SkilledCore replaces disconnected tools with one unified platform.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-xl p-6 transition-all duration-200 cursor-default"
              style={{ border: "1px solid #E2E8F0" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7C3AED";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200"
                style={{ background: feature.bg }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="font-semibold text-base mb-2" style={{ color: "#1E1B4B" }}>{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
