import { auth } from "@/auth";
import { getAssessments } from "@/app/actions/assessments";
import { redirect } from "next/navigation";
import AssessmentList from "./AssessmentList";

export const metadata = {
    title: "Skill Assessments | ShadowHire",
    description: "Verify your skills and earn badges.",
};

export default async function AssessmentsPage() {
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const assessments = await getAssessments();

    return (
        <div className="min-h-screen bg-transparent text-white p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight">
                        Skill <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Verification</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl">
                        Prove your expertise to the network. Earn verified badges to boost your visibility and unlock premium opportunities.
                    </p>
                </div>

                {/* Content */}
                <AssessmentList assessments={assessments} />

            </div>
        </div>
    );
}
