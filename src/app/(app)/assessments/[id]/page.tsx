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
            <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">Assessment Not Found</h1>
                    <p className="text-zinc-500">The neural data for this assessment is corrupted or missing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white p-6 lg:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3 mb-12">
                    <div className="inline-block p-4 bg-zinc-900 rounded-full mb-4 ring-1 ring-white/10">
                        <span className="text-4xl">🧠</span>
                    </div>
                    <h1 className="text-3xl font-bold font-heading">{assessment.title}</h1>
                    <p className="text-zinc-400 max-w-lg mx-auto">{assessment.description}</p>
                </div>

                {/* Interface */}
                <QuizInterface assessment={assessment} />
            </div>
        </div>
    );
}
