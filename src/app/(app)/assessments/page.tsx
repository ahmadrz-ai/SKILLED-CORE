import { auth } from "@/auth";
import { getAssessments } from "@/app/actions/assessments";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssessmentList from "./AssessmentList";

export const metadata = {
    title: "Skill Assessments | SkilledCore",
    description: "Verify your skills and earn badges.",
};

export default async function AssessmentsPage() {
    const session = await auth();
    if (!session || !session.user?.id) redirect("/api/auth/signin");

    const assessments = await getAssessments();

    let verifiedSkills: any[] = [];
    try {
        verifiedSkills = await prisma.verifiedSkill.findMany({
            where: { userId: session.user.id },
            orderBy: { verifiedAt: 'desc' }
        });
    } catch (e) {
        console.error("Error fetching verified skills:", e);
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 font-sans text-[var(--text-body)]">
            {/* Header */}
            <div className="space-y-1.5 border-b border-[var(--border-strong)] pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading uppercase">
                    SKILL <span className="text-[var(--text-brand)]">VERIFICATION</span>
                </h1>
                <p className="text-xs text-[var(--text-secondary)] max-w-2xl font-medium leading-relaxed">
                    Prove your expertise to the network. Earn verified badges to boost your recruiter visibility and unlock premium career opportunities.
                </p>
            </div>

            {/* Content & Pattern B Two Column Layout */}
            <AssessmentList assessments={assessments} verifiedSkills={verifiedSkills} />
        </div>
    );
}
