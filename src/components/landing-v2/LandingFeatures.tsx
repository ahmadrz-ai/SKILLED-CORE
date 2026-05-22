"use client";

import { motion } from "framer-motion";
import {
  Brain, Target, BarChart3, Users, BookOpen, Shield,
  Zap, MessageSquare, TrendingUp
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain, color: "#7C3AED", bg: "#EDE9FE",
    title: "AI Skill Profiling",
    description: "Automatically analyze candidate skills from resumes and assessments with AI-powered profiling."
  },
  {
    icon: Target, color: "#0891B2", bg: "#ECFEFF",
    title: "Smart Matching",
    description: "AI-powered job-to-candidate matching with explainable match scores to find the right fit."
  },
  {
    icon: BarChart3, color: "#059669", bg: "#ECFDF5",
    title: "Hiring Analytics",
    description: "Real-time dashboards tracking pipeline health, engagement, and team performance metrics."
  },
  {
    icon: Users, color: "#D97706", bg: "#FFFBEB",
    title: "Candidate Pipeline",
    description: "Visual Kanban board with drag-and-drop tracking from application to offer in one view."
  },
  {
    icon: BookOpen, color: "#7C3AED", bg: "#EDE9FE",
    title: "Built-in Assessments",
    description: "Send skill assessments directly from the platform and get objective, benchmarked scores."
  },
  {
    icon: Shield, color: "#DC2626", bg: "#FEF2F2",
    title: "Privacy First",
    description: "Enterprise-grade data privacy with role-based access control and Ghost Mode for candidates."
  },
  {
    icon: Zap, color: "#EA580C", bg: "#FFF7ED",
    title: "AI Interview Simulator",
    description: "Practice interviews with AI-powered mock sessions including real-time feedback and scoring."
  },
  {
    icon: MessageSquare, color: "#0891B2", bg: "#ECFEFF",
    title: "Direct Messaging",
    description: "Built-in messaging with reactions, replies, and attachments to connect recruiters and candidates."
  },
  {
    icon: TrendingUp, color: "#059669", bg: "#ECFDF5",
    title: "Profile Analytics",
    description: "Track who viewed your profile, engagement trends, and visibility metrics across the platform."
  },
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
