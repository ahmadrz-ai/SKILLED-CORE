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
        <div className="min-h-screen bg-transparent text-white p-6 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-white">Recruitment <span className="text-violet-500">Hub</span></h1>
                        <p className="text-zinc-400 mt-2">Manage your pipelines and active listings.</p>
                    </div>
                    <Link href="/jobs/create">
                        <Button className="bg-violet-600 hover:bg-violet-500 text-white font-bold h-12 px-6 rounded-full shadow-lg shadow-violet-500/20">
                            <Plus className="w-5 h-5 mr-2" />
                            Post New Job
                        </Button>
                    </Link>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Briefcase className="w-24 h-24" /></div>
                        <h3 className="text-zinc-500 font-mono text-xs uppercase mb-2">Active Jobs</h3>
                        <div className="text-4xl font-bold">{analytics?.activeJobs || 0}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-24 h-24" /></div>
                        <h3 className="text-zinc-500 font-mono text-xs uppercase mb-2">Total Candidates</h3>
                        <div className="text-4xl font-bold">{analytics?.totalApplications || 0}</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-24 h-24" /></div>
                        <h3 className="text-zinc-500 font-mono text-xs uppercase mb-2">Placement Rate</h3>
                        <div className="text-4xl font-bold text-emerald-400">--%</div>
                    </div>
                </div>

                {/* Active Listings Table */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Active Operation Listings</h2>

                    {jobs.length === 0 ? (
                        <div className="p-12 text-center border border-white/5 rounded-2xl bg-zinc-900/20 border-dashed">
                            <Briefcase className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                            <h3 className="text-lg font-bold">No Active Jobs</h3>
                            <p className="text-zinc-500 mb-6">Start a new recruitment campaign to see data here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {jobs.map(job => (
                                <div key={job.id} className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-violet-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">{job.title}</h3>
                                            <Badge variant={job.status === "OPEN" ? "default" : "secondary"} className={job.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}>
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-zinc-500 text-sm font-mono">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job._count.applications} Applicants</span>
                                            <span>•</span>
                                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{job.type}</span>
                                        </div>
                                    </div>

                                    {/* Recent Applicants Preview */}
                                    <div className="flex -space-x-3">
                                        {job.applications.map((app, i) => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden" title={app.applicant.name || "User"}>
                                                {app.applicant.image ? (
                                                    <img src={app.applicant.image} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-500">{app.applicant.name?.[0]}</span>
                                                )}
                                            </div>
                                        ))}
                                        {job._count.applications > 5 && (
                                            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                                                <span className="text-xs text-zinc-500">+{job._count.applications - 5}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Link href={`/jobs/${job.id}`}>
                                            <Button variant="ghost" className="h-10 w-10 p-0 text-zinc-400 hover:text-white">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/hire/jobs/${job.id}`}>
                                            <Button className="bg-white hover:bg-zinc-200 text-black font-bold h-10">
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
