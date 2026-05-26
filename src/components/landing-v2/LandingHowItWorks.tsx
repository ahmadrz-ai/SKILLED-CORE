"use client";

import { motion } from "framer-motion";
import { Upload, Search, BarChart3, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Upload,
    color: "#7C3AED",
    bg: "#EDE9FE",
    title: "Deploy Calibration Cohort",
    description: "Seed your environment. Ingest passed and failed benchmark candidates to train SkilledCore on your engineering team's precise execution rubric.",
    tag: "Zero Cold Start"
  },
  {
    number: "02",
    icon: Search,
    color: "#0891B2",
    bg: "#ECFEFF",
    title: "Enable Bidirectional Sync",
    description: "Hook into your existing ecosystem. We support instant, webhook-based Greenhouse, Lever, and Ashby syncs to eliminate manual recruiter re-entry.",
    tag: "Native ATS Webhooks"
  },
  {
    number: "03",
    icon: BarChart3,
    color: "#059669",
    bg: "#ECFDF5",
    title: "Direct Sandbox Testing",
    description: "Assess actual output. Candidates solve execution-based coding tasks inside isolated containerized sandboxes to measure real engineering execution depth.",
    tag: "Execution-Based"
  },
  {
    number: "04",
    icon: CheckCircle2,
    color: "#D97706",
    bg: "#FFFBEB",
    title: "Audit Reasoning Trails",
    description: "Get explainable decisions. We generate structured XAI reports showing explicit reasoning chains, logic steps, and assertion metrics.",
    tag: "Explainable AI"
  }
];

export function LandingHowItWorks() {
  return (
    <section id="solutions" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{ background: "#ECFEFF", border: "1px solid #A5F3FC", color: "#0891B2" }}
          >
            How It Works
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ letterSpacing: "-0.02em", color: "#1E1B4B" }}
          >
            From sign-up to hire{" "}
            <span style={{ color: "#0891B2" }}>in four simple steps</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg"
            style={{ color: "#64748B" }}
          >
            A streamlined process that replaces weeks of manual work with intelligent automation.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%+12px)] right-[-12px] w-6 h-px" style={{ background: "#E2E8F0" }} />
              )}

              <div
                className="rounded-xl p-6 h-full group transition-all duration-200"
                style={{ background: "#FAFAFE", border: "1px solid #E2E8F0" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7C3AED";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(124,58,237,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: step.bg }}
                  >
                    <step.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <span className="text-2xl font-black" style={{ color: "#E2E8F0" }}>{step.number}</span>
                </div>
                <div
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-3"
                  style={{ background: "white", border: "1px solid #E2E8F0", color: "#64748B" }}
                >
                  {step.tag}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#1E1B4B" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
