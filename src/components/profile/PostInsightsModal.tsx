"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Eye, Heart, MessageCircle, Repeat, Loader2, Lock, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getPostInsights, type PostInsights } from "@/app/(app)/feed/actions";

export function PostInsightsModal({ postId, onClose }: { postId: string; onClose: () => void }) {
    const [data, setData] = useState<PostInsights | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getPostInsights(postId).then((d) => { if (active) { setData(d); setLoading(false); } });
        return () => { active = false; };
    }, [postId]);

    const max = Math.max(1, ...(data?.series.map((s) => s.count) || [1]));

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-bg-overlay backdrop-blur-md p-4" onClick={onClose}>
            <div className="bg-bg-modal border border-border-modal rounded-2xl shadow-sc-modal max-w-lg w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sc-purple-100 text-sc-purple-700"><BarChart3 className="w-5 h-5" /></span>
                        <h3 className="text-base font-bold text-text-heading">Post insights</h3>
                    </div>
                    <button onClick={onClose} className="text-text-tertiary hover:text-text-heading"><X className="w-5 h-5" /></button>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-text-brand" /></div>
                ) : !data ? (
                    <p className="text-sm text-text-secondary py-8 text-center">Insights are only available to you on your own posts.</p>
                ) : (
                    <>
                        {/* Totals */}
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { icon: Eye, label: "Views", val: data.totals.views },
                                { icon: Heart, label: "Likes", val: data.totals.likes },
                                { icon: MessageCircle, label: "Comments", val: data.totals.comments },
                                { icon: Repeat, label: "Reposts", val: data.totals.reposts },
                            ].map(({ icon: Icon, label, val }) => (
                                <div key={label} className="rounded-xl border border-border-default bg-bg-secondary-panel p-3 text-center">
                                    <Icon className="w-4 h-4 mx-auto text-text-brand mb-1" />
                                    <div className="text-lg font-bold text-text-heading leading-none">{val}</div>
                                    <div className="text-[10px] text-text-tertiary mt-1 uppercase tracking-wider">{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* 7-day view trend */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">Views · last 7 days</h4>
                            <div className="flex items-end justify-between gap-1.5 h-24 bg-bg-secondary-panel border border-border-default rounded-xl p-3">
                                {data.series.map((s) => (
                                    <div key={s.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${s.date}: ${s.count} views`}>
                                        <div className="w-full rounded-t bg-sc-purple-500/80" style={{ height: `${(s.count / max) * 100}%`, minHeight: s.count > 0 ? 4 : 0 }} />
                                        <span className="text-[8px] text-text-tertiary whitespace-nowrap">{s.date.split(" ")[1]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Viewers (Pro only) */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">Recent viewers</h4>
                            {!data.isPro ? (
                                <div className="rounded-xl border border-dashed border-border-default bg-bg-secondary-panel p-5 text-center space-y-2">
                                    <Lock className="w-5 h-5 mx-auto text-text-tertiary" />
                                    <p className="text-sm text-text-secondary">See exactly who viewed your posts with <strong className="text-text-heading">Pro</strong>.</p>
                                    <Link href="/billing" className="inline-block rounded-lg bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold px-4 py-2">Upgrade to Pro</Link>
                                </div>
                            ) : data.viewers.length === 0 ? (
                                <p className="text-sm text-text-secondary">No identified viewers yet.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {data.viewers.map((v) => (
                                        <Link key={v.id} href={v.username ? `/profile/${v.username}` : "#"} className="flex items-center gap-3 rounded-lg p-2 hover:bg-bg-sidebar-hover">
                                            {v.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={v.image} alt="" className="w-8 h-8 rounded-full object-cover border border-border-default" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-sc-purple-100 text-sc-purple-700 flex items-center justify-center text-xs font-bold">{(v.name || "?").charAt(0)}</div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-text-heading truncate">{v.name || "Member"}</div>
                                                {v.headline && <div className="text-[11px] text-text-secondary truncate">{v.headline}</div>}
                                            </div>
                                            <span className="text-[10px] text-text-tertiary whitespace-nowrap">{formatDistanceToNow(new Date(v.viewedAt), { addSuffix: true })}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
