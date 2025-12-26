
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInterviews() {
    try {
        const count = await prisma.interview.count();
        console.log(`Total Interviews: ${count}`);

        const latest = await prisma.interview.findFirst({
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        if (latest) {
            console.log("Latest Interview:", JSON.stringify(latest, null, 2));
        } else {
            console.log("No interviews found.");
        }
    } catch (e) {
        console.error("Error checking interviews:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkInterviews();
