import { AppShell } from "@/components/layout/AppShell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

    let user: { plan: string; credits: number; headline: string | null; role: string; companyId: string | null } | null = null;

    let shouldRedirectToOnboarding = false;

    try {
        if (session?.user?.id) {
            user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { plan: true, credits: true, headline: true, role: true, companyId: true }
            });

            // Redirect un-onboarded users to the onboarding page
            const isOnboarded = user?.headline || (user?.role === 'RECRUITER' && user?.companyId);
            if (!isOnboarded) {
                shouldRedirectToOnboarding = true;
            }

            networkCount = await prisma.connection.count({
                where: { addresseeId: session.user.id, status: "PENDING" }
            });
            notificationCount = await prisma.notification.count({
                where: { userId: session.user.id, read: false }
            });
            messagesCount = await prisma.conversationParticipant.count({
                where: { userId: session.user.id, hasUnread: true }
            });
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            jobsCount = await prisma.job.count({
                where: { createdAt: { gte: threeDaysAgo }, status: "OPEN" }
            });
            learningCount = await prisma.userAssessment.count({
                where: {
                    userId: session.user.id,
                    attemptedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            });
            const views = await prisma.profileView.count({
                where: {
                    profileId: session.user.id,
                    viewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });
            hasAnalytics = views > 0;
        }
    } catch (dbError) {
        console.error("AppLayout: DB Error fetching stats/user:", dbError);
    }

    if (shouldRedirectToOnboarding) {
        redirect("/onboarding");
    }

    const plan = user?.plan || "BASIC";

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
            credits={user?.credits || 0}
        >
            {children}
        </AppShell>
    );
}
