"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Rocket } from "lucide-react";
import { Button3D } from "../ui/Button3D";
import Link from "next/link";

export function PricingSection() {
    const plans = [
        {
            name: "Basic",
            icon: Sparkles,
            price: "Free",
            period: "Forever",
            description: "Perfect for exploring opportunities",
            features: [
                "10 Monthly Credits",
                "Basic Job Search",
                "Standard profile",
                "Job applications",
                "Email support"
            ],
            cta: "Get Started",
            href: "/register?role=candidate",
            popular: false
        },
        {
            name: "Professional",
            icon: Zap,
            price: "$5",
            period: "per month",
            description: "For serious career growth",
            features: [
                "Verified Badge",
                "50 Monthly Credits",
                "Reach More People (Ad Feed)",
                "Who Viewed Your Profile",
                "Featured Applicant Status",
                "Direct Messaging (InMail)"
            ],
            cta: "Upgrade Now",
            href: "/credits",
            popular: true
        },
        {
            name: "Ultra",
            icon: Rocket,
            price: "$10",
            period: "per month",
            description: "For maximum career acceleration",
            features: [
                "Verified Badge",
                "100 Monthly Credits",
                "Everything in PRO",
                "Priority Support",
                "Salary Insights",
                "Learning Courses Access",
                "Unlimited Search"
            ],
            cta: "Go Ultra",
            href: "/credits",
            popular: false
        }
    ];

    return (
        <section className="py-32 px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-5xl md:text-6xl font-heading font-black text-white mb-6">
                        Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Transparent</span> Pricing
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Choose the plan that accelerates your career
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            whileHover={{ y: -12, scale: 1.02 }}
                            className="group relative"
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-violet-500/50">
                                        MOST POPULAR
                                    </div>
                                </div>
                            )}

                            <div className={cn(
                                "relative h-full p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300",
                                plan.popular
                                    ? "bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border-violet-500/50 shadow-xl shadow-violet-500/20"
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                            )}>
                                {/* Icon */}
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
                                    plan.popular ? "from-violet-500 to-fuchsia-600" : "from-zinc-700 to-zinc-600"
                                )}>
                                    <plan.icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Plan name */}
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-zinc-400 text-sm mb-6">{plan.description}</p>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-5xl font-black text-white">{plan.price}</span>
                                        {plan.period !== "contact us" && (
                                            <span className="text-zinc-500 text-sm">/{plan.period}</span>
                                        )}
                                    </div>
                                    {plan.period === "contact us" && (
                                        <span className="text-zinc-500 text-sm">{plan.period}</span>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link href={plan.href} className="block">
                                    <Button3D
                                        variant={plan.popular ? "primary" : "secondary"}
                                        className="w-full"
                                    >
                                        {plan.cta}
                                    </Button3D>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}
