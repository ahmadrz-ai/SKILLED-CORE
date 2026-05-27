"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Developer Seat",
    price: "Zero Cost",
    period: "during pilot",
    description: "For individual engineering managers looking to evaluate sandboxed execution rubrics.",
    features: [
      "1 custom sandbox rubric builder",
      "Up to 5 active candidate traces",
      "Direct EM telemetry metrics",
      "Basic ATS pattern diagnostic",
      "Standard support channels",
    ],
    cta: "Apply for Pilot",
    href: "#apply-pilot",
    popular: false,
  },
  {
    name: "Team Scale Pilot",
    price: "Zero Cost",
    period: "during pilot",
    description: "For growing engineering teams looking to co-define precision hiring benchmarks.",
    features: [
      "Full team sandbox environments",
      "Unlimited candidate execution traces",
      "100% EM control over evaluation rubrics",
      "Cognitive audio & transcript parsing",
      "2-Hour Priority SLA Response Guarantee",
      "Dedicated Slack collaborative channel",
    ],
    cta: "Apply for Pilot",
    href: "#apply-pilot",
    popular: true,
  },
  {
    name: "Enterprise Calibration",
    price: "Custom",
    period: "enterprise SLA",
    description: "For large engineering organizations requiring custom security sandboxes and integrations.",
    features: [
      "Everything in Team Scale Pilot",
      "Custom developer API access & webhooks",
      "Evolutionary conservation & TFBS maps",
      "Demographic bias audit compliance logs",
      "Dedicated TAM advisory & SOC2 isolation",
      "Custom legal terms & custom SLA priority",
    ],
    cta: "Apply for Pilot",
    href: "#apply-pilot",
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
            Flexible Pricing Plans
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ letterSpacing: "-0.02em", color: "#1E1B4B" }}
          >
            SaaS & Pilot Pricing Options
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg font-medium"
            style={{ color: "#64748B" }}
          >
            Start building your verified execution profile for free, or upgrade to recruit.
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
                      : plan.name === "Enterprise Calibration"
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
