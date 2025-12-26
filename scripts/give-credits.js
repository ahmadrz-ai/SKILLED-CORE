
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function giveCredits() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found.");
            return;
        }
        console.log(`Giving 100 credits to user: ${user.email} (${user.id})`);

        await prisma.user.update({
            where: { id: user.id },
            data: { credits: 100 }
        });

        console.log("Credits updated successfully.");
    } catch (e) {
        console.error("Error updating credits:", e);
    } finally {
        await prisma.$disconnect();
    }
}

giveCredits();
