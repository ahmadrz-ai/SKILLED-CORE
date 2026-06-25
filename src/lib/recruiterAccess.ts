import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentPlanCode } from "@/lib/plans";

/**
 * Recruiter access gate (soft wall).
 *
 * Recruiter-only surfaces (talent search /hire, interview bookings) require an
 * ACTIVE recruiter plan. A recruiter who finishes onboarding with no plan can
 * still use the social side of the product (feed, profile, messaging) but hits a
 * "choose your plan" wall on the recruiter tools until a plan is activated.
 *
 * Plans are activated through the existing manual flow: the recruiter submits a
 * PENDING plan transaction (PaymentModal) and an admin approves it in
 * /admin/billing, which sets user.plan. Admins always have access.
 */
export interface RecruiterAccess {
    authed: boolean;
    isRecruiter: boolean;
    isAdmin: boolean;
    /** true if the recruiter tools should be unlocked. */
    hasAccess: boolean;
}

export async function getRecruiterAccess(): Promise<RecruiterAccess> {
    const session = await auth();
    if (!session?.user?.id) {
        return { authed: false, isRecruiter: false, isAdmin: false, hasAccess: false };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, plan: true },
    });

    const isAdmin = user?.role === "ADMIN";
    const isRecruiter = user?.role === "RECRUITER";

    // A non-recruiter (e.g. candidate) isn't subject to the recruiter wall here —
    // those routes have their own role handling. Admins always pass.
    if (isAdmin) return { authed: true, isRecruiter, isAdmin, hasAccess: true };
    if (!isRecruiter) return { authed: true, isRecruiter, isAdmin, hasAccess: true };

    // Recruiter: unlocked only with an active recruiter plan (Pro / Unlimited).
    const planCode = currentPlanCode(user?.plan, "recruiter");
    return { authed: true, isRecruiter, isAdmin, hasAccess: !!planCode };
}
