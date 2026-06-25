import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCandidates } from "./actions";
import { getHireCount } from "@/app/actions/bookings";
import { getRecruiterAccess } from "@/lib/recruiterAccess";
import { RecruiterPlanWall } from "@/components/recruiter/RecruiterPlanWall";
import SearchClient from "./SearchClient";

export const dynamic = 'force-dynamic';

export default async function HirePage() {
    // Server-side auth gate
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/register?role=recruiter&redirect=/hire');
    }

    // Soft paywall: recruiters need an active recruiter plan to use talent search.
    // Admins and (defensively) non-recruiters pass through.
    const access = await getRecruiterAccess();
    if (!access.hasAccess) {
        return <RecruiterPlanWall feature="AI Talent Search" />;
    }

    const [candidates, hireCount] = await Promise.all([getCandidates(), getHireCount()]);

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-transparent text-[#111827] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-500 text-sm font-mono animate-pulse">Loading Talent Pool...</p>
                </div>
            </div>
        }>
            <SearchClient initialCandidates={candidates} hireCount={hireCount} />
        </Suspense>
    );
}
