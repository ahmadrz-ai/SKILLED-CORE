"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    description: "Get started with the essentials. Perfect for candidates exploring the platform.",
    features: [
      "10 monthly credits",
      "Basic job search & apply",
      "Standard candidate profile",
      "3 skill assessments/month",
      "Community support",
    ],
    cta: "Get started free",
    href: "/register?role=candidate",
    popular: false,
  },
  {
    name: "Pro",
    price: "$5",
    period: "/month",
    description: "For active job seekers and recruiters who need more reach and visibility.",
    features: [
      "50 monthly credits",
      "Verified profile badge",
      "Promoted feed visibility",
      "Who viewed your profile",
      "Featured applicant status",
      "Direct messaging (InMail)",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "/register",
    popular: true,
  },
  {
    name: "Ultra",
    price: "$10",
    period: "/month",
    description: "The complete package with salary insights, learning academy, and unlimited search.",
    features: [
      "100 monthly credits",
      "Everything in Pro",
      "Salary insights access",
      "Learning Academy courses",
      "Unlimited search",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Go Ultra",
    href: "/register",
    popular: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24" style={{ background: "#FAFAFE" }}>
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
            Pricing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ letterSpacing: "-0.02em", color: "#1E1B4B" }}
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg"
            style={{ color: "#64748B" }}
          >
            Start for free. Upgrade when you need more.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-white rounded-2xl transition-all duration-200 flex flex-col"
              style={{
                border: plan.popular ? "2px solid #7C3AED" : "1px solid #E2E8F0",
                boxShadow: plan.popular ? "0 0 0 4px rgba(124,58,237,0.08), 0 8px 24px rgba(124,58,237,0.1)" : "none",
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div
                    className="flex items-center gap-1 px-3 py-1 text-white text-xs font-bold rounded-full shadow-sm"
                    style={{ background: "#7C3AED" }}
                  >
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-6 flex-1">
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-1" style={{ color: "#1E1B4B" }}>{plan.name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black" style={{ letterSpacing: "-0.025em", color: "#1E1B4B" }}>{plan.price}</span>
                    {plan.period && <span className="text-sm pb-1" style={{ color: "#64748B" }}>{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm" style={{ color: "#475569" }}>
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: plan.popular ? "#7C3AED" : "#059669" }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6">
                <Link
                  href={plan.href}
                  className="block w-full text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-150"
                  style={
                    plan.popular
                      ? { background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }
                      : plan.name === "Ultra"
                      ? { background: "#1E1B4B", color: "#fff" }
                      : { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
