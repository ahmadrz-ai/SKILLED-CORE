
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Admin Approval...");

    // 1. Find PENDING transactions
    const pendingDetails = await prisma.transaction.findMany({
        where: { status: 'PENDING' },
        include: { user: true }
    });

    if (pendingDetails.length === 0) {
        console.log("No pending transactions found.");
        return;
    }

    console.log(`Found ${pendingDetails.length} pending transactions.`);

    for (const trx of pendingDetails) {
        console.log(`Approving TRX: ${trx.id} for User: ${trx.user?.email}`);
        console.log(`   Adding ${trx.credits} credits...`);

        // 2. Approve
        await prisma.$transaction([
            prisma.transaction.update({
                where: { id: trx.id },
                data: { status: 'COMPLETED' }
            }),
            prisma.user.update({
                where: { id: trx.userId },
                data: { credits: { increment: trx.credits } }
            })
        ]);

        console.log(`   ✅ Approved.`);
    }

    console.log("All done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
