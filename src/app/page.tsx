import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing-v2/LandingContent";
import { prisma } from "@/lib/prisma";

/* ── V1 DARK DESIGN (Hibernated) ─────────────────────────────────
   To restore the old dark landing, change the import above to:
   import LandingContent from "@/components/landing-v1-dark/LandingContent";
   See: src/components/landing-v1-dark/README.md for full instructions.
──────────────────────────────────────────────────────────────── */

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
          select: { headline: true }
        });
        if (user?.headline) {
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
