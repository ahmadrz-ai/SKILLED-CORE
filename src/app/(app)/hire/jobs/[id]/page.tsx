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
        return <div className="p-12 text-white">Job not found or unauthorized.</div>;
    }

    return (
        <div className="min-h-screen bg-obsidian text-white p-6 overflow-x-auto">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/hire/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-zinc-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-heading">{job.title}</h1>
                        <p className="text-zinc-400 text-sm">Managing Pipeline • {job.applications.length} Candidates</p>
                    </div>
                </div>

                {/* Board */}
                <KanbanBoard job={job} />
            </div>
        </div>
    );
}
