import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    let user = null;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { headline: true, role: true, name: true, username: true, companyId: true, email: true }
        });
    } catch (dbError) {
        console.error("OnboardingPage: DB Error fetching user", dbError);
    }

    // Determine onboarding status dynamically based on role
    const isOnboarded = user?.headline || (user?.role === 'RECRUITER' && user?.companyId);
    if (isOnboarded) {
        redirect("/feed");
    }

    return (
        <OnboardingClient 
            dbRole={user?.role || undefined} 
            dbName={user?.name || undefined} 
            dbUsername={user?.username || undefined} 
            dbEmail={user?.email || undefined} 
        />
    );
}
