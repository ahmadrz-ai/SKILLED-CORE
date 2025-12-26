import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing/LandingContent";
import { prisma } from "@/lib/prisma";

export default async function LandingPage() {
  // const session = await auth();
  // if (session?.user) {
  //   if (session.user.id) {
  //     const user = await prisma.user.findUnique({
  //       where: { id: session.user.id },
  //       select: { headline: true }
  //     });
  //     if (user?.headline) {
  //       redirect("/feed");
  //     }
  //   }
  //   redirect("/onboarding");
  // }

  return <LandingContent />;
}
