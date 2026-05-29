'use server';

interface Requirement {
    priority: number;
    label: string;
    searchTerms: string[];
    type: "primary" | "secondary" | "contextual";
    experienceLevel: "any" | "junior" | "mid" | "senior" | "expert" | null;
    notes: string;
}

interface ParsedQuery {
    requirements: Requirement[];
    industry: string | null;
    queryIntent: string;
}

interface ScoredCandidate {
    id: string;
    name: string;
    username: string;
    headline: string | null;
    location: string | null;
    avatarUrl: string | null;
    plan: 'ULTRA' | 'PRO' | 'BASIC';
    skills: string[];
    totalScore: number;
    totalBaseScore: number;
    requirementScores: { requirementLabel: string; score: number }[];
    matchedTerms: string[];
    verifiedBadges: string[];
    experienceCount: number;
    projectCount: number;
    role: string;
    company: string;
    yearsOfExperience: number;
}

interface ResultRow {
    id: string;
    label: string;
    type: 'perfect' | 'slight' | 'requirement';
    requirementPriority?: number;
    candidates: ScoredCandidate[];
}

interface SearchResult {
    parsedQuery: ParsedQuery | null;
    rows: ResultRow[];
    error?: string;
}

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
};

export async function searchTalent(query: string): Promise<SearchResult> {
    if (!query || !query.trim()) {
        return { parsedQuery: null, rows: [], error: "Search query is empty" };
    }

    try {
        const baseUrl = getBaseUrl();

        // 1. Call Parse Query API
        const parseRes = await fetch(`${baseUrl}/api/talent-search/parse-query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
            cache: 'no-store'
        });

        if (!parseRes.ok) {
            const errData = await parseRes.json().catch(() => ({}));
            console.error("Parse query API failed:", errData);
            return { parsedQuery: null, rows: [], error: errData.error || "Failed to parse search query" };
        }

        const parsedQuery = (await parseRes.json()) as ParsedQuery;

        // 2. Call Score Candidates API
        const scoreRes = await fetch(`${baseUrl}/api/talent-search/score-candidates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requirements: parsedQuery.requirements }),
            cache: 'no-store'
        });

        if (!scoreRes.ok) {
            const errData = await scoreRes.json().catch(() => ({}));
            console.error("Score candidates API failed:", errData);
            return { parsedQuery, rows: [], error: errData.error || "Failed to score candidates against query" };
        }

        const scoreData = (await scoreRes.json()) as { rows: ResultRow[] };

        return {
            parsedQuery,
            rows: scoreData.rows
        };

    } catch (err: any) {
        console.error("searchTalent server action exception:", err);
        return {
            parsedQuery: null,
            rows: [],
            error: "An unexpected error occurred during search: " + err.message
        };
    }
}
