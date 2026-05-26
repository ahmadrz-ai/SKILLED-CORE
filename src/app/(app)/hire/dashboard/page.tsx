import { auth } from "@/auth";
import { getRecruiterJobs, getJobAnalytics } from "@/app/actions/hire";
import { Plus, Users, Briefcase, TrendingUp, Search, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function RecruiterDashboard() {
    const jobs = await getRecruiterJobs();
    const analytics = await getJobAnalytics();

    return (
        <div className="bg-transparent text-[#111827] font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E7EB] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#111827]">Recruitment Hub</h1>
                        <p className="text-[#6B7280] text-sm mt-1">Manage your pipeline stages and active listings.</p>
                    </div>
                    <Link href="/jobs/create">
                        <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold h-10 px-5 shadow-sm transition-colors">
                            <Plus className="w-4 h-4 mr-2" />
                            Post New Job
                        </Button>
                    </Link>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] relative overflow-hidden shadow-sm">
                        <div className="absolute -top-2 -right-2 p-2 text-[#6366F1]/5"><Briefcase className="w-20 h-20" /></div>
                        <h3 className="text-[#6B7280] font-semibold text-xs uppercase tracking-wider mb-2">Active Jobs</h3>
                        <div className="text-3xl font-extrabold text-[#111827]">{analytics?.activeJobs || 0}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] relative overflow-hidden shadow-sm">
                        <div className="absolute -top-2 -right-2 p-2 text-[#6366F1]/5"><Users className="w-20 h-20" /></div>
                        <h3 className="text-[#6B7280] font-semibold text-xs uppercase tracking-wider mb-2">Total Candidates</h3>
                        <div className="text-3xl font-extrabold text-[#111827]">{analytics?.totalApplications || 0}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] relative overflow-hidden shadow-sm">
                        <div className="absolute -top-2 -right-2 p-2 text-[#6366F1]/5"><TrendingUp className="w-20 h-20" /></div>
                        <h3 className="text-[#6B7280] font-semibold text-xs uppercase tracking-wider mb-2">Placement Rate</h3>
                        <div className="text-3xl font-extrabold text-[#10B981]">--%</div>
                    </div>
                </div>

                {/* Active Listings Table */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[#111827]">Active Job Listings</h2>

                    {jobs.length === 0 ? (
                        <div className="p-16 text-center border border-[#E5E7EB] rounded-2xl bg-white border-dashed shadow-sm">
                            <Briefcase className="w-10 h-10 mx-auto text-[#9CA3AF] mb-4" />
                            <h3 className="text-base font-semibold text-[#111827] mb-1">No Active Jobs</h3>
                            <p className="text-sm text-[#6B7280] mb-6">Start a new recruitment campaign to see analytics here.</p>
                            <Link href="/jobs/create">
                                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium h-10 transition-colors">
                                    Create Job Posting
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {jobs.map(job => (
                                <div key={job.id} className="p-6 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#6366F1]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#4F46E5] transition-colors">{job.title}</h3>
                                            <Badge variant={job.status === "OPEN" ? "default" : "secondary"} className={job.status === "OPEN" ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#ECFDF5]" : "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]"}>
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-[#6B7280] text-sm flex-wrap">
                                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#9CA3AF]" /> <span className="font-semibold text-[#374151]">{job._count.applications}</span> Applicants</span>
                                            <span>•</span>
                                            <span>Opened {new Date(job.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 rounded-full text-xs font-semibold">{job.type}</span>
                                        </div>
                                    </div>

                                    {/* Recent Applicants Preview */}
                                    <div className="flex -space-x-2.5 items-center">
                                        {job.applications.map((app, i) => (
                                            <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-[#F3F4F6] flex items-center justify-center overflow-hidden shadow-sm" title={app.applicant.name || "User"}>
                                                {app.applicant.image ? (
                                                    <img src={app.applicant.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-[#6366F1]">{app.applicant.name?.[0]?.toUpperCase()}</span>
                                                )}
                                            </div>
                                        ))}
                                        {job._count.applications > 5 && (
                                            <div className="w-9 h-9 rounded-full border-2 border-white bg-[#F3F4F6] flex items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-bold text-[#6B7280]">+{job._count.applications - 5}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Link href={`/jobs/${job.id}`}>
                                            <Button variant="outline" className="h-10 w-10 p-0 border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/hire/jobs/${job.id}`}>
                                            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold h-10 px-4 transition-colors">
                                                Manage Pipeline
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
