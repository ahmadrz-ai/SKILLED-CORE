import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { getJobs, getSavedJobIds } from "@/app/actions/jobs";
import JobList from "./JobList";
import JobFilters from "./JobFilters";

export default async function JobsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();

    // Fetch Data
    const jobs = await getJobs(searchParams);
    const savedJobIds = await getSavedJobIds();

    return (
        <div className="min-h-screen bg-obsidian text-white p-6 lg:p-12 font-sans">
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
                        <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 font-medium">
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

                    {/* Job Feed */}
                    <div className="lg:col-span-3 space-y-6">
                        <JobList initialJobs={jobs} savedJobIds={savedJobIds} userId={session?.user?.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
