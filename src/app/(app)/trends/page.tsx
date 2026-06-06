import Link from "next/link";
import { TrendingUp, Hash, ArrowRight } from "lucide-react";
import { getTrendingTopics } from "@/app/(app)/feed/actions";

export const dynamic = "force-dynamic";

export default async function TrendCenterPage() {
    const topics = await getTrendingTopics(24, 200);

    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="border-b border-border-default pb-6 mb-6">
                <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sc-purple-100 text-sc-purple-700">
                        <TrendingUp className="w-5 h-5" />
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-text-heading">Trend Center</h1>
                </div>
                <p className="text-sm text-text-secondary mt-2">
                    What the SkilledCore community is talking about right now — ranked by activity across recent posts.
                </p>
            </div>

            {topics.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-sc-purple-50 text-sc-purple-400 mb-4">
                        <Hash className="w-6 h-6" />
                    </span>
                    <h2 className="text-base font-semibold text-text-heading">No trends yet</h2>
                    <p className="text-sm text-text-secondary mt-1 max-w-sm">
                        Trends appear as people post with hashtags. Be the first — share an update on your feed.
                    </p>
                    <Link
                        href="/feed"
                        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-sc-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors"
                    >
                        Go to feed <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topics.map((topic, i) => (
                        <li key={topic.tag}>
                            <Link
                                href={`/search?q=${encodeURIComponent("#" + topic.tag)}`}
                                className="group flex items-center gap-4 rounded-xl border border-border-default bg-bg-card p-4 hover:border-sc-purple-300 hover:shadow-sm transition-all"
                            >
                                <span className="flex-shrink-0 w-7 text-center text-sm font-bold text-text-tertiary">
                                    {i + 1}
                                </span>
                                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sc-purple-50 text-sc-purple-600 flex-shrink-0">
                                    <Hash className="w-4 h-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-text-heading truncate group-hover:text-sc-purple-700 transition-colors">
                                        #{topic.tag}
                                    </span>
                                    <span className="block text-xs text-text-secondary mt-0.5">
                                        {topic.posts} posts
                                    </span>
                                </span>
                                <ArrowRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
