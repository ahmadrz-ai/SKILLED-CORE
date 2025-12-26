import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { headline: true, role: true }
    });

    // If user has a headline, they are onboarded. 
    // You might want to check other fields too depending on your "complete" definition.
    if (user?.headline) {
        redirect("/feed");
    }

    return <OnboardingClient />;
}
