const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!user) {
        console.log("No Admin user found.");
        return;
    }

    console.log(`Connecting User ${user.email} to Test Company...`);

    try {
        const company = await prisma.company.create({
            data: {
                name: "Test Company Delta " + Date.now(),
                recruiters: { connect: { id: user.id } }
            }
        });
        console.log("Company created and user connected:", company.id);
    } catch (error) {
        console.error("FATAL ERROR:");
        console.log(error.message);
    }
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
