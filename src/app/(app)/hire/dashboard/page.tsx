import { auth } from "@/auth";
import { getRecruiterJobs } from "@/app/actions/hire";
import { getJobWithApplications } from "@/app/actions/ats";
import { Plus, Briefcase, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/app/(app)/hire/jobs/[id]/KanbanBoard";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function RecruiterDashboard(props: {
    searchParams: Promise<{ jobId?: string }>;
}) {
    const searchParams = await props.searchParams;
    const jobs = await getRecruiterJobs();
    
    // Determine selected job ID (default to first active job if none is in searchParams)
    const selectedJobId = searchParams.jobId || jobs[0]?.id;
    
    let selectedJob = null;
    if (selectedJobId) {
        selectedJob = await getJobWithApplications(selectedJobId);
    }

    return (
        <div className="bg-transparent text-text-body font-sans max-w-[1200px] mx-auto px-6 py-6 space-y-6">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-heading">Recruitment Hub</h1>
                    <p className="text-text-secondary text-xs font-semibold mt-1">Manage pipeline stages, applicants, and job listings.</p>
                </div>
                <Link href="/jobs/create">
                    <Button className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold h-9 px-4 shadow-sm transition-colors text-xs rounded-lg">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Post New Job
                    </Button>
                </Link>
            </div>

            {/* Pattern B: w-72 Left Panel + flex-1 Right Panel */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* Left Panel: Active Roles list (w-72 / 288px) */}
                <div className="w-full md:w-72 flex-shrink-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary">
                            Active Job Roles ({jobs.length})
                        </h2>
                    </div>

                    {jobs.length === 0 ? (
                        <div className="p-6 text-center border border-border-default rounded-xl bg-bg-card border-dashed shadow-sc-xs">
                            <Briefcase className="w-8 h-8 mx-auto text-text-tertiary mb-3" />
                            <p className="text-xs font-semibold text-text-secondary mb-3">No active jobs yet.</p>
                            <Link href="/jobs/create">
                                <Button className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold h-8 px-3 rounded-lg">
                                    Create Job
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1.5 custom-scrollbar">
                            {jobs.map((job: any) => {
                                const isSelected = job.id === selectedJobId;
                                return (
                                    <Link 
                                        key={job.id} 
                                        href={`/hire/dashboard?jobId=${job.id}`}
                                        className={cn(
                                            "block p-4 rounded-xl border text-left transition-all shadow-sm group select-none",
                                            isSelected 
                                                ? "bg-bg-card-selected border-border-selected" 
                                                : "bg-bg-card border-border-card hover:border-[#5B35D5]/40"
                                        )}
                                    >
                                        <div className="font-bold text-xs text-text-heading group-hover:text-text-brand transition-colors truncate">
                                            {job.title}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5 text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                                            <span className="text-sc-purple-600 font-extrabold">{job._count.applications} Applicants</span>
                                            <span>•</span>
                                            <span>{job.type}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel: Selected Job Pipeline / Kanban Board (flex-1) */}
                <div className="flex-1 w-full min-w-0 bg-bg-card border border-border-card rounded-xl p-4 md:p-6 shadow-sm min-h-[500px]">
                    {selectedJob ? (
                        <div className="space-y-6">
                            {/* Board Header details */}
                            <div className="flex items-center justify-between border-b border-border-subtle pb-4 flex-wrap gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-text-heading">{selectedJob.title}</h3>
                                    <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-1">
                                        Managing Pipeline · {selectedJob.applications.length} Candidates
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/jobs/${selectedJob.id}`}>
                                        <Button variant="outline" className="h-8 text-xs font-semibold px-3 rounded-lg border-border-default hover:bg-bg-sidebar-hover">
                                            <Eye className="w-3.5 h-3.5 mr-1" /> View Listing
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Unified pipeline board */}
                            <KanbanBoard job={selectedJob} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <Briefcase className="w-12 h-12 text-text-tertiary opacity-45" />
                            <div>
                                <h3 className="text-sm font-bold text-text-heading">Select a Job Role</h3>
                                <p className="text-xs text-text-secondary max-w-xs mt-1">
                                    Please select an active job role from the list on the left to manage candidate pipeline stages.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
