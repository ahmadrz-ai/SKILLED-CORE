"use client";

import { TrendingUp, Hash } from "lucide-react";

export function TrendingWidget({ topics = [] }: { topics: { tag: string; posts: string }[] }) {
    return (
        <div className="bg-zinc-900/40 rounded-xl border border-white/5 sticky top-6 backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <h3 className="font-bold text-white text-sm">Trending Intelligence</h3>
            </div>
            <div className="divide-y divide-white/5">
                {topics.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs italic">
                        No trending data available.
                    </div>
                ) : (
                    topics.map((topic, i) => (
                        <div
                            key={i}
                            className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-zinc-300 group-hover:text-blue-400 transition-colors flex items-center gap-1">
                                    <Hash className="w-3 h-3 text-zinc-600 group-hover:text-blue-500/50" />
                                    {topic.tag}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 font-mono">
                                {topic.posts} posts
                            </p>
                        </div>
                    ))
                )}
            </div>
            {topics.length > 0 && (
                <div className="p-3 text-center bg-zinc-950/30">
                    <button className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                        Show more
                    </button>
                </div>
            )}
        </div>
    );
}
