"use server";

import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INTERVIEW_PASS_THRESHOLD, isPassingScore, skillSlug, skillDisplayName } from "@/lib/interviewScoring";
import { getSpendIntent, spendCredit } from "@/lib/credits";

// Define the Analysis Response Structure
interface AnalysisResult {
    score: number;
    feedback: string;
    radarData: {
        technical: number;
        communication: number;
        grammar: number;
        problemSolving: number;
        culturalFit: number;
    };
    strengths: string[];
    weaknesses: string[];
}

export async function getUserProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                image: true,
                name: true,
                skills: true,
                resumeUrl: true,
                role: true,
            }
        });
        return user;
    } catch (error) {
        console.error("getUserProfile Error:", error);
        return null;
    }
}

export async function generateAnalysis(
    messages: any[], 
    role: string, 
    difficulty: number,
    sandboxCode?: string,
    sandboxOutput?: string[]
) {
    // 1. Check if the candidate provided any actual responses (user role messages)
    const userMessages = (messages || []).filter(
        (m: any) => m.role === 'user' && !m.content.startsWith('[SANDBOX_TELEMETRY]')
    );
    if (userMessages.length === 0) {
        return {
            success: true,
            data: {
                score: 0,
                feedback: "The candidate terminated the interview session immediately without providing any responses.",
                radarData: {
                    technical: 0,
                    communication: 0,
                    grammar: 0,
                    problemSolving: 0,
                    culturalFit: 0
                },
                strengths: [],
                weaknesses: ["Did Not Participate"]
            }
        };
    }

    // Filter out system messages, only keep user/assistant exchange
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

    try {
        console.log("SERVER ACTION: Generating analysis for role using executeAI('search'):", role);

        let codeSection = "";
        if (sandboxCode) {
            codeSection = `
            CODELAB / SANDBOX STATE:
            The candidate had access to an interactive Monaco coding editor during this session.
            
            FINAL SOLUTION CODE IN SANDBOX:
            \`\`\`javascript
            \${sandboxCode}
            \`\`\`
            
            COMPILER / CONSOLE RUN OUTPUTS:
            \${Array.isArray(sandboxOutput) && sandboxOutput.length > 0 ? sandboxOutput.join("\n") : "No output was captured (code was not executed, or generated no console logs)."}
            
            Evaluate this code's time/space complexity, modularity, readability, and correct fulfillment of standard constraints. Factor these observations heavily into the Technical and Problem Solving scores.
            `;
        }

        const prompt = `
            You are an Expert Technical Interviewer producing a DEFENSIBLE, rubric-based assessment.
            Analyze this transcript for a ${role} position (Level ${difficulty}).

            TRANSCRIPT:
            ${transcript}

            ${codeSection}

            SCORING RUBRIC — score each parameter 0-100 against these explicit bands:
            - 90-100 (Exceptional): complete, correct, senior-level answers with depth beyond the question.
            - ${INTERVIEW_PASS_THRESHOLD}-89 (Pass): solid, mostly correct answers; minor gaps that a competent professional would have.
            - 50-${INTERVIEW_PASS_THRESHOLD - 1} (Below bar): partial understanding, notable inaccuracies, or shallow answers.
            - 25-49 (Weak): mostly incorrect/vague answers, little evidence of real experience.
            - 0-24 (No evidence): no real answers, evasion, or terminated participation.

            Apply the rubric to these 5 parameters:
            1. Communication (clarity, flow, responsiveness to the actual question asked)
            2. Grammar (language usage, spelling, correctness)
            3. Technical (depth, concept familiarity, factual correctness for a ${role}, sandbox code quality)
            4. Problem Solving (reasoning, decomposition, handling of challenges and follow-ups, solution correctness)
            5. Cultural Fit (professionalism, attitude, collaboration signals)

            HARD RULES — non-negotiable:
            - Score ONLY from evidence in the transcript. Never reward length, confidence, or buzzwords without substance.
            - Unanswered/skipped questions actively lower the relevant parameter.
            - The overall "score" must be consistent with the parameter scores (roughly their weighted reality, technical and problem solving weigh most for technical roles).
            - A candidate who did not demonstrably meet the bar must score below ${INTERVIEW_PASS_THRESHOLD}. The platform grants a Verified Skill Badge at >= ${INTERVIEW_PASS_THRESHOLD}; your score IS the credential decision, so be rigorous: a borderline performance is a fail, not a pass.

            Generate JSON in this EXACT schema:
            {
                "score": number (0-100 overall score),
                "feedback": "string (A detailed, 3-4 sentence professional executive summary citing concrete evidence)",
                "radarData": {
                    "technical": number (0-100),
                    "communication": number (0-100),
                    "grammar": number (0-100),
                    "problemSolving": number (0-100),
                    "culturalFit": number (0-100)
                },
                "strengths": ["string", "string", "string"],
                "weaknesses": ["string", "string", "string"]
            }

            Strict JSON only. Do not include markdown code block formatting (e.g. no \`\`\`json).
            `;

        const result = await executeAI(
            'search',
            [
                {
                    role: 'system',
                    content: 'You are an expert technical interview evaluator. Return ONLY valid JSON. No markdown.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            {
                temperature: 0.2,
                maxTokens: 4096,
                jsonMode: true
            }
        );

        const rawResponse = result.choices[0].message.content;

        console.log("SERVER ACTION: Analysis successfully generated");
        const analysis = parseAIJson<AnalysisResult>(rawResponse);
        return { success: true, data: analysis };

    } catch (error: any) {
        console.error("Analysis generation failed or parse error:", error);

        // NEVER fabricate a score: the old mock-85 fallback could mint a PASSING
        // result (and now a Verified Skill Badge) during an AI outage. Fail
        // honestly and let the caller retry.
        return {
            success: false as const,
            error: "Evaluation service is temporarily unavailable. Your transcript is safe — please retry grading.",
        };
    }
}

export async function createInterviewSession(
    role: string,
    difficulty: number,
    roleClassification: any,
    confirmGeneral: boolean = false
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    const userId = session.user.id;

    try {
        // Spend an INTERVIEW credit; fall back to a General credit only after the
        // user confirms (the client shows "this will use a General credit").
        const intent = await getSpendIntent(userId, "interview");
        if (intent.willUse === "none") {
            return { error: "You're out of credits. Top up to start an interview." };
        }
        if (intent.willUse === "general" && !confirmGeneral) {
            // No charge, no session — client pops the confirm dialog and retries.
            return { needsGeneralConfirm: true, generalRemaining: intent.general };
        }

        const spend = await spendCredit(userId, "interview", { allowGeneralFallback: true });
        if (!spend.success) {
            return { error: "You're out of credits. Top up to start an interview." };
        }

        let interviewId: string;
        try {
            const interview = await prisma.interview.create({
                data: {
                    userId,
                    role,
                    difficulty,
                    score: 0,
                    feedback: "",
                    radarData: undefined,
                    transcript: undefined,
                    roleClassification: roleClassification as any,
                    isPublic: false,
                },
            });
            interviewId = interview.id;
        } catch (createErr) {
            // Refund the exact bucket we charged if the session couldn't be created.
            const field = spend.used === "interview" ? "interviewCredits"
                : spend.used === "general" ? "generalCredits" : "topUpCredits";
            await prisma.user.update({ where: { id: userId }, data: { [field]: { increment: 1 } } }).catch(() => {});
            throw createErr;
        }

        revalidatePath("/credits");
        return { success: true, id: interviewId, usedGeneral: spend.used !== "interview" };
    } catch (error: any) {
        console.error("Create interview session failed:", error);
        return { error: error.message || "Failed to initialize interview session." };
    }
}

export async function saveInterview(
    interviewId: string,
    analysis: AnalysisResult,
    transcript: any[],
    durationSeconds?: number,
    cheated?: boolean
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // Save to DB, wrapping strengths and weaknesses in radarData JSON
        const interview = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                score: cheated ? 0 : analysis.score,
                feedback: analysis.feedback,
                radarData: {
                    ...analysis.radarData,
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    duration: durationSeconds,
                    cheated: cheated || false
                } as any,
                transcript: transcript as any,
                isPublic: true
            }
        });

        // Revalidate profile page to show new interview
        revalidatePath(`/profile/me`);
        revalidatePath(`/profile/${session.user.id}`);

        return { success: true, id: interview.id };

    } catch (error) {
        console.error("Save interview failed:", error);
        return { error: "Failed to save to profile." };
    }
}

