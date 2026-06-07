import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, AlertCircle, RefreshCw } from "lucide-react";
import { Suspense } from "react";
import { getJobs, getSavedJobIds } from "@/app/actions/jobs";
import JobList from "./JobList";
import JobFilters from "./JobFilters";
import { JobListSkeleton } from "./JobListSkeleton";

// FIX-005: Async data-fetching component separated for Suspense boundary
async function JobsContent({ searchParams, userId }: { searchParams: any; userId?: string }) {
    let jobs: any[] = [];
    let savedJobIds: string[] = [];
    let fetchError: string | null = null;

    try {
        [jobs, savedJobIds] = await Promise.all([
            getJobs(searchParams),
            getSavedJobIds()
        ]);
    } catch (err: any) {
        console.error("Jobs fetch error:", err);
        fetchError = "Unable to load jobs right now. Please try again.";
    }

    if (fetchError) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl border border-red-200 shadow-sm border-dashed">
                <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-[#111827] mb-1">Unable to Load Jobs</h3>
                <p className="text-sm text-[#6B7280] mb-6">{fetchError}</p>
                <Link href="/jobs">
                    <Button variant="outline" className="border-[#E5E7EB] text-[#374151] hover:bg-slate-50 transition-colors">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </Link>
            </div>
        );
    }

    return <JobList initialJobs={jobs} savedJobIds={savedJobIds} userId={userId} />;
}

export default async function JobsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const session = await auth();

    return (
        <div className="bg-transparent text-[#111827] font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#E5E7EB] pb-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
                            Jobs Feed
                        </h1>
                        <p className="text-[#6B7280] max-w-2xl text-sm">
                            Access high-priority contracts and permanent positions across the network.
                        </p>
                    </div>

                    <Link href="/hire/dashboard">
                        <Button className="bg-[#4A28C9] hover:bg-[#4338CA] text-white shadow-sm font-medium h-10 transition-colors">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Recruitment Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <JobFilters />
                    </div>

                    {/* Job Feed — FIX-005: Wrapped in Suspense with skeleton fallback */}
                    <div className="lg:col-span-3 space-y-6">
                        <Suspense fallback={<JobListSkeleton />}>
                            <JobsContent
                                searchParams={searchParams}
                                userId={session?.user?.id}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
