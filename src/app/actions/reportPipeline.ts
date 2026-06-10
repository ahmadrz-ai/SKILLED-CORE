'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";
import { notifyUser } from "@/lib/ably";

// ─── Authorization helpers ───────────────────────────────────────────────────
async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}
function isAdmin(session: any) {
    return session?.user?.role === "ADMIN";
}

// Pull the human-readable text a report carries (feedback reports stash the
// description + files as JSON in adminNotes).
function reportUserWords(report: { reason: string; adminNotes: string | null }) {
    let description = "";
    if (report.adminNotes) {
        try {
            const parsed = JSON.parse(report.adminNotes);
            if (parsed && typeof parsed === "object" && parsed.description) description = String(parsed.description);
        } catch { /* adminNotes may be plain text */ description = report.adminNotes; }
    }
    return [report.reason, description].filter(Boolean).join("\n\n");
}

// ─── AI triage: summary + coding-fix prompt ──────────────────────────────────
const ANALYZE_PROMPT = `You are a senior engineer triaging a user-submitted report for the SkilledCore platform (Next.js, Prisma, NextAuth). Read the report and return ONLY valid JSON, no markdown:
{
  "aiSummary": "Concise technical diagnosis — what the user is reporting, likely components involved, probable root cause, and a severity justification.",
  "fixPrompt": "A step-by-step, copy-paste-ready prompt for a coding AI assistant. State which files/areas to inspect and the concrete changes to make to resolve the issue. If it is a suggestion (not a bug), describe how to implement it."
}`;

export async function analyzeReport(reportId: string) {
    try {
        const session = await getSession();
        if (!isAdmin(session)) return { success: false, message: "Admin only" };

        const report = await prisma.report.findUnique({ where: { id: reportId } });
        if (!report) return { success: false, message: "Report not found" };

        const userWords = reportUserWords(report);
        let raw = "";
        try {
            const result = await executeAI('report', [
                { role: 'system', content: 'You triage software reports. Return ONLY valid JSON.' },
                { role: 'user', content: `Category: ${report.category}\nSeverity: ${report.severity}\nType: ${report.targetType}\n\nReport:\n${userWords}\n\n${ANALYZE_PROMPT}` },
            ], { temperature: 0.2, jsonMode: true });
            raw = result.choices[0].message.content;
        } catch (aiErr: any) {
            console.error("analyzeReport AI failed:", aiErr?.message || aiErr);
            return { success: false, message: "AI analysis failed. Please try again." };
        }

        let parsed: { aiSummary: string; fixPrompt: string };
        try {
            parsed = parseAIJson(raw);
        } catch {
            return { success: false, message: "AI returned an unreadable response. Please retry." };
        }

        const updated = await prisma.report.update({
            where: { id: reportId },
            data: { aiSummary: parsed.aiSummary, fixPrompt: parsed.fixPrompt },
        });

        revalidatePath(`/admin/reports/${reportId}`);
        return { success: true, aiSummary: updated.aiSummary, fixPrompt: updated.fixPrompt };
    } catch (error: any) {
        console.error("analyzeReport failed:", error);
        return { success: false, message: "Analysis failed" };
    }
}

// ─── Report detail (admin or owner) ──────────────────────────────────────────
export async function getReportDetail(reportId: string) {
    try {
        const session = await getSession();
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                reporter: { select: { id: true, name: true, image: true, email: true } },
                messages: { orderBy: { createdAt: "asc" } },
            },
        });
        if (!report) return { success: false, message: "Report not found" };

        const admin = isAdmin(session);
        if (!admin && report.reporterId !== session.user.id) {
            return { success: false, message: "Forbidden" };
        }

        // Opening the thread as an admin clears its unread badge.
        if (admin) {
            try {
                await prisma.report.update({ where: { id: reportId }, data: { adminReadAt: new Date() } });
            } catch { /* best-effort — badge reconciles on next poll */ }
        }

        // Resolve sender names/avatars for the thread in one query.
        const senderIds = Array.from(new Set(report.messages.map(m => m.senderId)));
        const senders = senderIds.length
            ? await prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true, image: true } })
            : [];
        const senderMap = Object.fromEntries(senders.map(s => [s.id, s]));

        return {
            success: true,
            isAdmin: admin,
            report: {
                id: report.id,
                reason: report.reason,
                category: report.category,
                severity: report.severity,
                status: report.status,
                threadStatus: report.threadStatus,
                targetType: report.targetType,
                aiSummary: report.aiSummary,
                fixPrompt: report.fixPrompt,
                createdAt: report.createdAt,
                body: reportUserWords(report),
                reporter: report.reporter,
                messages: report.messages.map(m => ({
                    id: m.id,
                    body: m.body,
                    senderRole: m.senderRole,
                    senderId: m.senderId,
                    senderName: senderMap[m.senderId]?.name || (m.senderRole === "ADMIN" ? "Support" : "User"),
                    senderImage: senderMap[m.senderId]?.image || null,
                    createdAt: m.createdAt,
                })),
            },
        };
    } catch (error: any) {
        console.error("getReportDetail failed:", error);
        return { success: false, message: "Failed to load report" };
    }
}

