"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function Testimonials() {
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch real testimonials on mount
    useEffect(() => {
        async function loadTestimonials() {
            const { getTestimonialUsers } = await import('@/app/actions/testimonials');
            const users = await getTestimonialUsers();
            setTestimonials(users);
        }
        loadTestimonials();
    }, []);

    // Duplicate testimonials for infinite scroll
    const duplicatedTestimonials = testimonials.length > 0
        ? [...testimonials, ...testimonials]
        : [];

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        let scrollPosition = 0;

        const scroll = () => {
            scrollPosition += 0.5;

            // Reset scroll position for infinite effect
            if (scrollPosition >= scrollContainer.scrollWidth / 2) {
                scrollPosition = 0;
            }

            scrollContainer.scrollLeft = scrollPosition;
            animationId = requestAnimationFrame(scroll);
        };

        animationId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationId);
    }, [testimonials]);

    return (
        <section className="py-32 px-4 relative overflow-hidden bg-gradient-to-b from-violet-950/10 to-transparent">
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-5xl md:text-6xl font-heading font-black text-white mb-6">
                        Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">10,000+</span> Professionals
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Join the community transforming how talent meets opportunity
                    </p>
                </motion.div>

                {/* Infinite scroll container */}
                <div className="relative">
                    {testimonials.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Fade edges */}
                            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                            <div
                                ref={scrollRef}
                                className="flex gap-6 overflow-x-hidden"
                                style={{ scrollBehavior: 'auto' }}
                            >
                                {duplicatedTestimonials.map((testimonial, index) => (
                                    <motion.div
                                        key={`${testimonial.name}-${index}`}
                                        className="flex-shrink-0 w-96 group"
                                        whileHover={{ scale: 1.05, y: -8 }}
                                    >
                                        <div className="h-full p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                                            {/* Quote icon */}
                                            <Quote className="w-8 h-8 text-violet-400 mb-4 opacity-50" />

                                            {/* Content */}
                                            <p className="text-zinc-300 text-base leading-relaxed mb-6">
                                                "{testimonial.content}"
                                            </p>

                                            {/* Author */}
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-12 h-12 border-2 border-violet-500/30">
                                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-white">{testimonial.name}</p>
                                                    <p className="text-sm text-zinc-400">{testimonial.role}</p>
                                                </div>
                                            </div>

                                            {/* Rating stars */}
                                            <div className="flex gap-1 mt-4">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
