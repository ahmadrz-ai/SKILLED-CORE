"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";
import { revalidatePath } from "next/cache";

export async function submitReport(
    userWords: string,
    category = "bug",
    severity = "medium"
) {
    const session = await auth();
    // Allow anonymous submissions, but link to user if logged in
    const userId = session?.user?.id || null;

    if (!userWords?.trim()) {
        return { error: "Report description cannot be empty." };
    }

    try {
        const report = await prisma.systemReport.create({
            data: {
                userId,
                userWords: userWords.trim(),
                category,
                severity,
                status: "OPEN"
            }
        });

        revalidatePath("/admin/reports");
        return { success: true, id: report.id };
    } catch (error: any) {
        console.error("submitReport Error:", error);
        return { error: "Failed to submit report. Please try again." };
    }
}

export async function analyzeReport(reportId: string) {
    try {
        const report = await prisma.systemReport.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return { error: "Report not found." };
        }

        const analysisPrompt = `You are SkilledCore's Automated Diagnostics Engine (DeepSeek R1).
Your task is to analyze a platform support ticket written by a user and generate a technical diagnostics payload.

USER'S ORIGINAL COMPLAINT:
"${report.userWords}"

You must output exactly this JSON structure:
{
  "aiSummary": "Concise technical diagnosis of the issue (components involved, potential root causes, severity justification).",
  "fixPrompt": "A step-by-step, copy-paste ready code-fix prompt for Antigravity AI coding assistant. Specify exactly which files to edit and what modifications to make to solve the user's issue."
}

Return ONLY valid JSON. No markdown backticks. No conversational filler. Start directly with the opening curly brace.`;

        const result = await executeAI('report', [
            {
                role: 'system',
                content: 'You are a professional diagnostics parser. Return ONLY valid JSON.'
            },
            {
                role: 'user',
                content: analysisPrompt
            }
        ], {
            temperature: 0.1,
            jsonMode: true
        });

        const rawResponse = result.choices[0].message.content;
        const parsed = parseAIJson<{ aiSummary: string; fixPrompt: string }>(rawResponse);

        const updatedReport = await prisma.systemReport.update({
            where: { id: reportId },
            data: {
                aiSummary: parsed.aiSummary,
                fixPrompt: parsed.fixPrompt,
                status: "ANALYZED"
            }
        });

        revalidatePath("/admin/reports");
        return { success: true, report: updatedReport };

    } catch (error: any) {
        console.error("analyzeReport Error:", error);
        return { error: "Failed to perform AI analysis: " + error.message };
    }
}

export async function updateReportStatus(reportId: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Verify user is Admin
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (user?.role !== "ADMIN" && user?.role !== "Admin") {
        return { error: "Unauthorized: Administrator access required." };
    }

    try {
        const report = await prisma.systemReport.update({
            where: { id: reportId },
            data: { status }
        });

        revalidatePath("/admin/reports");
        return { success: true, report };
    } catch (error: any) {
        console.error("updateReportStatus Error:", error);
        return { error: "Failed to update report status." };
    }
}
