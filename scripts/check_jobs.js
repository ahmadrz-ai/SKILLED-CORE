const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.job.count();
    console.log(`Total jobs in database: ${count}`);
    const jobs = await prisma.job.findMany({ take: 5 });
    console.log(JSON.stringify(jobs, null, 2));
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
