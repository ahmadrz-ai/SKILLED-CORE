"use client";

import { TrendingUp, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TrendingWidget({ topics = [], isFolded = false }: { topics: { tag: string; posts: string }[]; isFolded?: boolean }) {
    return (
        <motion.div
            className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="p-4 border-b border-[#E5E7EB] flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-[#6366F1]" />
                <h3 className="font-bold text-[#111827] text-sm">Trending Intelligence</h3>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
                {topics.length === 0 ? (
                    <div className="p-4 text-center text-[#9CA3AF] text-xs italic">
                        No trending data available.
                    </div>
                ) : (
                    <>
                        {/* First item is always visible */}
                        <div
                            className="p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-[#374151] group-hover:text-[#6366F1] transition-colors flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#6366F1]/70 transition-colors" />
                                    {topics[0].tag}
                                </span>
                            </div>
                            <p className="text-xs text-[#6B7280] font-mono mt-1">
                                {topics[0].posts} posts
                            </p>
                        </div>

                        {/* Extra items fold with animation */}
                        <AnimatePresence initial={false}>
                            {!isFolded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden divide-y divide-[#E5E7EB]"
                                >
                                    {topics.slice(1).map((topic, i) => (
                                        <div
                                            key={i + 1}
                                            className="p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-[#374151] group-hover:text-[#6366F1] transition-colors flex items-center gap-1">
                                                    <Hash className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#6366F1]/70 transition-colors" />
                                                    {topic.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#6B7280] font-mono mt-1">
                                                {topic.posts} posts
                                            </p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
            {topics.length > 0 && (
                <div className="p-3 text-center bg-white hover:bg-[#F9FAFB] border-t border-[#E5E7EB] transition-colors">
                    <button className="text-xs text-[#6366F1] hover:text-[#4F46E5] font-bold tracking-wide cursor-pointer">
                        Show more
                    </button>
                </div>
            )}
        </motion.div>
    );
}
