import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCandidates } from "./actions";
import SearchClient from "./SearchClient";

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
    // FIX-001: Server-side auth gate — do NOT rely on middleware alone
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/register?role=recruiter&redirect=/hire/search');
    }

    const candidates = await getCandidates();

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-400 text-sm font-mono">Loading Talent Pool...</p>
                </div>
            </div>
        }>
            <SearchClient initialCandidates={candidates} />
        </Suspense>
    );
}
