
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Job Posting Credit Deduction...");

    // 1. Find a user with credits
    const user = await prisma.user.findFirst({
        where: { credits: { gte: 1 } }
    });

    if (!user) {
        console.error("No user with enough credits found. Please run 'simulate-payment' and 'verify-billing' first.");
        return;
    }

    const initialCredits = user.credits;
    console.log(`User found: ${user.email} (${user.id})`);
    console.log(`Initial Credits: ${initialCredits}`);

    // 2. Simulate Job Creation Logic (Replica of server action logic)
    // Decrement Credit
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
        select: { credits: true }
    });

    // Create Job (Mock data)
    const company = await prisma.company.create({
        data: {
            name: "Test Corp " + Date.now(),
            recruiters: { connect: { id: user.id } }
        }
    });

    const job = await prisma.job.create({
        data: {
            title: "Test Job " + Date.now(),
            location: "Remote",
            description: "Test Description",
            companyId: company.id,
            userId: user.id,
            status: "OPEN",
            type: "Full-time",
            workplaceType: "Remote",
            experienceLevel: "Junior",
            skills: "Test, Debugging",
            applyMethod: "easy"
        }
    });

    console.log(`✅ Job Created: ${job.title} (${job.id})`);
    console.log(`Old Credits: ${initialCredits}`);
    console.log(`New Credits: ${updatedUser.credits}`);

    if (updatedUser.credits === initialCredits - 1) {
        console.log("SUCCESS: 1 Credit deducted correctly.");
    } else {
        console.error("FAILURE: Credit calculation mismatch.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
