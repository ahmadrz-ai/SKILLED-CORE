import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing-v2/LandingContent";
import { prisma } from "@/lib/prisma";

export default async function LandingPage() {
  // Graceful auth — stale cookies must not crash the landing page
  let session = null;
  try {
    session = await auth();
  } catch {
    // JWTSessionError from mismatched AUTH_SECRET — treat as logged out
  }

  if (session?.user) {
    if (session.user.id) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { headline: true, role: true, companyId: true }
        });
        const isOnboarded = user?.headline || (user?.role === 'RECRUITER' && user?.companyId);
        if (isOnboarded) {
          redirect("/feed");
        }
      } catch (dbError) {
        console.error("LandingPage: DB Error fetching user", dbError);
      }
    }
    redirect("/onboarding");
  }

  return <LandingContent />;
}
