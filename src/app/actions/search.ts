'use server';

import { prisma } from "@/lib/prisma";

export async function getSearchSuggestions(query: string) {
    if (!query || query.length < 2) return { users: [], tags: [] };

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } },
                    { headline: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 5,
            select: {
                id: true,
                name: true,
                username: true,
                image: true
            }
        });

        // Mock tags for now
        const tags = ['AI', 'React', 'NextJS', 'TypeScript'].filter(t => t.toLowerCase().includes(query.toLowerCase()));

        return { users, tags };
    } catch (error) {
        console.error("Search suggestions error:", error);
        return { users: [], tags: [] };
    }
}
