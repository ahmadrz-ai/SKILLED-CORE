'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export interface Candidate {
    id: string;
    name: string;
    username: string;
    headline: string;
    location: string;
    role: string;
    company: string;
    skills: string[];
    matchScore: number;
    verified: boolean;
    connections: number;
    bio: string;
    avatar?: string | null;
    yearsOfExperience: number;
    isGhostHidden?: boolean; // for ghost-protected profiles
}

// Bot/test account name patterns
const TEST_NAME_PATTERNS = /^(test|testing|testings?|new|demo|sample|bot|fake|mock|openai)/i;
const PLACEHOLDER_BIO = "Experienced professional. Please update your profile with specific details.";
const PLACEHOLDER_ROLE = "Professional Role";
const PLACEHOLDER_COMPANY = "Company Name";

/**
 * Calculates a profile completeness score (0–100).
 * Profiles below 40% are hidden from recruiter search.
 */
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

/**
 * Auth-gated candidate search with Ghost Protocol filter.
 * - Returns 401-equivalent redirect for unauthenticated callers.
 * - Filters ghost-protected candidates whose employer domain matches the recruiter's company domain.
 * - Filters incomplete and test/bot profiles.
 */
export async function getCandidates(): Promise<Candidate[]> {
    // --- Require authentication ---
    const session = await auth();
    if (!session?.user?.id) {
        // Server action: redirect to register with return URL
        redirect('/register?role=recruiter&redirect=/hire');
    }

    const currentUserId = session.user.id;

    // Get recruiter's company domain for Ghost Protocol comparison
    const recruiter = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { company: { select: { website: true, name: true } } }
    });

    // Extract recruiter's company domain from website URL
    let recruiterDomain: string | null = null;
    if (recruiter?.company?.website) {
        try {
            recruiterDomain = new URL(recruiter.company.website).hostname.replace('www.', '').toLowerCase();
        } catch {
            recruiterDomain = null;
        }
    }

    const users = await prisma.user.findMany({
        where: {
            id: { not: currentUserId },
            role: { in: ['CANDIDATE', 'OPEN_TO_WORK'] },
            email: {
                not: { endsWith: '@test.com' }
            }
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            company: { select: { name: true, website: true } },
            experience: {
                orderBy: { startDate: 'desc' },
                take: 10
            },
            _count: {
                select: {
                    receivedConnections: { where: { status: 'ACCEPTED' } },
                    sentConnections: { where: { status: 'ACCEPTED' } }
                }
            }
        }
    });

    return users
        .filter(user => {
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
        })
        .map(user => {
            const parseSkillsString = (skillsStr: string | null | undefined): string[] => {
                if (!skillsStr) return [];
                const trimmed = skillsStr.trim();
                if (trimmed.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            return parsed.map(s => String(s).replace(/[\[\]"']/g, '').trim()).filter(Boolean);
                        }
                    } catch (e) {}
                }
                return trimmed.split(',').map(s => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
            };
            const skillsArray = parseSkillsString(user.skills);
            const connectionCount = (user._count.receivedConnections || 0) + (user._count.sentConnections || 0);

            // Deterministic match score based on user ID hash (not random — avoids re-render flicker)
            const matchScore = 70 + (user.id.charCodeAt(0) + user.id.charCodeAt(1)) % 30;

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
            } else if (user.company?.name) {
                company = user.company.name;
            }

            // --- Ghost Protocol filter ---
            // If candidate has ghostMode enabled AND the recruiter's company domain
            // matches the candidate's current employer domain → mask the profile.
            let isGhostHidden = false;
            if (user.ghostMode && recruiterDomain) {
                const recruiterCompanyNormalized = (recruiter?.company?.name || '').toLowerCase().replace(/\s+/g, '');
                const candidateCompanyNormalized = company.toLowerCase().replace(/\s+/g, '');

                if (
                    recruiterDomain.includes(candidateCompanyNormalized) ||
                    candidateCompanyNormalized.includes(recruiterCompanyNormalized)
                ) {
                    isGhostHidden = true;
                }
            }

            if (isGhostHidden) {
                // Return anonymized ghost profile — recruiter sees it exists but no PII
                return {
                    id: user.id,
                    name: 'Anonymous Candidate',
                    username: 'ghost-profile',
                    headline: 'Profile hidden from your organization',
                    location: 'Undisclosed',
                    role: role, // still show role
                    company: '🔒 Hidden from your organization',
                    skills: skillsArray,
                    matchScore: matchScore,
                    verified: false,
                    connections: 0,
                    bio: 'This candidate has Ghost Protocol enabled and is hidden from your organization.',
                    avatar: null,
                    yearsOfExperience: yearsOfExperience,
                    isGhostHidden: true
                };
            }

            return {
                id: user.id,
                name: user.name || 'Anonymous User',
                username: user.username || `user-${user.id}`,
                headline: user.headline || 'Skilled Professional',
                location: user.location || 'Remote',
                role: role,
                company: company,
                skills: skillsArray.length > 0 ? skillsArray : ['Generalist'],
                matchScore: matchScore,
                verified: false,
                connections: connectionCount,
                bio: user.bio || 'No bio provided.',
                avatar: user.image,
                yearsOfExperience: yearsOfExperience,
                isGhostHidden: false
            };
        });
}
