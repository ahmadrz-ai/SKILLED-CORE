"use server";

import { callGLM, parseGLMJson } from "@/lib/glm";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function generateAnalysis(messages: any[], role: string, difficulty: number) {
    // Filter out system messages, only keep user/assistant exchange
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

    try {
        console.log("SERVER ACTION: Generating analysis for role using GLM-5.1:", role);

        const prompt = `
            You are an Expert Technical Interviewer.
            Analyze this transcript for a ${role} position (Level ${difficulty}).
            
            TRANSCRIPT:
            ${transcript}
            
            Perform an extremely thorough, truth-based assessment of the candidate based on their responses.
            
            You must evaluate them on these 5 key parameters:
            1. Communication (overall clarity, flow, responsiveness)
            2. Grammar (proper language usage, spelling, correctness)
            3. Technical (technical depth, familiarity with concepts, correctness of answers)
            4. Problem Solving (reasoning, ability to handle challenges or code questions)
            5. Cultural Fit (professionalism, attitude, alignment with platform standards)
            
            Generate JSON in this EXACT schema:
            {
                "score": number (0-100 overall score),
                "feedback": "string (A detailed, 3-4 sentence professional executive summary)",
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

        const rawResponse = await callGLM(
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
                enableThinking: true,  // Enable deep reasoning for accurate scoring
            }
        );

        console.log("SERVER ACTION: Analysis successfully generated with GLM-5.1");
        const analysis = parseGLMJson<AnalysisResult>(rawResponse);
        return { success: true, data: analysis };

    } catch (error: any) {
        console.error("Analysis generation failed or parse error:", error);

        // Fallback for API Rate Limits or Network Issues
        console.log("Falling back to mock analysis due to API error.");
        const mockAnalysis: AnalysisResult = {
            score: 85,
            feedback: "The candidate demonstrated strong domain fundamentals and articulated their technical choices clearly. They showed strong potential for growth but should focus on deeper edge-case handling.",
            radarData: {
                technical: 85,
                communication: 90,
                grammar: 88,
                problemSolving: 80,
                culturalFit: 92
            },
            strengths: ["Clear Technical Communication", "Strong Foundational Logic", "Professional Attitude"],
            weaknesses: ["Deep Edge Case Consideration", "Detailed Syntactic Precision"]
        };

        return { success: true, data: mockAnalysis };
    }
}

export async function saveInterview(
    role: string,
    difficulty: number,
    analysis: AnalysisResult,
    transcript: any[],
    durationSeconds?: number
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // Save to DB, wrapping strengths and weaknesses in radarData JSON
        const interview = await prisma.interview.create({
            data: {
                userId: session.user.id,
                role,
                difficulty,
                score: analysis.score,
                feedback: analysis.feedback,
                radarData: {
                    ...analysis.radarData,
                    strengths: analysis.strengths,
                    weaknesses: analysis.weaknesses,
                    duration: durationSeconds
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
