import { auth } from "@/auth";
import { getAssessmentQuestions } from "@/app/actions/assessments";
import { redirect } from "next/navigation";
import QuizInterface from "./QuizInterface";

export default async function QuizPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params; // Next.js 15 Async Params
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const assessment = await getAssessmentQuestions(params.id);

    if (!assessment) {
        return (
            <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-body)] flex items-center justify-center p-6">
                <div className="p-8 text-center max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl shadow-sm">
                    <h1 className="text-xl font-bold text-[var(--text-heading)] mb-2 font-heading uppercase">Assessment Not Found</h1>
                    <p className="text-sm text-[var(--text-secondary)]">The skill verification database was unable to resolve this assessment protocol.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans text-[var(--text-body)]">
            {/* Header Showcase */}
            <div className="text-center space-y-3 pb-6 border-b border-[var(--border-strong)]">
                <div className="inline-flex p-3 bg-[var(--sc-purple-50)] rounded-2xl border border-[var(--sc-purple-200)] mb-2 shadow-inner">
                    <span className="text-3xl">🧠</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading">{assessment.title}</h1>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed font-semibold uppercase tracking-wide">{assessment.description}</p>
            </div>

            {/* Quiz Interface component */}
            <QuizInterface assessment={assessment} />
        </div>
    );
}
