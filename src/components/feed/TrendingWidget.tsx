"use client";

import Link from "next/link";
import { TrendingUp, Hash, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TrendingWidget({ topics = [], isFolded = false, isCollapsed = false }: { topics: { tag: string; posts: string }[]; isFolded?: boolean; isCollapsed?: boolean }) {
    // On scroll we fold the EXTRA items but always keep the header, the single top
    // trend, and the destination button visible (never collapse to an empty card).
    const foldExtras = isFolded || isCollapsed;

    return (
        <motion.div
            className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* HEADER — always visible */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-[#5B35D5]" />
                <h3 className="font-bold text-[#111827] text-sm">Trending Intelligence</h3>
            </div>

            <div>
                <div className="divide-y divide-[#E5E7EB]">
                    {topics.length === 0 ? (
                        <div className="p-4 text-center text-[#9CA3AF] text-xs italic">
                            No trending data available.
                        </div>
                    ) : (
                        <>
                            {/* Top trend — always visible, even when scrolled */}
                            <Link prefetch={false} href={`/trends?tag=${encodeURIComponent(topics[0].tag)}`} className="block p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer group">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-[#374151] group-hover:text-[#5B35D5] transition-colors flex items-center gap-1">
                                        <Hash className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#5B35D5]/70 transition-colors" />
                                        {topics[0].tag}
                                    </span>
                                </div>
                                <p className="text-xs text-[#6B7280] font-mono mt-1">
                                    {topics[0].posts} posts
                                </p>
                            </Link>

                            {/* Extra items fold when scrolled */}
                            <AnimatePresence initial={false}>
                                {!foldExtras && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden divide-y divide-[#E5E7EB]"
                                    >
                                        {topics.slice(1).map((topic, i) => (
                                            <Link
                                                prefetch={false}
                                                href={`/trends?tag=${encodeURIComponent(topic.tag)}`}
                                                key={i + 1}
                                                className="block p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm text-[#374151] group-hover:text-[#5B35D5] transition-colors flex items-center gap-1">
                                                        <Hash className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#5B35D5]/70 transition-colors" />
                                                        {topic.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#6B7280] font-mono mt-1">
                                                    {topic.posts} posts
                                                </p>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>

                {/* Destination button — always visible */}
                {topics.length > 0 && (
                    <Link prefetch={false} href="/trends" className="flex items-center justify-center gap-1.5 p-3 text-center bg-white hover:bg-[#F9FAFB] border-t border-[#E5E7EB] transition-colors text-xs text-[#5B35D5] hover:text-[#4A28C9] font-bold tracking-wide">
                        Open Trend Center <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>
        </motion.div>
    );
}
