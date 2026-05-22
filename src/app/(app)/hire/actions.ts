'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface CandidateProfile {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    headline: string | null;
    location: string | null;
    bio: string | null;
    skills: string[];
    experienceCount: number;
    projectCount: number;
    connectionCount: number;
    relevanceScore?: number; // Only present when searching
}

function parseSkills(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}

const SELECT = {
    id: true,
    name: true,
    username: true,
    image: true,
    headline: true,
    location: true,
    bio: true,
    skills: true,
    _count: {
        select: {
            experience: true,
            projects: true,
            sentConnections: true,
        }
    }
} as const;

type RawUser = {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    headline: string | null;
    location: string | null;
    bio: string | null;
    skills: string | null;
    _count: { experience: number; projects: number; sentConnections: number };
};

function toProfile(u: RawUser, relevanceScore?: number): CandidateProfile {
    return {
        id: u.id,
        name: u.name || 'Unknown',
        username: u.username,
        image: u.image,
        headline: u.headline,
        location: u.location,
        bio: u.bio,
        skills: parseSkills(u.skills),
        experienceCount: u._count.experience,
        projectCount: u._count.projects,
        connectionCount: u._count.sentConnections,
        ...(relevanceScore !== undefined && { relevanceScore }),
    };
}

/** Fetch ALL non-ghost users (excluding current user). */
export async function getAllCandidates(): Promise<CandidateProfile[]> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const users = await prisma.user.findMany({
        where: {
            ghostMode: false,
            ...(currentUserId ? { id: { not: currentUserId } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: SELECT,
    }) as RawUser[];

    return users.map(u => toProfile(u));
}

/**
 * AI semantic search: scores candidates by relevance to natural language query.
 * Returns candidates with a relevanceScore (0–100) based on token match density.
 */
export async function searchCandidates(query: string): Promise<CandidateProfile[]> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return getAllCandidates();

    const users = await prisma.user.findMany({
        where: {
            ghostMode: false,
            ...(currentUserId ? { id: { not: currentUserId } } : {}),
            OR: tokens.flatMap(token => [
                { name: { contains: token, mode: 'insensitive' as const } },
                { headline: { contains: token, mode: 'insensitive' as const } },
                { bio: { contains: token, mode: 'insensitive' as const } },
                { skills: { contains: token, mode: 'insensitive' as const } },
            ])
        },
        take: 100,
        select: SELECT,
    }) as RawUser[];

    // Score by token frequency in combined text
    const maxPossible = tokens.length * 5; // rough ceiling
    const scored = users.map(u => {
        const text = [u.name, u.headline, u.bio, u.skills].join(' ').toLowerCase();
        const rawScore = tokens.reduce((acc, t) => acc + (text.split(t).length - 1), 0);
        const relevanceScore = Math.min(99, Math.round((rawScore / Math.max(maxPossible, 1)) * 100) + 40);
        return { u, relevanceScore };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.map(({ u, relevanceScore }) => toProfile(u, relevanceScore));
}
