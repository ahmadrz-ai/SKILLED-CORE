"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAssessments() {
    return await prisma.assessment.findMany({
        include: {
            _count: {
                select: { questions: true }
            }
        }
    });
}

export async function getAssessmentQuestions(assessmentId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
            questions: {
                select: {
                    id: true,
                    text: true,
                    options: true,
                    // EXCLUDE correctIndex for security
                }
            }
        }
    });

    if (!assessment) return null;

    return assessment;
}

export async function submitAssessment(assessmentId: string, answers: Record<string, number>) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { questions: true }
    });

    if (!assessment) return { error: "Assessment not found" };

    // Grading Logic
    let correctCount = 0;
    const totalQuestions = assessment.questions.length;

    assessment.questions.forEach(q => {
        if (answers[q.id] === q.correctIndex) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70; // 70% passing threshold
    const status = passed ? "PASSED" : "FAILED";

    // Record Result
    await prisma.userAssessment.create({
        data: {
            userId: session.user.id,
            assessmentId: assessment.id,
            score,
            status
        }
    });

    // If passed, we could trigger other side effects like adding a "Verified" skill to profile
    // Logic for adding skill to profile string would go here:
    if (passed) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        // Simplified: Just appending the assessment title to skills if not present
        if (user && user.skills && !user.skills.includes(assessment.title)) {
            const newSkills = user.skills ? `${user.skills}, ${assessment.title} (Verified)` : `${assessment.title} (Verified)`;
            await prisma.user.update({
                where: { id: session.user.id },
                data: { skills: newSkills }
            });
        }
    }

    revalidatePath("/assessments");

    return {
        success: true,
        score,
        passed,
        message: passed ? `Congratulations! You passed with ${score}%.` : `You scored ${score}%. Try again!`
    };
}
