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

    // FIX-005: Error state — never a blank page
    if (fetchError) {
        return (
            <div className="text-center py-20 bg-zinc-900/20 rounded-2xl border border-red-500/20 border-dashed">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Unable to Load Jobs</h3>
                <p className="text-zinc-500 mb-6">{fetchError}</p>
                <Link href="/jobs">
                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white">
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
        <div className="min-h-screen bg-transparent text-white p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-heading font-bold text-white tracking-tight">
                            Command Center <span className="text-teal-500">Jobs</span>
                        </h1>
                        <p className="text-zinc-400 max-w-2xl text-lg">
                            Access high-priority contracts and permanent positions across the network.
                        </p>
                    </div>

                    <Link href="/hire/dashboard">
                        <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 font-medium h-11 min-w-[44px]">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Recruiter Dashboard
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
