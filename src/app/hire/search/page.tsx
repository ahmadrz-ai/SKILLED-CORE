import { Suspense } from "react";
import { getCandidates } from "./actions";
import SearchClient from "./SearchClient";

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
    const candidates = await getCandidates();

    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Talent Pool...</div>}>
            <SearchClient initialCandidates={candidates} />
        </Suspense>
    );
}
