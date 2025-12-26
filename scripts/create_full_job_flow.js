const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) { console.log("No User"); return; }
    console.log("User:", user.email);

    // 1. Create Company
    console.log("Creating Company...");
    const company = await prisma.company.create({
        data: {
            name: "Test Corp Flow " + Date.now(),
            recruiters: { connect: { id: user.id } }
        }
    });
    console.log("Company ID:", company.id);

    // 2. Create Job
    console.log("Creating Job...");
    try {
        const job = await prisma.job.create({
            data: {
                title: "Full Flow Test Job",
                location: "New York",
                type: "Full-time",
                salaryMin: 50000,
                salaryMax: 100000,
                description: "Testing full flow script.",
                skills: "Prisma, Testing",
                companyId: company.id,
                userId: user.id
            }
        });
        console.log("Job Created Successfully:", job.id);
    } catch (e) {
        console.error("Job Creation Failed:");
        console.error(e);
    }
}

main()
    .catch((e) => { throw e; })
    .finally(async () => { await prisma.$disconnect(); });
