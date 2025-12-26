
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Payment Request...");

    // 1. Find a user (using the first one found or a specific email if known)
    const user = await prisma.user.findFirst();

    if (!user) {
        console.error("No users found to simulate request.");
        return;
    }

    console.log(`User found: ${user.email} (${user.id})`);

    // 2. Create Transaction (Pending)
    // We can't easily call the server action 'createPaymentRequest' from a standalone script 
    // because it depends on 'auth()'. 
    // So we will mimic what the server action does using Prisma directly.

    const trxId = "TEST-SCRIPT-" + Date.now();
    const amount = 5000; // $50.00
    const credits = 250;

    const transaction = await prisma.transaction.create({
        data: {
            userId: user.id,
            amount: amount,
            credits: credits,
            status: 'PENDING',
            provider: 'PAYONEER',
            refId: trxId,
            type: 'CREDITS'
        }
    });

    console.log(`✅ Transaction Created! ID: ${transaction.id}`);
    console.log(`   Ref: ${trxId}`);
    console.log(`   Status: ${transaction.status}`);
    console.log(`   Credits to add: ${credits}`);

    console.log("\nVerify this appears in /admin/billing now.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
