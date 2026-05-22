"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            icon: Sparkles,
            title: "Create Your Profile",
            description: "Build an immersive 3D profile that showcases your skills, projects, and personality.",
            color: "from-violet-500 to-purple-600"
        },
        {
            icon: Zap,
            title: "AI-Powered Matching",
            description: "Our neural search engine connects you with opportunities that truly fit your unique talents.",
            color: "from-fuchsia-500 to-pink-600"
        },
        {
            icon: Target,
            title: "Land Your Dream Role",
            description: "Interview with AI coaching, negotiate with data, and join teams building the future.",
            color: "from-cyan-500 to-blue-600"
        }
    ];

    return (
        <section className="py-32 px-4 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-5xl md:text-6xl font-heading font-black text-white mb-6">
                        How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Works</span>
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Three simple steps to transform your career trajectory
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative"
                        >
                            {/* Glassmorphic card */}
                            <div className="relative h-full p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                                {/* Step number */}
                                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/50">
                                    {index + 1}
                                </div>

                                {/* Icon */}
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform",
                                    step.color
                                )}>
                                    <step.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    {step.title}
                                </h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Glow effect on hover */}
                                <div className={cn(
                                    "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl",
                                    `bg-gradient-to-br ${step.color}`
                                )} />
                            </div>

                            {/* Arrow connector (except last) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                                    <ArrowRight className="w-8 h-8 text-violet-500/50" />
                                </div>
                            )}
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
