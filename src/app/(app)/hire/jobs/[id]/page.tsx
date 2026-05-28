import { auth } from "@/auth";
import { getJobWithApplications } from "@/app/actions/ats";
import { redirect } from "next/navigation";
import KanbanBoard from "./KanbanBoard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ATSPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const job = await getJobWithApplications(params.id);

    if (!job) {
        return (
            <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-6">
                <div className="p-8 text-center max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl shadow-sm">
                    <h1 className="text-xl font-bold text-[var(--text-heading)] mb-2 font-heading uppercase">Job Not Found</h1>
                    <p className="text-sm text-[var(--text-secondary)]">The requested recruitment pipeline is missing or unauthorized.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 font-sans text-[var(--text-body)] pb-10">
            {/* Header Identity Row */}
            <div className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm">
                <Link 
                    href="/hire/dashboard" 
                    className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--border-input-hover)] hover:bg-[var(--bg-sidebar-hover)] rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Back to Hire Dashboard"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--icon-strong)]" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[var(--text-heading)] font-heading leading-snug">{job.title}</h1>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-200)] tracking-wide uppercase">Recruitment Hub</span>
                        <span className="text-[var(--text-tertiary)] font-bold text-xs">•</span>
                        <p className="text-[var(--text-secondary)] text-xs font-semibold">Managing Pipeline · {job.applications.length} Candidates</p>
                    </div>
                </div>
            </div>

            {/* Kanban Board Board */}
            <KanbanBoard job={job} />
        </div>
    );
}
