

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
    // Fetch Global Counts
    const session = await auth();
    let networkCount = 0;
    let notificationCount = 0;
    let messagesCount = 0;
    let jobsCount = 0;
    let learningCount = 0;
    let hasAnalytics = false;

    const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { plan: true, credits: true }
    });
    const plan = user?.plan || "BASIC";

    if (session?.user?.id) {
        // Network: Pending connections received
        networkCount = await prisma.connection.count({
            where: {
                addresseeId: session.user.id,
                status: "PENDING"
            }
        });

        // Notifications: Unread
        notificationCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false
            }
        });

        // Messages: Unread conversations
        messagesCount = await prisma.conversationParticipant.count({
            where: {
                userId: session.user.id,
                hasUnread: true
            }
        });

        // Jobs: Created in last 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        jobsCount = await prisma.job.count({
            where: {
                createdAt: {
                    gte: threeDaysAgo
                },
                status: 'OPEN'
            }
        });

        // Learning: Assessments in pending/progress (Approximation since "started" isn't explicitly distinct from finished without improved schema, but Pending/Failed/Passed usually implies attempt)
        // Actually schema says "UserAssessment" has "status". Assuming "STARTED" or similar creates a record. 
        // We will count all attempts for now as a placeholder for "Active Learning" or just check for assigned if that existed.
        // Let's count "PASSED" as completed, so maybe everything else is "In Progress"?
        // Or actually, just count available assessments? No, that's static.
        // Let's count UserAssessments taken in last 7 days? Or just 0 if no clear definition.
        // User requested "real data". If I can't determine "active courses", I might stick to 0 or "Recommended".
        // Let's try: Count of assessments taken in last 7 days (active learning).
        learningCount = await prisma.userAssessment.count({
            where: {
                userId: session.user.id,
                attemptedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });

        // Analytics: New profile views in last 24h
        const views = await prisma.profileView.count({
            where: {
                profileId: session.user.id,
                viewedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        hasAnalytics = views > 0;
    }

    return (
        <div className="min-h-screen bg-obsidian text-foreground font-sans">
            {/* Desktop Sidebar - Fixed Left */}
            <Sidebar
                counts={{
                    network: networkCount,
                    notifications: notificationCount,
                    messages: messagesCount,
                    jobs: jobsCount,
                    learning: learningCount,
                    analytics: hasAnalytics,
                    salary: false // No real data source yet
                }}
                plan={plan}
            />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Sticky Header */}
                <Header credits={user?.credits || 0} />

                {/* Main Scrollable Content */}
                <main className="flex-1 p-4 lg:p-8 relative">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    );
}
