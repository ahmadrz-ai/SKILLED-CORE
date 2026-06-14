"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Check, X, Video, Loader2, CalendarDays, Clock, Coins } from "lucide-react";
import { toast } from "sonner";
import { getMyBookings, respondToBooking, cancelBooking } from "@/app/actions/bookings";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
    REQUESTED: "bg-sc-amber-100 text-sc-amber-700",
    CONFIRMED: "bg-sc-green-100 text-sc-green-700",
    DECLINED: "bg-sc-red-100 text-sc-red-700",
    CANCELLED: "bg-sc-gray-150 text-sc-gray-600",
    COMPLETED: "bg-sc-purple-100 text-sc-purple-700",
    EXPIRED: "bg-sc-gray-150 text-sc-gray-600",
};

/** Live "time left to accept" clock with a hover tooltip (days-hours-mins-secs). */
function ExpiryClock({ expiresAt }: { expiresAt?: string | null }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - now;
    if (ms <= 0) return <span className="text-[10px] font-bold text-sc-red-600">Expired</span>;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const urgent = ms < 24 * 3600000;
    const compact = d > 0 ? `${d}d` : `${h}:${String(m).padStart(2, "0")}`;
    const full = d > 0 ? `${d}d ${h}h ${m}m left to accept` : `${h}h ${m}m ${s}s left to accept`;
    return (
        <div className="relative group/clock">
            <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-default",
                urgent ? "bg-sc-red-100 text-sc-red-700" : "bg-sc-amber-100 text-sc-amber-700"
            )}>
                <Clock className="w-3 h-3" /> {compact}
            </span>
            <span className="pointer-events-none absolute right-0 top-full mt-1 z-20 whitespace-nowrap rounded-md bg-bg-tooltip text-white text-[10px] px-2 py-1 opacity-0 group-hover/clock:opacity-100 transition-opacity shadow-sc-dropdown">
                {full}
            </span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[status] || STATUS_STYLE.CANCELLED}`}>
            {status}
        </span>
    );
}

function fmt(dt: string) {
    try {
        return new Date(dt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch {
        return dt;
    }
}

export default function BookingsPage() {
    const [data, setData] = useState<{ asRecruiter: any[]; asCandidate: any[] }>({ asRecruiter: [], asCandidate: [] });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const load = async () => {
        const res = await getMyBookings();
        setData(res);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const respond = async (id: string, decision: "CONFIRMED" | "DECLINED") => {
        setBusy(id);
        const res = await respondToBooking(id, decision);
        setBusy(null);
        if (res.success) { toast.success(decision === "CONFIRMED" ? "Interview accepted" : "Request declined"); load(); }
        else toast.error(res.message || "Action failed");
    };

    const cancel = async (id: string) => {
        setBusy(id);
        const res = await cancelBooking(id);
        setBusy(null);
        if (res.success) { toast.success("Booking cancelled"); load(); }
        else toast.error(res.message || "Action failed");
    };

    const Person = ({ p }: { p: any }) => (
        <Link href={`/profile/${p?.username || p?.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-90">
            {p?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="w-11 h-11 rounded-full object-cover border border-border-default" />
            ) : (
                <div className="w-11 h-11 rounded-full bg-sc-purple-100 text-sc-purple-700 flex items-center justify-center font-bold">{p?.name?.[0] || "?"}</div>
            )}
            <div className="min-w-0">
                <div className="font-semibold text-text-heading truncate">{p?.name}</div>
                {p?.headline && <div className="text-xs text-text-secondary truncate">{p.headline}</div>}
            </div>
        </Link>
    );

    const MeetingRow = ({ b }: { b: any }) => (
        b.status === "CONFIRMED" ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary bg-sc-gray-50 border border-border-default rounded-lg px-3 py-2">
                <Video className="w-4 h-4 text-sc-purple-600" />
                {b.meetingUrl ? (
                    <a href={b.meetingUrl} target="_blank" rel="noreferrer" className="font-semibold text-sc-purple-700 hover:underline">Join meeting</a>
                ) : (
                    <span>Video meeting link will appear here once scheduled.</span>
                )}
            </div>
        ) : null
    );

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
                <div className="h-7 w-48 rounded-md bg-sc-gray-150 animate-pulse" />
                {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-sc-gray-100 animate-pulse" />)}
            </div>
        );
    }

    const empty = data.asCandidate.length === 0 && data.asRecruiter.length === 0;

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-10">
            <div className="border-b border-border-default pb-5">
                <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sc-purple-100 text-sc-purple-700"><CalendarDays className="w-5 h-5" /></span>
                    <h1 className="text-2xl font-bold tracking-tight text-text-heading">Interviews</h1>
                </div>
                <p className="text-sm text-text-secondary mt-2">Your interview requests and confirmed sessions.</p>
            </div>

            {empty && (
                <div className="flex flex-col items-center text-center py-16">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-sc-purple-50 text-sc-purple-400 mb-4"><CalendarClock className="w-6 h-6" /></span>
                    <h2 className="text-base font-semibold text-text-heading">No interviews yet</h2>
                    <p className="text-sm text-text-secondary mt-1 max-w-sm">When a recruiter books an interview with you — or you book one with a candidate — it shows up here.</p>
                </div>
            )}

            {/* Requests addressed to me (candidate) */}
            {data.asCandidate.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-tertiary mb-3">Requests for you</h2>
                    <div className="space-y-3">
                        {data.asCandidate.map((b) => (
                            <div key={b.id} className="rounded-xl border border-border-default bg-bg-card p-4 shadow-sc-card">
                                <div className="flex items-start justify-between gap-3">
                                    <Person p={b.recruiter} />
                                    <div className="flex items-center gap-2 shrink-0">
                                        {b.status === "REQUESTED" && <ExpiryClock expiresAt={b.expiresAt} />}
                                        <StatusBadge status={b.status} />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-sm text-text-body">
                                    <CalendarClock className="w-4 h-4 text-text-tertiary" /> {fmt(b.proposedAt)}
                                </div>
                                {b.message && <p className="mt-2 text-sm text-text-secondary bg-sc-gray-50 rounded-lg p-3">{b.message}</p>}
                                <MeetingRow b={b} />
                                {b.status === "REQUESTED" && (
                                    <>
                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => respond(b.id, "CONFIRMED")} disabled={busy === b.id}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sc-purple-700 disabled:opacity-60">
                                            {busy === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Accept</>}
                                        </button>
                                        <button onClick={() => respond(b.id, "DECLINED")} disabled={busy === b.id}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-heading hover:bg-sc-gray-50 disabled:opacity-60">
                                            <X className="w-4 h-4" /> Decline
                                        </button>
                                    </div>
                                    <p className="mt-2 flex items-center gap-1 text-[11px] text-text-tertiary"><Coins className="w-3 h-3" /> Accepting uses 1 General credit.</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Bookings I created (recruiter) */}
            {data.asRecruiter.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-tertiary mb-3">Interviews you booked</h2>
                    <div className="space-y-3">
                        {data.asRecruiter.map((b) => (
                            <div key={b.id} className="rounded-xl border border-border-default bg-bg-card p-4 shadow-sc-card">
                                <div className="flex items-start justify-between gap-3">
                                    <Person p={b.candidate} />
                                    <StatusBadge status={b.status} />
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-sm text-text-body">
                                    <CalendarClock className="w-4 h-4 text-text-tertiary" /> {fmt(b.proposedAt)}
                                </div>
                                {b.message && <p className="mt-2 text-sm text-text-secondary bg-sc-gray-50 rounded-lg p-3">{b.message}</p>}
                                <MeetingRow b={b} />
                                {(b.status === "REQUESTED" || b.status === "CONFIRMED") && (
                                    <div className="mt-4">
                                        <button onClick={() => cancel(b.id)} disabled={busy === b.id}
                                            className="text-sm font-semibold text-text-secondary hover:text-sc-red-600 transition-colors disabled:opacity-60">
                                            {b.status === "REQUESTED" ? "Cancel request" : "Cancel interview"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
