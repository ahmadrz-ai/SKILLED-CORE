"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "SkilledCore cut our time-to-hire from 6 weeks to under 2 weeks. The AI matching is genuinely impressive — it surfaced candidates we would have missed entirely.",
    name: "Sarah Chen",
    role: "Head of Talent Acquisition",
    company: "Apex Systems",
    avatar: "SC",
    color: "#6366F1",
    stars: 5,
  },
  {
    quote: "We replaced three separate tools with SkilledCore. The built-in assessments and LMS saved us $40K annually while giving candidates a much better experience.",
    name: "Marcus Johnson",
    role: "VP of People Operations",
    company: "NovaBuild",
    avatar: "MJ",
    color: "#06B6D4",
    stars: 5,
  },
  {
    quote: "As a candidate, this is the first platform where I felt like my skills actually mattered. The skill radar showed me exactly where to improve.",
    name: "Priya Sharma",
    role: "Senior Software Engineer",
    company: "Hired via SkilledCore",
    avatar: "PS",
    color: "#10B981",
    stars: 5,
  },
  {
    quote: "The analytics dashboard alone is worth the price. We can finally measure quality of hire, not just speed. Our hiring manager satisfaction is up 40%.",
    name: "David Park",
    role: "Director of HR",
    company: "Meridian Finance",
    avatar: "DP",
    color: "#F59E0B",
    stars: 5,
  },
  {
    quote: "Onboarding was seamless. The candidate pipeline Kanban makes it incredibly easy to track where everyone is. Our recruiters love it.",
    name: "Elena Rodriguez",
    role: "Talent Partner",
    company: "CloudOps Inc.",
    avatar: "ER",
    color: "#8B5CF6",
    stars: 5,
  },
  {
    quote: "We run high-volume hiring at scale. SkilledCore handles 500+ applications per role without breaking a sweat. The automation is a game changer.",
    name: "James Liu",
    role: "Recruitment Lead",
    company: "FastScale Tech",
    avatar: "JL",
    color: "#EF4444",
    stars: 5,
  },
];

const METRICS = [
  { value: "67%", label: "Faster time-to-hire" },
  { value: "4.9/5", label: "Recruiter satisfaction" },
  { value: "2,400+", label: "Companies trust us" },
  { value: "50K+", label: "Candidates placed" },
];

export function LandingTestimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-full text-[#D97706] text-sm font-semibold mb-4"
          >
            <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
            Customer Stories
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold text-[#111827] mb-4"
            style={{ letterSpacing: "-0.015em" }}
          >
            Trusted by leading teams
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#6B7280] text-lg"
          >
            From startups to enterprises, SkilledCore transforms how teams hire and grow.
          </motion.p>
        </div>

        {/* Metrics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {METRICS.map((m) => (
            <div key={m.label} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 text-center">
              <div className="text-3xl font-black text-[#111827] mb-1" style={{ letterSpacing: "-0.02em" }}>{m.value}</div>
              <div className="text-sm text-[#6B7280]">{m.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md hover:border-[#D1D5DB] transition-all duration-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#374151] text-sm leading-relaxed mb-5">"{t.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-[#111827] text-sm">{t.name}</div>
                  <div className="text-xs text-[#6B7280]">{t.role} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
