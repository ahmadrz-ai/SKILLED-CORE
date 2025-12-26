const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!user) {
        console.log("No Admin user found to test with.");
        return;
    }

    console.log(`Testing with user: ${user.name} (${user.id})`);

    try {
        console.log("Attempting to create job...");
        const job = await prisma.job.create({
            data: {
                title: "Test Mission Gama",
                company: {
                    create: {
                        name: "Test Corp Gamma",
                        recruiters: { connect: { id: user.id } }
                    }
                },
                location: "Remote",
                type: "Contract",
                salaryMin: 50000,
                salaryMax: 80000,
                description: "This is a test mission created via script.",
                skills: "Debugging, Node.js",
                userId: user.id
            }
        });
        console.log("Job created successfully. ID:", job.id);
    } catch (error) {
        console.error("FATAL ERROR creating job:");
        console.error(error);
        if (error.code) console.error("Error Code:", error.code);
        if (error.meta) console.error("Error Meta:", error.meta);
    }
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
