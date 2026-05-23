const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- LATEST USERS ---');
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        users.forEach(u => {
            console.log(`ID: ${u.id} | Name: ${u.name} | Username: ${u.username} | Email: ${u.email} | Verified: ${u.emailVerified} | Created: ${u.createdAt}`);
        });

        console.log('\n--- VERIFICATION TOKENS ---');
        const tokens = await prisma.verificationToken.findMany({
            orderBy: { expires: 'desc' },
            take: 10
        });
        tokens.forEach(t => {
            console.log(`Identifier (Email): ${t.identifier} | Token: ${t.token} | Expires: ${t.expires}`);
        });

    } catch (error) {
        console.error('Error querying DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
