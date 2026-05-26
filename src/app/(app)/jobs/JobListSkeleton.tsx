"use client";

// FIX-005: Job card skeleton for loading state
export function JobCardSkeleton() {
    return (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="space-y-2">
                        <div className="h-5 w-40 bg-slate-100 rounded" />
                        <div className="h-4 w-28 bg-slate-100 rounded" />
                    </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-100" />
            </div>
            <div className="flex gap-3 mb-6">
                <div className="h-6 w-24 bg-slate-100 rounded-full" />
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-32 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
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