/**
 * Finalize an interview ENTIRELY server-side: evaluate the transcript, persist
 * the result, apply the pass/fail gate, and (on pass only) issue the Verified
 * Skill Badge. The score never round-trips through the client, so it can't be
 * tampered with, and an AI outage can never mint a badge (no mock fallback).
 *
 * Idempotent: re-running for an already-finalized interview returns the stored
 * outcome and never duplicates badges.
 */
export async function finalizeInterview(
    interviewId: string,
    transcript: any[],
    durationSeconds?: number,
    cheated?: boolean,
    sandboxCode?: string,
    sandboxOutput?: string[]
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            select: { id: true, userId: true, role: true, difficulty: true, score: true, radarData: true },
        });
        if (!interview) return { error: "Interview session not found." };
        if (interview.userId !== session.user.id) return { error: "Forbidden" };

        // Idempotency: already finalized → return the stored outcome unchanged.
        if (interview.radarData) {
            const existingBadge = await prisma.verifiedSkill.findFirst({
                where: { userId: interview.userId, interviewId: interview.id, status: "VERIFIED" },
            });
            const rd: any = interview.radarData;
            return {
                success: true,
                alreadyFinalized: true,
                passed: isPassingScore(interview.score, rd?.cheated),
                threshold: INTERVIEW_PASS_THRESHOLD,
                badge: existingBadge ? { name: existingBadge.name, score: existingBadge.depthScore } : null,
                data: {
                    score: interview.score,
                    feedback: "",
                    radarData: rd,
                    strengths: rd?.strengths || [],
                    weaknesses: rd?.weaknesses || [],
                },
                id: interview.id,
            };
        }

        // Server-side evaluation (no client-supplied scores).
        const analysisRes = await generateAnalysis(transcript, interview.role, interview.difficulty, sandboxCode, sandboxOutput);
        if (!analysisRes.success || !("data" in analysisRes) || !analysisRes.data) {
            return { error: ("error" in analysisRes && analysisRes.error) || "Evaluation failed. Please retry." };
        }
        const analysis = analysisRes.data;
        const finalScore = cheated ? 0 : Math.max(0, Math.min(100, Math.round(analysis.score)));
        const passed = isPassingScore(finalScore, cheated);

        await prisma.interview.update({
            where: { id: interviewId },
            data: {
                score: finalScore,
                feedback: analysis.feedback,
                radarData: {
                    ...analysis.radarData,
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    duration: durationSeconds,
                    cheated: cheated || false,
                    passed,
                } as any,
                transcript: transcript as any,
                isPublic: true,
            },
        });

        // ── Badge issuance gate ──────────────────────────────────────────────
        let badge: { name: string; score: number } | null = null;
        if (passed) {
            const slug = skillSlug(interview.role);
            const display = skillDisplayName(interview.role);

            // De-dupe: one badge per skill per user. A better passing score on the
            // same skill upgrades the existing badge instead of duplicating it.
            const existing = await prisma.verifiedSkill.findFirst({
                where: { userId: interview.userId, skillId: slug },
            });
            if (existing) {
                if (finalScore >= existing.depthScore || existing.status !== "VERIFIED") {
                    await prisma.verifiedSkill.update({
                        where: { id: existing.id },
                        data: {
                            depthScore: Math.max(finalScore, existing.status === "VERIFIED" ? existing.depthScore : 0),
                            status: "VERIFIED",
                            interviewId: interview.id,
                            verifiedAt: new Date(),
                        },
                    });
                }
                badge = { name: existing.name || display, score: Math.max(finalScore, existing.depthScore) };
            } else {
                const created = await prisma.verifiedSkill.create({
                    data: {
                        userId: interview.userId,
                        skillId: slug,
                        name: display,
                        description: `Verified via AI interview (${finalScore}/100)`,
                        status: "VERIFIED",
                        depthScore: finalScore,
                        interviewId: interview.id,
                    },
                });
                badge = { name: created.name, score: created.depthScore };
            }

            // Tell the candidate they earned (or upgraded) a verified badge.
            try {
                await prisma.notification.create({
                    data: {
                        userId: interview.userId,
                        type: "BADGE_EARNED",
                        message: `🏅 You earned a <strong>${display}</strong> verified badge (${finalScore}/100). Congratulations!`,
                        resourcePath: "/profile/me",
                    },
                });
                const { notifyUser } = await import("@/lib/ably");
                await notifyUser(interview.userId);
            } catch (e) {
                console.error("BADGE_EARNED notification failed (badge still issued):", e);
            }

            // Alert recruiters whose saved searches match this newly-verified skill.
            try {
                const { alertSavedSearchesForSkill } = await import("@/app/actions/savedSearches");
                const candidate = await prisma.user.findUnique({ where: { id: interview.userId }, select: { name: true } });
                await alertSavedSearchesForSkill(display, candidate?.name || "A candidate", interview.userId);
            } catch (e) {
                console.error("Saved-search alert failed (badge still issued):", e);
            }

            // I3: surface the verified skill in the profile's Skills section too.
            try {
                const user = await prisma.user.findUnique({ where: { id: interview.userId }, select: { skills: true } });
                const current = (user?.skills || "").trim();
                const hasSkill = current.toLowerCase().includes(display.toLowerCase());
                if (!hasSkill) {
                    // Skills are stored comma-separated (see ProfileClient parser).
                    const next = current && !current.startsWith("[") ? `${current}, ${display}` : current.startsWith("[") ? current : display;
                    if (next !== current) {
                        await prisma.user.update({ where: { id: interview.userId }, data: { skills: next } });
                    }
                }
            } catch (e) {
                console.error("Skill sync to profile failed (badge still issued):", e);
            }
        }

        revalidatePath(`/profile/me`);
        revalidatePath(`/profile/${session.user.id}`);

        return {
            success: true,
            passed,
            threshold: INTERVIEW_PASS_THRESHOLD,
            badge,
            data: { ...analysis, score: finalScore },
            id: interview.id,
        };
    } catch (error) {
        console.error("finalizeInterview failed:", error);
        return { error: "Failed to finalize the interview. Please retry." };
    }
}

export async function deleteInterview(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== "ADMIN" && user?.role !== "Admin") {
            return { error: "Unauthorized: Admins only." };
        }

        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        if (!interview) {
            return { error: "Interview report not found." };
        }

        await prisma.interview.delete({
            where: { id }
        });

        revalidatePath(`/profile/me`);
        if (interview.user.username) {
            revalidatePath(`/profile/${interview.user.username}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Delete interview failed:", error);
        return { error: "Failed to delete the report." };
    }
}
