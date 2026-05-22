import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    let user: { plan: string; credits: number } | null = null;

    try {
        if (session?.user?.id) {
            user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { plan: true, credits: true }
            });

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

    const plan = user?.plan || "BASIC";

    return (
        <div className="min-h-screen bg-[#F3F4F6] text-[#111827] font-sans">
            {/* Desktop Sidebar — Fixed Left */}
            <Sidebar
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
            />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Sticky Header */}
                <Header credits={user?.credits || 0} />

                {/* Main Scrollable Content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav />
        </div>
    );
}
