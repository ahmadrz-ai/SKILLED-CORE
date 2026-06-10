'use server';

import { prisma } from "@/lib/prisma";
import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";

interface Requirement {
    priority: number;
    label: string;
    searchTerms: string[];
    type: "primary" | "secondary" | "contextual" | "person-name";
    isHardFilter?: boolean;
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
    /** Interview-earned golden skills (server-gated VerifiedSkill rows). */
    goldenSkills: { name: string; score: number; interviewId: string | null }[];
    experienceCount: number;
    projectCount: number;
    role: string;
    company: string;
    yearsOfExperience: number;
}

interface ResultRow {
    id: string;
    label: string;
    type: 'verified' | 'perfect' | 'slight' | 'requirement';
    requirementPriority?: number;
    candidates: ScoredCandidate[];
}

interface SearchResult {
    parsedQuery: ParsedQuery | null;
    rows: ResultRow[];
    error?: string;
    message?: string;
}

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
};

async function executeDatabaseSearch(searchQuery: string): Promise<ResultRow[]> {
    const STOP_WORDS = new Set(['with', 'experience', 'of', 'years', 'year', 'and', 'or', 'the', 'a', 'for', 'in', 'to', 'on', 'at', 'about', 'who', 'knows', 'who', 'know', 'has', 'have', 'with', 'skills', 'skill']);
    const searchTerms = searchQuery
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length >= 2 && !STOP_WORDS.has(s));

    let whereClause: any = {
        role: { in: ['CANDIDATE', 'OPEN_TO_WORK'] },
        email: {
            not: { endsWith: '@test.com' }
        }
    };

    if (searchTerms.length > 0) {
        whereClause.OR = searchTerms.flatMap(term => [
            { name: { contains: term, mode: 'insensitive' } },
            { bio: { contains: term, mode: 'insensitive' } },
            { headline: { contains: term, mode: 'insensitive' } },
            { skills: { contains: term, mode: 'insensitive' } },
            {
                experience: {
                    some: {
                        OR: [
                            { position: { contains: term, mode: 'insensitive' } },
                            { company: { contains: term, mode: 'insensitive' } },
                            { description: { contains: term, mode: 'insensitive' } }
                        ]
                    }
                }
            },
            { location: { contains: term, mode: 'insensitive' } }
        ]);
    } else {
        whereClause.OR = [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { bio: { contains: searchQuery, mode: 'insensitive' } },
            { headline: { contains: searchQuery, mode: 'insensitive' } },
            { skills: { contains: searchQuery, mode: 'insensitive' } },
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
            { location: { contains: searchQuery, mode: 'insensitive' } }
        ];
    }

    const users = await prisma.user.findMany({
        where: whereClause,
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
                    endDate: true,
                    description: true
                },
                orderBy: { startDate: 'desc' }
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

    const scoredUsers = filteredUsers.map(user => {
        let matchCount = 0;
        const skillsStr = user.skills?.toLowerCase() || '';
        const nameStr = user.name?.toLowerCase() || '';
        const bioStr = user.bio?.toLowerCase() || '';
        const headlineStr = user.headline?.toLowerCase() || '';
        const locationStr = user.location?.toLowerCase() || '';

        const termsToTest = searchTerms.length > 0 ? searchTerms : [searchQuery.toLowerCase()];

        termsToTest.forEach(term => {
            let matched = false;
            if (nameStr.includes(term)) matched = true;
            else if (bioStr.includes(term)) matched = true;
            else if (headlineStr.includes(term)) matched = true;
            else if (skillsStr.includes(term)) matched = true;
            else if (locationStr.includes(term)) matched = true;
            else if (user.experience.some(exp => 
                (exp.position || '').toLowerCase().includes(term) ||
                (exp.company || '').toLowerCase().includes(term) ||
                (exp.description || '').toLowerCase().includes(term)
            )) matched = true;

            if (matched) {
                matchCount++;
            }
        });

        return {
            user,
            matchCount
        };
    });

    // Sort by matchCount descending
    scoredUsers.sort((a, b) => b.matchCount - a.matchCount);

    const mappedCandidates: ScoredCandidate[] = scoredUsers.map(({ user }) => {
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
            goldenSkills: [],
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

// Helper for profile completeness check
function calcProfileCompleteness(user: {
    image?: string | null;
    bio?: string | null;
    skills?: string | null;
    experience?: any[];
    location?: string | null;
    name?: string | null;
}): number {
    const PLACEHOLDER_BIO = "Experienced professional. Please update your profile with specific details.";
    let score = 0;
    if (user.image) score += 20;
    if (user.bio && user.bio.length >= 50 && user.bio !== PLACEHOLDER_BIO) score += 20;
    if (user.skills && user.skills.split(',').filter(s => s.trim()).length >= 2) score += 20;
    if (user.experience && user.experience.length > 0) score += 20;
    if (user.location && user.location !== 'Location' && user.location !== 'Remote') score += 20;
    return score;
}

// Helper to parse comma-separated or json-string skills
function parseSkillsArray(skillsStr: string | null | undefined): string[] {
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
}

// Main candidate scoring algorithm run directly in-memory on the server
async function executeScoreCandidates(requirements: Requirement[]): Promise<ResultRow[]> {
    const TEST_NAME_PATTERNS = /^(test|testing|testings?|new|demo|sample|bot|fake|mock|openai)/i;
    const PLACEHOLDER_BIO = "Experienced professional. Please update your profile with specific details.";
    const PLACEHOLDER_ROLE = "Professional Role";
    const PLACEHOLDER_COMPANY = "Company Name";

    const users = await prisma.user.findMany({
        where: {
            role: 'CANDIDATE',
            email: {
                not: { endsWith: '@test.com' }
            }
        },
        select: {
            id: true,
            name: true,
            username: true,
            headline: true,
            bio: true,
            location: true,
            image: true,
            plan: true,
            skills: true,
            createdAt: true,
            company: {
                select: {
                    name: true
                }
            },
            experience: {
                select: {
                    id: true,
                    position: true,
                    company: true,
                    description: true,
                    startDate: true,
                    endDate: true
                }
            },
            projects: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    link: true,
                    imageUrl: true
                }
            },
            assessments: {
                where: {
                    status: 'PASSED'
                },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    assessment: {
                        select: {
                            title: true
                        }
                    }
                }
            },
            // Interview-earned golden badges — issuance is server-gated (B1)
            verifiedSkills: {
                where: { status: 'VERIFIED' },
                select: { name: true, depthScore: true, interviewId: true },
                orderBy: { depthScore: 'desc' }
            }
        }
    });

    const filteredCandidates = users.filter(user => {
        if (user.name && TEST_NAME_PATTERNS.test(user.name)) return false;
        if (user.bio === PLACEHOLDER_BIO) return false;
        if (user.headline === PLACEHOLDER_ROLE) return false;
        if (user.company?.name === PLACEHOLDER_COMPANY) return false;

        const completeness = calcProfileCompleteness({
            image: user.image,
            bio: user.bio,
            skills: user.skills,
            experience: user.experience,
            location: user.location,
            name: user.name
        });
        if (completeness < 40) return false;

        return true;
    });

    const hardFilterRequirements = requirements.filter(r => r.isHardFilter || r.type === 'person-name');

    let eligibleCandidates = filteredCandidates;

    if (hardFilterRequirements.length > 0) {
        eligibleCandidates = filteredCandidates.filter(candidate => {
            return hardFilterRequirements.every(req => {
                if (req.type === 'person-name') {
                    const candidateName = (candidate.name ?? '').toLowerCase();
                    return req.searchTerms.some(term =>
                        candidateName.includes(term.toLowerCase())
                    );
                }
                return true;
            });
        });
    }

    const scoredCandidates = eligibleCandidates.map(candidate => {
        const skillsArray = parseSkillsArray(candidate.skills).map(s => s.toLowerCase());
        
        let totalBaseScore = 0;
        const requirementScores: { requirementLabel: string; score: number }[] = [];
        const matchedTermsSet = new Set<string>();

        requirements.forEach(req => {
            const rawSearchTerms = req.searchTerms.map(t => t.toLowerCase());
            const tokenSearchTerms = rawSearchTerms.flatMap(t => {
                const STOP_WORDS = new Set(['with', 'experience', 'of', 'years', 'year', 'and', 'or', 'the', 'a', 'for', 'in', 'to', 'on', 'at', 'about', 'who', 'knows', 'who', 'know', 'has', 'have', 'with', 'skills', 'skill']);
                return t
                    .split(/[\s,\-\/]+/)
                    .filter(Boolean)
                    .map(s => s.trim().toLowerCase())
                    .filter(s => s.length >= 2 && !STOP_WORDS.has(s));
            });
            const searchTermsLower = Array.from(new Set([...rawSearchTerms, ...tokenSearchTerms]));
            
            let skillScore = 0;
            searchTermsLower.forEach(term => {
                skillsArray.forEach(skill => {
                    if (skill === term) {
                        skillScore = Math.max(skillScore, 20);
                        matchedTermsSet.add(term);
                    } else if (skill.includes(term) || term.includes(skill)) {
                        skillScore = Math.max(skillScore, 10);
                        matchedTermsSet.add(term);
                    }
                });
            });

            let expScore = 0;
            let experienceMentions = 0;
            let mentionsYearsKeywords = false;

            candidate.experience.forEach(exp => {
                const titleLower = exp.position.toLowerCase();
                const descLower = (exp.description || '').toLowerCase();
                const companyLower = exp.company.toLowerCase();
                
                let expTermMatched = false;
                searchTermsLower.forEach(term => {
                    if (titleLower.includes(term)) {
                        expScore = Math.max(expScore, 40);
                        expTermMatched = true;
                        matchedTermsSet.add(term);
                    } else if (descLower.includes(term) || companyLower.includes(term)) {
                        expScore = Math.max(expScore, 25);
                        expTermMatched = true;
                        matchedTermsSet.add(term);
                    }
                });

                if (expTermMatched) {
                    experienceMentions++;
                    if (/(years|yrs|\d+\+?\s*years)/i.test(descLower)) {
                        mentionsYearsKeywords = true;
                    }
                }
            });

            if (experienceMentions > 1) {
                expScore += 10;
            }
            expScore = Math.min(expScore, 40);

            let projScore = 0;
            let projectMentions = 0;

            candidate.projects.forEach(proj => {
                const titleLower = proj.title.toLowerCase();
                const descLower = (proj.description || '').toLowerCase();
                const techArray = (proj as any).technologies 
                    ? (proj as any).technologies.map((t: string) => t.toLowerCase()) 
                    : [];

                let projectTermMatched = false;
                let projectBestScore = 0;

                searchTermsLower.forEach(term => {
                    if (techArray.includes(term)) {
                        projectBestScore = Math.max(projectBestScore, 25);
                        projectTermMatched = true;
                        matchedTermsSet.add(term);
                    } else if (titleLower.includes(term)) {
                        projectBestScore = Math.max(projectBestScore, 20);
                        projectTermMatched = true;
                        matchedTermsSet.add(term);
                    } else if (descLower.includes(term)) {
                        projectBestScore = Math.max(projectBestScore, 15);
                        projectTermMatched = true;
                        matchedTermsSet.add(term);
                    }
                });

                if (projectTermMatched) {
                    projectMentions++;
                }
                projScore += projectBestScore;
            });
            projScore = Math.min(projScore, 25);

            let bioHeadlineScore = 0;
            const headlineLower = (candidate.headline || '').toLowerCase();
            const bioLower = (candidate.bio || '').toLowerCase();

            searchTermsLower.forEach(term => {
                if (headlineLower.includes(term)) {
                    bioHeadlineScore = Math.max(bioHeadlineScore, 15);
                    matchedTermsSet.add(term);
                } else if (bioLower.includes(term)) {
                    bioHeadlineScore = Math.max(bioHeadlineScore, 10);
                    matchedTermsSet.add(term);
                }
            });

            let depthBonus = 0;
            if (experienceMentions >= 3) {
                depthBonus += 20;
            }
            if (projectMentions >= 2) {
                depthBonus += 15;
            }
            if (mentionsYearsKeywords) {
                depthBonus += 15;
            }
            const hasVerifiedBadge = candidate.assessments.some(ass => {
                const title = ass.assessment.title.toLowerCase();
                return searchTermsLower.some(term => title.includes(term));
            });
            if (hasVerifiedBadge) {
                depthBonus += 25;
            }
            depthBonus = Math.min(depthBonus, 30);
            // Interview-verified golden skill matching this requirement — the
            // strongest credential signal we have; added AFTER the generic cap.
            const hasGoldenMatch = (candidate.verifiedSkills || []).some(vs => {
                const n = vs.name.toLowerCase();
                return searchTermsLower.some(term => n.includes(term) || term.includes(n));
            });
            if (hasGoldenMatch) {
                depthBonus += 30;
            }

            let reqScore = skillScore + expScore + projScore + bioHeadlineScore + depthBonus;

            if (req.type === 'person-name') {
                let nameScore = 0;
                const candidateName = (candidate.name ?? '').toLowerCase();
                const nameTerms = req.searchTerms;

                for (const term of nameTerms) {
                    if (candidateName === term.toLowerCase()) {
                        nameScore = Math.max(nameScore, 100);
                    } else if (candidateName.startsWith(term.toLowerCase())) {
                        nameScore = Math.max(nameScore, 80);
                    } else if (candidateName.includes(term.toLowerCase())) {
                        nameScore = Math.max(nameScore, 60);
                    }
                }
                reqScore = nameScore + depthBonus;
            }

            requirementScores.push({ requirementLabel: req.label, score: reqScore });
            totalBaseScore += reqScore;
        });

        let premiumBoost = 0;
        if (totalBaseScore >= 40) {
            if (candidate.plan === 'ULTRA') {
                premiumBoost = 15;
            } else if (candidate.plan === 'PRO') {
                premiumBoost = 8;
            }
        }

        const totalScore = totalBaseScore + premiumBoost;

        let yearsOfExperience = 0;
        if (candidate.experience && candidate.experience.length > 0) {
            const sortedExp = [...candidate.experience].sort(
                (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );
            const start = new Date(sortedExp[0].startDate).getFullYear();
            yearsOfExperience = Math.max(0, new Date().getFullYear() - start);
        }

        let role = candidate.headline || 'Software Engineer';
        if (candidate.experience && candidate.experience.length > 0) {
            role = candidate.experience[0].position;
        }

        let company = 'Seeking Opportunities';
        if (candidate.experience && candidate.experience.length > 0) {
            company = candidate.experience[0].company;
        }

        const parsedSkills = parseSkillsArray(candidate.skills);
        if (parsedSkills.length === 0) {
            parsedSkills.push('Generalist');
        }

        const goldenSkills = (candidate.verifiedSkills || []).map(vs => ({
            name: vs.name,
            score: vs.depthScore,
            interviewId: vs.interviewId ?? null,
        }));
        // verifiedBadges feeds the "Verified only" filter — golden interview skills
        // count as verification alongside legacy assessment titles.
        const verifiedBadges = [
            ...candidate.assessments.map(ass => ass.assessment.title),
            ...goldenSkills.map(g => g.name),
        ];

        return {
            id: candidate.id,
            name: candidate.name || 'Anonymous User',
            username: candidate.username || `user-${candidate.id}`,
            headline: candidate.headline || 'Skilled Professional',
            location: candidate.location || 'Remote',
            avatarUrl: candidate.image,
            plan: (candidate.plan || 'BASIC') as 'ULTRA' | 'PRO' | 'BASIC',
            skills: parsedSkills,
            totalScore,
            totalBaseScore,
            matchScore: Math.min(100, Math.round((totalScore / (130 * (requirements.length || 1))) * 100)),
            requirementScores,
            matchedTerms: Array.from(matchedTermsSet),
            verifiedBadges,
            goldenSkills,
            experienceCount: candidate.experience.length,
            projectCount: candidate.projects.length,
            role,
            company,
            yearsOfExperience
        };
    });

    const perfectMatches = scoredCandidates.filter(c => {
        return c.requirementScores.every(reqScore => reqScore.score >= 30);
    });

    const slightMatches = scoredCandidates.filter(c => {
        const metReqsCount = c.requirementScores.filter(reqScore => reqScore.score >= 20).length;
        const isNotPerfect = !perfectMatches.some(p => p.id === c.id);
        const minReqsToMeet = requirements.length === 1 ? 1 : 2;
        return isNotPerfect && metReqsCount >= minReqsToMeet && c.totalScore >= 30;
    });

    const requirementRows: any[] = [];
    const maxReqRows = Math.min(6, requirements.length);

    for (let i = 0; i < maxReqRows; i++) {
        const req = requirements[i];
        const reqCandidates = scoredCandidates
            .filter(c => {
                const reqScoreObj = c.requirementScores.find(r => r.requirementLabel === req.label);
                return reqScoreObj && reqScoreObj.score >= 25;
            })
            .sort((a, b) => {
                const scoreA = a.requirementScores.find(r => r.requirementLabel === req.label)?.score || 0;
                const scoreB = b.requirementScores.find(r => r.requirementLabel === req.label)?.score || 0;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return b.totalScore - a.totalScore;
            });

        requirementRows.push({
            id: `req-row-${i}`,
            label: req.label,
            type: 'requirement',
            requirementPriority: req.priority,
            candidates: reqCandidates.slice(0, 8)
        });
    }

    const sortRowCandidates = (list: typeof scoredCandidates) => {
        return [...list].sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            const planWeight = { ULTRA: 3, PRO: 2, BASIC: 1 };
            const weightA = planWeight[a.plan] || 1;
            const weightB = planWeight[b.plan] || 1;
            return weightB - weightA;
        });
    };

    // Row 1 — Verified Skills (B8): candidates whose interview-verified golden
    // skill matches the search, ranked by verified score then overall match.
    const allSearchTermsLower = requirements.flatMap(r => r.searchTerms.map(t => t.toLowerCase()));
    const verifiedSkillHolders = scoredCandidates
        .filter(c => c.goldenSkills.some(g => {
            const n = g.name.toLowerCase();
            return allSearchTermsLower.some(term => n.includes(term) || term.includes(n));
        }))
        .sort((a, b) => {
            const bestA = Math.max(...a.goldenSkills.map(g => g.score), 0);
            const bestB = Math.max(...b.goldenSkills.map(g => g.score), 0);
            if (bestB !== bestA) return bestB - bestA;
            return b.totalScore - a.totalScore;
        });

    const resultRows = [
        {
            id: 'verified-skills',
            label: '🏅 Verified Skills',
            type: 'verified',
            candidates: verifiedSkillHolders.slice(0, 10)
        },
        {
            id: 'perfect-matches',
            label: '⭐ Perfect Matches',
            type: 'perfect',
            candidates: sortRowCandidates(perfectMatches).slice(0, 10)
        },
        {
            id: 'slight-matches',
            label: '🔵 Slightly Matched',
            type: 'slight',
            candidates: sortRowCandidates(slightMatches).slice(0, 10)
        },
        ...requirementRows
    ].filter(row => row.candidates.length > 0);

    return resultRows;
}

