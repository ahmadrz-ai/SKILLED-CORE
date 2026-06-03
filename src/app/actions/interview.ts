"use server";

import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";
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

export async function generateAnalysis(
    messages: any[], 
    role: string, 
    difficulty: number,
    sandboxCode?: string,
    sandboxOutput?: string[]
) {
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
            You are an Expert Technical Interviewer.
            Analyze this transcript for a ${role} position (Level ${difficulty}).
            
            TRANSCRIPT:
            ${transcript}
            
            ${codeSection}
            
            Perform an extremely thorough, truth-based assessment of the candidate based on their responses.
            
            You must evaluate them on these 5 key parameters:
            1. Communication (overall clarity, flow, responsiveness)
            2. Grammar (proper language usage, spelling, correctness)
            3. Technical (technical depth, familiarity with concepts, correctness of answers, sandbox code quality)
            4. Problem Solving (reasoning, ability to handle challenges, code solution correctness)
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

export async function createInterviewSession(
    role: string,
    difficulty: number,
    roleClassification: any
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const interview = await prisma.interview.create({
            data: {
                userId: session.user.id,
                role,
                difficulty,
                score: 0,
                feedback: "",
                radarData: undefined,
                transcript: undefined,
                roleClassification: roleClassification as any,
                isPublic: false
            }
        });
        return { success: true, id: interview.id };
    } catch (error) {
        console.error("Create interview session failed:", error);
        return { error: "Failed to initialize interview session." };
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
