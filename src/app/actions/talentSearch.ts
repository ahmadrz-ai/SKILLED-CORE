'use server';

import { prisma } from "@/lib/prisma";

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

async function executeDatabaseSearch(searchQuery: string): Promise<ResultRow[]> {
    const users = await prisma.user.findMany({
        where: {
            AND: [
                { role: { in: ['CANDIDATE', 'OPEN_TO_WORK'] } },
                {
                    email: {
                        not: { endsWith: '@test.com' }
                    }
                },
                {
                    OR: [
                        {
                            name: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        },
                        {
                            bio: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        },
                        {
                            headline: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        },
                        {
                            skills: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        },
                        {
                            experience: {
                                some: {
                                    OR: [
                                        { position: { contains: searchQuery, mode: 'insensitive' } },
                                        { company: { contains: searchQuery, mode: 'insensitive' } },
                                        { description: { contains: searchQuery, mode: 'insensitive' } }
                                    ]
                                }
                            }
                        },
                        {
                            location: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            ]
        },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            headline: true,
            bio: true,
            location: true,
            skills: true,
            plan: true,
            experience: {
                select: {
                    position: true,
                    company: true,
                    startDate: true,
                    endDate: true
                },
                orderBy: { startDate: 'desc' },
                take: 2
            },
            projects: {
                select: {
                    id: true
                }
            }
        },
        take: 50,
        orderBy: {
            createdAt: 'desc'
        }
    });

    const TEST_NAME_PATTERNS = /^(test|testing|testings?|new|demo|sample|bot|fake|mock|openai)/i;
    const PLACEHOLDER_BIO = "Experienced professional. Please update your profile with specific details.";
    const PLACEHOLDER_ROLE = "Professional Role";

    const filteredUsers = users.filter(user => {
        if (user.name && TEST_NAME_PATTERNS.test(user.name)) return false;
        if (user.bio === PLACEHOLDER_BIO) return false;
        if (user.headline === PLACEHOLDER_ROLE) return false;
        return true;
    });

    const mappedCandidates: ScoredCandidate[] = filteredUsers.map(user => {
        const parseSkillsString = (skillsStr: string | null | undefined): string[] => {
            if (!skillsStr) return [];
            const trimmed = skillsStr.trim();
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        return parsed.map(s => {
                            if (s && typeof s === 'object') return String(s.name || '');
                            return String(s);
                        }).map(s => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
                    }
                } catch (e) {}
            }
            return trimmed.split(',').map(s => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
        };

        const skillsArray = parseSkillsString(user.skills);

        let yearsOfExperience = 0;
        if (user.experience && user.experience.length > 0) {
            const sortedExp = [...user.experience].sort(
                (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );
            const start = new Date(sortedExp[0].startDate).getFullYear();
            yearsOfExperience = Math.max(0, new Date().getFullYear() - start);
        }

        let role = user.headline || 'Software Engineer';
        if (user.experience && user.experience.length > 0) {
            role = user.experience[0].position;
        }

        let company = 'Seeking Opportunities';
        if (user.experience && user.experience.length > 0) {
            company = user.experience[0].company;
        }

        return {
            id: user.id,
            name: user.name || 'Anonymous User',
            username: user.username || `user-${user.id}`,
            headline: user.headline || 'Skilled Professional',
            location: user.location || 'Remote',
            avatarUrl: user.image,
            plan: (user.plan || 'BASIC') as 'ULTRA' | 'PRO' | 'BASIC',
            skills: skillsArray.length > 0 ? skillsArray : ['Generalist'],
            totalScore: 100,
            totalBaseScore: 100,
            requirementScores: [],
            matchedTerms: [],
            verifiedBadges: [],
            experienceCount: user.experience.length,
            projectCount: user.projects?.length || 0,
            role,
            company,
            yearsOfExperience
        };
    });

    if (mappedCandidates.length === 0) {
        return [];
    }

    return [
        {
            id: 'database-matches',
            label: '🔍 Search Results (Database Match)',
            type: 'perfect',
            candidates: mappedCandidates
        }
    ];
}

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
            console.error("Parse query API failed, falling back to database search:", errData);
            const fallbackRows = await executeDatabaseSearch(query);
            return {
                parsedQuery: {
                    requirements: [{ priority: 1, label: query, searchTerms: [query], type: "primary", experienceLevel: "any", notes: "Fallback requirement" }],
                    industry: null,
                    queryIntent: `Search for "${query}"`
                },
                rows: fallbackRows
            };
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
            console.error("Score candidates API failed, falling back to database search:", errData);
            const fallbackRows = await executeDatabaseSearch(query);
            return {
                parsedQuery,
                rows: fallbackRows
            };
        }

        const scoreData = (await scoreRes.json()) as { rows: ResultRow[] };

        if (scoreData.rows.length === 0) {
            console.log("AI search returned zero results. Executing Prisma database search fallback for query:", query);
            const fallbackRows = await executeDatabaseSearch(query);
            return {
                parsedQuery,
                rows: fallbackRows
            };
        }

        return {
            parsedQuery,
            rows: scoreData.rows
        };

    } catch (err: any) {
        console.error("searchTalent server action exception, falling back to database search:", err);
        try {
            const fallbackRows = await executeDatabaseSearch(query);
            return {
                parsedQuery: {
                    requirements: [{ priority: 1, label: query, searchTerms: [query], type: "primary", experienceLevel: "any", notes: "Fallback requirement" }],
                    industry: null,
                    queryIntent: `Search for "${query}"`
                },
                rows: fallbackRows
            };
        } catch (fallbackErr: any) {
            console.error("Database fallback search also failed:", fallbackErr);
            return {
                parsedQuery: null,
                rows: [],
                error: "Search failed: " + err.message
            };
        }
    }
}