// ─── Thread messaging ────────────────────────────────────────────────────────
export async function sendReportMessage(reportId: string, body: string) {
    try {
        const session = await getSession();
        const text = (body || "").trim();
        if (!text) return { success: false, message: "Message is empty" };
        if (text.length > 4000) return { success: false, message: "Message too long" };

        const report = await prisma.report.findUnique({ where: { id: reportId }, select: { reporterId: true, threadStatus: true, status: true } });
        if (!report) return { success: false, message: "Report not found" };

        const admin = isAdmin(session);
        if (!admin && report.reporterId !== session.user.id) return { success: false, message: "Forbidden" };

        // A closed thread blocks the user from replying further; admins may still post.
        if (report.threadStatus === "CLOSED" && !admin) {
            return { success: false, message: "This conversation has been closed by support." };
        }

        await prisma.reportMessage.create({
            data: { reportId, senderId: session.user.id, senderRole: admin ? "ADMIN" : "USER", body: text },
        });

        // Notify the other party. Admin reply → notify reporter. User reply → (admins see
        // it in the queue; we notify the reporter only to avoid fanning out to all admins).
        if (admin && report.reporterId !== session.user.id) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: report.reporterId,
                        type: "REPORT_REPLY",
                        message: `Support replied to your report.`,
                        resourcePath: `/support/reports/${reportId}`,
                    },
                });
            } catch { /* notification is best-effort */ }
            await notifyUser(report.reporterId); // realtime badge nudge (support)

            // Auto-advance an untouched ticket to RESOLVING when support first replies.
            // Don't override a terminal state (COMPLETED/JUNK). Replying also counts as
            // reading the thread, so clear the admin unread badge.
            const data: { status?: string; adminReadAt: Date } = { adminReadAt: new Date() };
            if (["PENDING", "UNDER_REVIEW"].includes(report.status)) data.status = "RESOLVING";
            try {
                await prisma.report.update({ where: { id: reportId }, data });
            } catch { /* best-effort */ }
        }

        revalidatePath(`/admin/reports/${reportId}`);
        revalidatePath(`/support/reports/${reportId}`);
        return { success: true };
    } catch (error: any) {
        console.error("sendReportMessage failed:", error);
        return { success: false, message: "Failed to send" };
    }
}

// ─── Close / reopen thread (admin only) ──────────────────────────────────────
export async function setReportThreadStatus(reportId: string, status: "OPEN" | "CLOSED") {
    try {
        const session = await getSession();
        if (!isAdmin(session)) return { success: false, message: "Admin only" };
        await prisma.report.update({ where: { id: reportId }, data: { threadStatus: status } });
        revalidatePath(`/admin/reports/${reportId}`);
        revalidatePath(`/support/reports/${reportId}`);
        return { success: true };
    } catch (error: any) {
        console.error("setReportThreadStatus failed:", error);
        return { success: false, message: "Failed to update thread" };
    }
}

// ─── User-side: my reports ───────────────────────────────────────────────────
export async function getMyReports() {
    try {
        const session = await getSession();
        const reports = await prisma.report.findMany({
            where: { reporterId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        });
        return {
            success: true,
            reports: reports.map(r => ({
                id: r.id,
                reason: r.reason,
                category: r.category,
                severity: r.severity,
                status: r.status,
                threadStatus: r.threadStatus,
                createdAt: r.createdAt,
                lastMessage: r.messages[0]?.body || null,
                lastMessageRole: r.messages[0]?.senderRole || null,
            })),
        };
    } catch (error: any) {
        console.error("getMyReports failed:", error);
        return { success: false, reports: [] };
    }
}
