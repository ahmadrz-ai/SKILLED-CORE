
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Candidate Application...");

    // 1. Find a User (Applicant)
    // We'll try to find a different user than the one who posted the job if possible, 
    // but for simulation any user is fine as long as they exist.
    const applicant = await prisma.user.findFirst();

    if (!applicant) {
        console.error("No users found.");
        return;
    }

    // 2. Find a Job
    const job = await prisma.job.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!job) {
        console.error("No jobs found. Please run 'simulate-job-post' first.");
        return;
    }

    console.log(`Applicant: ${applicant.email} (${applicant.id})`);
    console.log(`Job: ${job.title} (${job.id})`);

    // 3. Simulate Application (Replica of server action logic)

    // Check for existing
    const existing = await prisma.application.findUnique({
        where: {
            jobId_userId: {
                jobId: job.id,
                userId: applicant.id
            }
        }
    });

    if (existing) {
        console.log(`User has already applied. ID: ${existing.id}`);
        console.log("Duplicate check passed (if this was intended).");
        // For verification sake, we might want to delete it and re-apply to prove creation works, 
        // OR just log that logic holds.
        // Let's delete it to verify "Creation" works.
        await prisma.application.delete({ where: { id: existing.id } });
        console.log("Deleted existing application to test creation...");
    }

    // Create Application
    const application = await prisma.application.create({
        data: {
            jobId: job.id,
            userId: applicant.id,
            status: "PENDING"
        }
    });

    console.log(`✅ Application Created! ID: ${application.id}`);
    console.log(`   Status: ${application.status}`);

    // 4. Verify Duplicate Prevention
    console.log("Testing Duplicate Prevention...");
    try {
        await prisma.application.create({
            data: {
                jobId: job.id,
                userId: applicant.id,
                status: "PENDING"
            }
        });
        console.error("❌ FAILED: Duplicate application was allowed!");
    } catch (e: any) {
        if (e.code === 'P2002') {
            console.log("✅ SUCCESS: Duplicate application prevented (Prisma constraint caught).");
        } else {
            console.error("❌ ERROR during duplicate test:", e);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
