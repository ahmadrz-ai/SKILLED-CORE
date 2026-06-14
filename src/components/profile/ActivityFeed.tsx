"use client";

import Link from "next/link";
import { Repeat, Heart, MessageCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sanitizeRichHtml } from "@/lib/sanitize";

type AuthorLite = { name?: string | null; image?: string | null; username?: string | null; headline?: string | null };
type PostLite = {
    id: string;
    content: string;
    image?: string | null;
    createdAt: string | Date;
    author: AuthorLite;
    likes?: unknown[];
    _count?: { likes?: number; comments?: number };
};

type RepostLite = { createdAt: string | Date; post: PostLite | null };

function likeCount(p: PostLite) {
    return p._count?.likes ?? (Array.isArray(p.likes) ? p.likes.length : 0);
}

/** A unified profile activity stream: the user's own posts + their reposts. */
export function ActivityFeed({
    posts, reposts, ownerName, isOwner,
}: {
    posts: PostLite[];
    reposts: RepostLite[];
    ownerName: string;
    isOwner: boolean;
}) {
    const items = [
        ...posts.map((p) => ({ kind: "post" as const, post: p, time: new Date(p.createdAt).getTime() })),
        ...reposts.filter((r) => r.post).map((r) => ({ kind: "repost" as const, post: r.post as PostLite, time: new Date(r.createdAt).getTime() })),
    ].sort((a, b) => b.time - a.time);

    if (items.length === 0) {
        return (
            <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">{isOwner ? "You haven't posted or reposted yet." : `${ownerName} hasn't posted yet.`}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((it, i) => {
                const p = it.post;
                const a = p.author || {};
                return (
                    <div key={`${it.kind}-${p.id}-${i}`} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        {it.kind === "repost" && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mb-3 pb-2 border-b border-slate-100">
                                <Repeat className="w-3.5 h-3.5" />
                                {isOwner ? "You reposted" : `${ownerName} reposted`}
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                            {a.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={a.image} alt={a.name || ""} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-sc-purple-100 text-sc-purple-700 flex items-center justify-center font-bold">{(a.name || "?").charAt(0)}</div>
                            )}
                            <div className="min-w-0">
                                <Link href={a.username ? `/profile/${a.username}` : "#"} className="font-semibold text-sm text-slate-900 hover:underline truncate block">{a.name || "Unknown"}</Link>
                                {a.headline && <p className="text-xs text-slate-500 truncate">{a.headline}</p>}
                            </div>
                        </div>

                        <Link href={`/post/${p.id}`} className="block group">
                            <div
                                className="text-sm text-slate-700 leading-relaxed line-clamp-6 [&_a]:text-sc-purple-600"
                                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(p.content || "") }}
                            />
                            {p.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.image} alt="" className="mt-3 rounded-lg border border-slate-200 max-h-80 object-cover w-full" />
                            )}
                        </Link>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {likeCount(p)}</span>
                            <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {p._count?.comments ?? 0}</span>
                            <span className="ml-auto">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
