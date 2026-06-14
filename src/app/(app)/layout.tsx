import { AppShell } from "@/components/layout/AppShell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCreditState } from "@/lib/credits";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    let networkCount = 0;
    let notificationCount = 0;
    let messagesCount = 0;
    let jobsCount = 0;
    let learningCount = 0;
    let hasAnalytics = false;

    let user: { plan: string; credits: number; headline: string | null; role: string; companyId: string | null; onboardedAt: Date | null } | null = null;

    let shouldRedirectToOnboarding = false;

    try {
        if (session?.user?.id) {
            const uid = session.user.id;
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // These 7 queries are independent — run them in parallel instead of
            // sequentially. This layout runs on EVERY page load, so it removes
            // ~6 round-trips of latency from every navigation.
            const [
                userResult,
                network,
                notifications,
                messages,
                jobs,
                learning,
                views,
            ] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: uid },
                    select: { plan: true, credits: true, headline: true, role: true, companyId: true, onboardedAt: true }
                }),
                prisma.connection.count({ where: { addresseeId: uid, status: "PENDING" } }),
                prisma.notification.count({ where: { userId: uid, read: false } }),
                prisma.conversationParticipant.count({ where: { userId: uid, hasUnread: true } }),
                prisma.job.count({ where: { createdAt: { gte: threeDaysAgo }, status: "OPEN" } }),
                prisma.userAssessment.count({ where: { userId: uid, attemptedAt: { gte: sevenDaysAgo } } }),
                prisma.profileView.count({ where: { profileId: uid, viewedAt: { gte: oneDayAgo } } }),
            ]);

            user = userResult;
            networkCount = network;
            notificationCount = notifications;
            messagesCount = messages;
            jobsCount = jobs;
            learningCount = learning;
            hasAnalytics = views > 0;

            // Redirect un-onboarded users to the onboarding page. onboardedAt is the
            // explicit completion signal (set on submit AND skip); headline/companyId
            // are kept as fallbacks for users onboarded before this field existed.
            const isOnboarded = Boolean(user?.onboardedAt) || user?.headline || (user?.role === 'RECRUITER' && user?.companyId);
            if (!isOnboarded) {
                shouldRedirectToOnboarding = true;
            }
        }
    } catch (dbError) {
        console.error("AppLayout: DB Error fetching stats/user:", dbError);
    }

    if (shouldRedirectToOnboarding) {
        redirect("/onboarding");
    }

    const plan = user?.plan || "BASIC";

    // Topbar shows the TOTAL across all buckets (resume+interview+general+topUp).
    let totalCredits = user?.credits || 0;
    if (session?.user?.id) {
        try {
            const state = await getCreditState(session.user.id);
            if (state) totalCredits = state.total;
        } catch { /* fall back to legacy field */ }
    }

    return (
        <AppShell
            counts={{
                network: networkCount,
                notifications: notificationCount,
                messages: messagesCount,
                jobs: jobsCount,
                learning: learningCount,
                analytics: hasAnalytics,
                salary: false
            }}
            plan={plan}
            credits={totalCredits}
            userId={session?.user?.id}
        >
            {children}
        </AppShell>
    );
}
