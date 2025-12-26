'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface Candidate {
    id: string;
    name: string;
    username: string; // Added username
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
}
// ...


export async function getCandidates(): Promise<Candidate[]> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const users = await prisma.user.findMany({
        where: {
            id: { not: currentUserId }, // Exclude self
            role: { in: ['CANDIDATE', 'OPEN_TO_WORK'] } // Assuming roles
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            company: { select: { name: true } },
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

    // Map Prisma Users to Candidate Interface
    return users.map(user => {
        // Parse skills if stored as comma-separated string
        const skillsArray = user.skills ? user.skills.split(',').map(s => s.trim()) : [];

        // Calculate connections count
        const connectionCount = (user._count.receivedConnections || 0) + (user._count.sentConnections || 0);

        // Mock Match Score (Random for MVP)
        const matchScore = Math.floor(Math.random() * (99 - 70 + 1)) + 70;

        // Calculate Years of Experience
        let yearsOfExperience = 0;
        if (user.experience && user.experience.length > 0) {
            // Simple calculation: sum of durations or max - min roughly
            // For MVP, lets just take the earliest start date difference from now
            // Or sum durations. Let's do difference between earliest start and now for simplicity (assuming continuous career)
            const sortedExp = [...user.experience].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            if (sortedExp.length > 0) {
                const start = new Date(sortedExp[0].startDate).getFullYear();
                const now = new Date().getFullYear();
                yearsOfExperience = Math.max(0, now - start);
            }
        }

        // Determine Role/Headline
        let role = "Software Engineer"; // Default
        if (user.experience && user.experience.length > 0) {
            role = user.experience[0].position; // Latest position
        } else if (user.headline) {
            role = user.headline;
        }

        // Determine Company
        let company = "Open to opportunities";
        if (user.experience && user.experience.length > 0) {
            company = user.experience[0].company;
        } else if (user.company?.name) {
            company = user.company.name;
        }

        return {
            id: user.id,
            name: user.name || "Anonymous User",
            username: user.username || `user-${user.id}`,
            headline: user.headline || "Skilled Professional",
            location: user.location || "Remote",
            role: role,
            company: company,
            skills: skillsArray.length > 0 ? skillsArray : ["Generalist"],
            matchScore: matchScore,
            verified: Math.random() > 0.8, // Mock verification for variety
            connections: connectionCount,
            bio: user.bio || "No bio provided.",
            avatar: user.image,
            yearsOfExperience: yearsOfExperience
        };
    });
}
