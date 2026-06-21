import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { guardAiRoute } from "@/lib/apiGuard";

export const runtime = 'nodejs';

// Bot/test account name patterns
const TEST_NAME_PATTERNS = /^(test|testing|testings?|new|demo|sample|bot|fake|mock|openai)/i;
const PLACEHOLDER_BIO = "Experienced professional. Please update your profile with specific details.";
const PLACEHOLDER_ROLE = "Professional Role";
const PLACEHOLDER_COMPANY = "Company Name";

function calcCompleteness(user: {
    image?: string | null;
    bio?: string | null;
    skills?: string | null;
    experience?: any[];
    location?: string | null;
    name?: string | null;
}): number {
    let score = 0;
    if (user.image) score += 20;
    if (user.bio && user.bio.length >= 50 && user.bio !== PLACEHOLDER_BIO) score += 20;
    if (user.skills && user.skills.split(',').filter(s => s.trim()).length >= 2) score += 20;
    if (user.experience && user.experience.length > 0) score += 20;
    if (user.location && user.location !== 'Location' && user.location !== 'Remote') score += 20;
    return score;
}

function parseSkillsString(skillsStr: string | null | undefined): string[] {
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

interface Requirement {
    priority: number;
    label: string;
    searchTerms: string[];
    type: "primary" | "secondary" | "contextual" | "person-name";
    isHardFilter?: boolean;
    experienceLevel: "any" | "junior" | "mid" | "senior" | "expert" | null;
    notes: string;
}

export async function POST(req: Request) {
    try {
        // V1: require auth + rate limit — this runs expensive AI scoring AND
        // returns candidate profiles; it must not be open to anonymous callers.
        const guard = await guardAiRoute("score-candidates", 15, 60);
        if (guard instanceof Response) return guard;

        const body = await req.json();
        const { requirements } = body as { requirements: Requirement[] };

        if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
            return NextResponse.json({ error: "Requirements are required" }, { status: 400 });
        }

        // Whitelist ONLY public fields as requested by Correction 5
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
                }
            }
        });

        // Filter users exactly as in actions.ts to only keep active candidates
        const filteredCandidates = users.filter(user => {
            // Filter test/bot accounts by name pattern
            if (user.name && TEST_NAME_PATTERNS.test(user.name)) return false;

            // Filter placeholder profiles
            if (user.bio === PLACEHOLDER_BIO) return false;
            if (user.headline === PLACEHOLDER_ROLE) return false;
            if (user.company?.name === PLACEHOLDER_COMPANY) return false;

            // Profile completeness gate — hide profiles below 40%
            const completeness = calcCompleteness({
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

        // Step 1 — Apply hard filters BEFORE scoring
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

        if (eligibleCandidates.length === 0 && hardFilterRequirements.length > 0) {
            const nameReq = hardFilterRequirements.find(r => r.type === 'person-name');
            const term = nameReq ? (nameReq.searchTerms[0] || '') : '';
            return NextResponse.json({
                rows: [],
                message: `No candidates found named '${term}'...`
            });
        }

        // Scoring algorithm
        const scoredCandidates = eligibleCandidates.map(candidate => {
            const skillsArray = parseSkillsString(candidate.skills).map(s => s.toLowerCase());
            
            let totalBaseScore = 0;
            const requirementScores: { requirementLabel: string; score: number }[] = [];
            const matchedTermsSet = new Set<string>();

            // Calculate score for each requirement
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
                
                // 1. Skills Match (20 points max)
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

                // 2. Experience History (40 points max)
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
                        // Check for years mentions in description
                        if (/(years|yrs|\d+\+?\s*years)/i.test(descLower)) {
                            mentionsYearsKeywords = true;
                        }
                    }
                });

                // Multiple experience entries bonus
                if (experienceMentions > 1) {
                    expScore += 10;
                }
                expScore = Math.min(expScore, 40);

                // 3. Projects Scoring (25 points max) — Implementing Correction 2
                // project.technologies[] match → 25pts (highest, runs FIRST)
                // project name match → 20pts
                // project description match → 15pts
                // Only the highest matching check scores per project.
                let projScore = 0;
                let projectMentions = 0;

                candidate.projects.forEach(proj => {
                    const titleLower = proj.title.toLowerCase();
                    const descLower = (proj.description || '').toLowerCase();
                    // Just in case project.technologies is passed in memory/custom
                    const techArray = (proj as any).technologies 
                        ? (proj as any).technologies.map((t: string) => t.toLowerCase()) 
                        : [];

                    let projectTermMatched = false;
                    let projectBestScore = 0;

                    searchTermsLower.forEach(term => {
                        // Check technologies first (highest)
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

                // 4. Bio / Headline (15 points max)
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

                // 5. Experience Depth Bonus (0 to 30 extra points)
                let depthBonus = 0;
                // 3+ experience mentions: +20 points
                if (experienceMentions >= 3) {
                    depthBonus += 20;
                }
                // 2+ projects: +15 points
                if (projectMentions >= 2) {
                    depthBonus += 15;
                }
                // experience description mentions years: +15 points
                if (mentionsYearsKeywords) {
                    depthBonus += 15;
                }
                // verified badge matches this skill: +25 points
                const hasVerifiedBadge = candidate.assessments.some(ass => {
                    const title = ass.assessment.title.toLowerCase();
                    return searchTermsLower.some(term => title.includes(term));
                });
                if (hasVerifiedBadge) {
                    depthBonus += 25;
                }
                depthBonus = Math.min(depthBonus, 30);

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

            // Ultra / Pro Premium boost (only if base score >= 40)
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

            const parsedSkills = parseSkillsString(candidate.skills);
            if (parsedSkills.length === 0) {
                parsedSkills.push('Generalist');
            }

            const verifiedBadges = candidate.assessments.map(ass => ass.assessment.title);

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
                totalBaseScore, // helpful for rendering strength bar
                matchScore: Math.min(100, Math.round((totalScore / (130 * (requirements.length || 1))) * 100)),
                requirementScores,
                matchedTerms: Array.from(matchedTermsSet),
                verifiedBadges,
                experienceCount: candidate.experience.length,
                projectCount: candidate.projects.length,
                role,
                company,
                yearsOfExperience
            };
        });

        // Row Classification Logic
        const perfectMatches = scoredCandidates.filter(c => {
            // Relaxed threshold: scored >= 30 points on EVERY requirement (meaning it matches at least skill, title or bio)
            return c.requirementScores.every(reqScore => reqScore.score >= 30);
        });

        const slightMatches = scoredCandidates.filter(c => {
            // Relaxed: scored >= 20 points on at least 2 requirements (or at least 1 if only 1 requirement in query) AND total score is >= 30
            const metReqsCount = c.requirementScores.filter(reqScore => reqScore.score >= 20).length;
            const isNotPerfect = !perfectMatches.some(p => p.id === c.id);
            const minReqsToMeet = requirements.length === 1 ? 1 : 2;
            return isNotPerfect && metReqsCount >= minReqsToMeet && c.totalScore >= 30;
        });

        // Specific requirement rows (up to 6 requirements maximum)
        const requirementRows: any[] = [];
        const maxReqRows = Math.min(6, requirements.length);

        for (let i = 0; i < maxReqRows; i++) {
            const req = requirements[i];
            const searchTermsLower = req.searchTerms.map(t => t.toLowerCase());

            const reqCandidates = scoredCandidates
                .filter(c => {
                    // Relaxed: candidate scored >= 25 points on THAT specific requirement
                    const reqScoreObj = c.requirementScores.find(r => r.requirementLabel === req.label);
                    return reqScoreObj && reqScoreObj.score >= 25;
                })
                .sort((a, b) => {
                    const scoreA = a.requirementScores.find(r => r.requirementLabel === req.label)?.score || 0;
                    const scoreB = b.requirementScores.find(r => r.requirementLabel === req.label)?.score || 0;
                    // Sort descending by requirement score
                    if (scoreB !== scoreA) return scoreB - scoreA;
                    // Sort by total score
                    return b.totalScore - a.totalScore;
                });

            requirementRows.push({
                id: `req-row-${i}`,
                label: req.label,
                type: 'requirement',
                requirementPriority: req.priority,
                candidates: reqCandidates.slice(0, 8) // Max 8 per row
            });
        }

        // Sort Perfect Matches & Slight Matches: total score descending, ULTRA before PRO
        const sortRowCandidates = (list: typeof scoredCandidates) => {
            return [...list].sort((a, b) => {
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                // ULTRA before PRO, PRO before BASIC
                const planWeight = { ULTRA: 3, PRO: 2, BASIC: 1 };
                const weightA = planWeight[a.plan] || 1;
                const weightB = planWeight[b.plan] || 1;
                return weightB - weightA;
            });
        };

        const resultRows = [
            {
                id: 'perfect-matches',
                label: '⭐ Perfect Matches',
                type: 'perfect',
                candidates: sortRowCandidates(perfectMatches).slice(0, 10) // Max 10
            },
            {
                id: 'slight-matches',
                label: '🔵 Slightly Matched',
                type: 'slight',
                candidates: sortRowCandidates(slightMatches).slice(0, 10) // Max 10
            },
            ...requirementRows
        ].filter(row => row.candidates.length > 0); // Only render rows that have at least 1 candidate

        return NextResponse.json({ rows: resultRows });

    } catch (err: any) {
        console.error("Score candidates API error:", err);
        return NextResponse.json({ error: "Could not score candidates", details: err.message }, { status: 500 });
    }
}