export async function searchTalent(query: string): Promise<SearchResult> {
    if (!query || !query.trim()) {
        return { parsedQuery: null, rows: [], error: "Search query is empty" };
    }

    try {
        console.log(`[Talent Search Action] Parsing query: "${query}" in-memory`);

        const prompt = `You are an expert technical recruiter assistant.
A recruiter has typed this search query:
"${query}"

Extract all the requirements they are looking for and rank them
by priority. The first requirement mentioned or the most emphasized
skill is Priority 1 (highest). Additional skills follow in order.

Return ONLY valid JSON with no markdown, no backticks, no preamble:
{
  "requirements": [
    {
      "priority": number,
      "label": "Human readable label — e.g. React Developer",
      "searchTerms": ["react", "reactjs", "react.js", "react developer"],
      "type": "primary" | "secondary" | "contextual" | "person-name",
      "isHardFilter": boolean,
      "experienceLevel": "any" | "junior" | "mid" | "senior" | "expert" | null,
      "notes": "any context from the query about this requirement"
    }
  ],
  "industry": "industry context if mentioned — e.g. Restaurant, Finance, Healthcare — or null",
  "queryIntent": "one sentence summary of what recruiter wants"
}

SPECIAL REQUIREMENT TYPES:
When the query explicitly contains a specific person's name (e.g., "find [Name]", "named [Name]", "person called [Name]"), mark that requirement with:
  type: "person-name"
  isHardFilter: true
  priority: 0  (highest — above all skill requirements)

A person-name requirement means ONLY candidates whose name contains that string should appear in results. Everyone else is excluded.
DO NOT extract a person-name requirement unless a specific person's name is explicitly written in the recruiter query.

Detection patterns for names in the search query:
  "named [Name]", "called [Name]", "find [Name]", "person [Name]", "[Name] who knows", "[Name] with experience", "looking for [Name]"

Rules:
- Extract every distinct requirement from the query, no matter how small.
- For each requirement, you MUST include a rich, comprehensive list of searchTerms (aim for 5-10 terms per requirement) to enable fuzzy semantic matching. This list should include:
    1. Common abbreviations, acronyms, and aliases (e.g. for "Machine Learning" include "ml", "machine learning", "deep learning", "ai", "artificial intelligence"; for "TypeScript" include "ts", "typescript", "javascript", "js").
    2. Variations in spacing, symbols, and suffixes (e.g. "React.js", "reactjs", "react", "react dev", "react developer").
    3. Common alternative spellings or typical spelling variations and typos (e.g. "python" -> "pyton", "pythn"; "PostgreSQL" -> "postgres", "postgresql", "postgre", "sql").
    4. For specific frameworks or tools, include parent languages and related core tech (e.g. for "Next.js" include "nextjs", "next.js", "react", "reactjs", "frontend", "front-end", "javascript", "typescript").
    5. For generic roles or tasks, include common synonyms and primary sub-skills (e.g. for "Data Scientist" include "data science", "data scientist", "machine learning", "python", "pandas", "numpy", "statistics").
- Determine experience level from context words:
    experienced / senior / expert / years → senior or expert
    junior / entry / beginner / learning → junior
    knowledge of / familiar with / knows → any (not requiring expertise)
- Never invent requirements not mentioned in the query.
- Return ONLY JSON.`;

        let parsedQuery: ParsedQuery | null = null;
        
        try {
            const result = await executeAI(
                'search',
                [
                    {
                        role: 'system',
                        content: 'You are a talent search query parser. Return ONLY valid JSON. No markdown. No backticks.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                {
                    temperature: 0.1,
                    maxTokens: 2048,
                    jsonMode: true,
                }
            );

            const rawResponse = result.choices[0].message.content;
            parsedQuery = parseAIJson<ParsedQuery>(rawResponse);
            console.log("[Talent Search Action] Parse succeeded:", parsedQuery.queryIntent);
        } catch (aiErr: any) {
            console.error("[Talent Search Action] AI query parse failed, falling back to db search:", aiErr?.message || aiErr);
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

        if (!parsedQuery || !parsedQuery.requirements || parsedQuery.requirements.length === 0) {
            const fallbackRows = await executeDatabaseSearch(query);
            return {
                parsedQuery,
                rows: fallbackRows
            };
        }

        // 2. Score Candidates directly in-memory
        console.log(`[Talent Search Action] Scoring candidates in-memory against ${parsedQuery.requirements.length} requirements`);
        const rows = await executeScoreCandidates(parsedQuery.requirements);

        const hardFilterRequirements = parsedQuery.requirements.filter(r => r.isHardFilter || r.type === 'person-name');
        if (rows.length === 0 && hardFilterRequirements.length > 0) {
            const nameReq = hardFilterRequirements.find(r => r.type === 'person-name');
            const term = nameReq ? (nameReq.searchTerms[0] || '') : '';
            return {
                parsedQuery,
                rows: [],
                message: `No candidates found named '${term}'...`
            };
        }

        if (rows.length === 0) {
            console.log("[Talent Search Action] In-memory AI search returned 0 results. Executing DB fallback search.");
            const fallbackRows = await executeDatabaseSearch(query);
            return {
                parsedQuery,
                rows: fallbackRows
            };
        }

        return {
            parsedQuery,
            rows
        };

    } catch (err: any) {
        console.error("[Talent Search Action] Unexpected searchTalent exception:", err);
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
            console.error("[Talent Search Action] Fallback search also failed:", fallbackErr);
            return {
                parsedQuery: null,
                rows: [],
                error: "Search failed: " + err.message
            };
        }
    }
}
