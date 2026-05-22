"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";

const POSTS = [
  {
    tag: "Hiring Strategy",
    tagColor: "#6366F1",
    tagBg: "#EEF2FF",
    title: "How AI Skill Profiling is Replacing the Traditional Resume Screen",
    excerpt: "Modern talent teams are moving beyond keyword matching. Here's how AI skill analysis delivers 3x better hire quality.",
    readTime: "6 min read",
    date: "May 2, 2026",
    slug: "#",
  },
  {
    tag: "Learning & Development",
    tagColor: "#06B6D4",
    tagBg: "#ECFEFF",
    title: "Building a Skills-First Culture: The L&D Playbook for 2026",
    excerpt: "Forward-thinking companies are investing in skills infrastructure, not just hiring. Here's the blueprint.",
    readTime: "8 min read",
    date: "Apr 28, 2026",
    slug: "#",
  },
  {
    tag: "Product Update",
    tagColor: "#10B981",
    tagBg: "#ECFDF5",
    title: "Introducing the SkilledCore Kanban Pipeline: Your Hiring Command Center",
    excerpt: "A walkthrough of our new visual candidate pipeline — built for speed, clarity, and team collaboration.",
    readTime: "4 min read",
    date: "Apr 22, 2026",
    slug: "#",
  },
];

export function LandingBlog() {
  return (
    <section id="blog" className="py-24 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-[#4F46E5] text-sm font-semibold mb-4"
            >
              Resources
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-bold text-[#111827]"
              style={{ letterSpacing: "-0.015em" }}
            >
              Latest from SkilledCore
            </motion.h2>
          </div>
          <Link
            href="#"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#6366F1] hover:text-[#4F46E5] transition-colors"
          >
            View all posts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {POSTS.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-md hover:border-[#D1D5DB] transition-all duration-200"
            >
              {/* Image placeholder */}
              <div
                className="h-40 w-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${post.tagBg}, #fff)` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: post.tagBg, border: `1px solid ${post.tagColor}30` }}
                >
                  <div className="w-5 h-5 rounded" style={{ background: post.tagColor }} />
                </div>
              </div>

              <div className="p-5">
                <div
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                  style={{ background: post.tagBg, color: post.tagColor }}
                >
                  {post.tag}
                </div>
                <h3 className="font-semibold text-[#111827] text-base leading-snug mb-2 group-hover:text-[#6366F1] transition-colors">
                  <Link href={post.slug}>{post.title}</Link>
                </h3>
                <p className="text-[#6B7280] text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                  <span>{post.date}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="#" className="text-sm font-medium text-[#6366F1] hover:text-[#4F46E5] transition-colors">
            View all posts →
          </Link>
        </div>
      </div>
    </section>
  );
}
