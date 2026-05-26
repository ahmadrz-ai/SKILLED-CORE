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
        return <div className="p-12 text-slate-800 font-medium">Job not found or unauthorized.</div>;
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-slate-900 p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <Link href="/hire/dashboard" className="p-2.5 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">{job.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-150">Recruitment Hub</span>
                            <span className="text-slate-400 font-medium text-xs">•</span>
                            <p className="text-slate-500 text-xs font-semibold font-sans">Managing Pipeline · {job.applications.length} Candidates</p>
                        </div>
                    </div>
                </div>

                {/* Board */}
                <KanbanBoard job={job} />
            </div>
        </div>
    );
}
