"use client";

// FIX-005: Job card skeleton for loading state
export function JobCardSkeleton() {
    return (
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800" />
                    <div className="space-y-2">
                        <div className="h-5 w-40 bg-zinc-800 rounded" />
                        <div className="h-4 w-28 bg-zinc-800 rounded" />
                    </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-zinc-800" />
            </div>
            <div className="flex gap-3 mb-6">
                <div className="h-6 w-24 bg-zinc-800 rounded-full" />
                <div className="h-6 w-20 bg-zinc-800 rounded-full" />
                <div className="h-6 w-32 bg-zinc-800 rounded-full" />
            </div>
            <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
            </div>
            <div className="h-11 w-full bg-zinc-800 rounded-lg" />
        </div>
    );
}

export function JobListSkeleton() {
    return (
        <div className="space-y-4" aria-label="Loading jobs...">
            {Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
            ))}
        </div>
    );
}
