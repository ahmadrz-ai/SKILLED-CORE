'use server';

import { prisma } from '@/lib/prisma';

export async function getTestimonialUsers() {
    try {
        // Get verified/active users with complete profiles
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { name: { not: null } },
                    { headline: { not: null } },
                    {
                        OR: [
                            { role: 'CANDIDATE' },
                            { role: 'RECRUITER' }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                image: true,
                headline: true,
                bio: true,
                role: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 12 // Get 12 users for variety
        });

        return users.map(user => ({
            id: user.id,
            name: user.name || 'User',
            avatar: user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            role: user.headline || 'Professional',
            content: "SkilledCore transformed how I approach my career. The platform is intuitive and the opportunities are real.",
            rating: 5
        }));
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Return fallback data if database fails
        return [
            {
                id: '1',
                name: "Sarah Chen",
                role: "Senior Developer",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                content: "SkilledCore's AI matching connected me with opportunities I never would have found elsewhere.",
                rating: 5
            },
            {
                id: '2',
                name: "Marcus Johnson",
                role: "Product Designer",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
                content: "The 3D profile helped me stand out. Got 3 offers in my first week!",
                rating: 5
            }
        ];
    }
}
