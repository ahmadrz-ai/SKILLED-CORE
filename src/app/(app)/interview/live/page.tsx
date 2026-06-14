import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Video } from "lucide-react";
import LiveInterview from "./LiveInterview";

export const metadata = {
    title: "Live Video Interview | SkilledCore",
    description: "Face-to-face live AI interview with voice and vision.",
};

export const dynamic = "force-dynamic";

export default async function LiveInterviewPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/register?role=candidate&redirect=/interview/live");
    }

    // Beta gate: only admins (founder) can run live interviews for now.
    const isAdmin = (session.user as any)?.role === "ADMIN";
    if (!isAdmin) return <ComingSoon />;

    return <LiveInterview />;
}

function ComingSoon() {
    return (
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
            <Link href="/interview" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-heading transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to interview
            </Link>
            <div className="rounded-2xl border border-border-default bg-bg-card shadow-sc-card p-8 md:p-10 text-center space-y-5">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-sc-purple-50 border border-sc-purple-200 flex items-center justify-center relative">
                    <Video className="w-7 h-7 text-text-brand" />
                    <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-bg-card border border-border-default flex items-center justify-center shadow-sc-xs">
                        <Lock className="w-3.5 h-3.5 text-text-tertiary" />
                    </span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-heading font-black text-text-heading tracking-tight">
                        Live Video Interview — <span className="text-text-brand">Coming soon</span>
                    </h1>
                    <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                        Face-to-face AI interviews with voice &amp; vision are in private testing. We&apos;re polishing the experience before opening it up — you&apos;ll be notified the moment it goes live.
                    </p>
                </div>
                <div className="pt-1">
                    <Link href="/interview"
                        className="inline-flex items-center gap-2 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold text-sm px-6 py-3 transition-colors shadow-sc-card">
                        Start a text interview instead
                    </Link>
                </div>
                <p className="text-[11px] text-text-tertiary">Earn the same verified skill badge through our standard AI interview today.</p>
            </div>
        </div>
    );
}
