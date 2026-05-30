const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL
        }
    }
});

async function executeDatabaseSearch(searchQuery) {
    const STOP_WORDS = new Set(['with', 'experience', 'of', 'years', 'year', 'and', 'or', 'the', 'a', 'for', 'in', 'to', 'on', 'at', 'about', 'who', 'knows', 'who', 'know', 'has', 'have', 'with', 'skills', 'skill']);
    const searchTerms = searchQuery
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length >= 2 && !STOP_WORDS.has(s));

    console.log('Tokenized Search Terms:', searchTerms);

    let whereClause = {
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

    return scoredUsers.map(su => ({
        name: su.user.name,
        headline: su.user.headline,
        matchCount: su.matchCount,
        skillsCount: su.user.skills ? su.user.skills.length : 0
    }));
}

async function test() {
    console.log('--- TEST 1: financial officer ---');
    const res1 = await executeDatabaseSearch('financial officer with experience of 2+ years');
    console.log('Results:', res1);

    console.log('--- TEST 2: generative AI ---');
    const res2 = await executeDatabaseSearch('generative AI and Automations');
    console.log('Results:', res2);
}

test().catch(console.error).finally(() => prisma.$disconnect());
