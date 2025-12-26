const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, name: true, email: true, role: true }
    });
    console.log("Users found:", JSON.stringify(users, null, 2));

    const connections = await prisma.connection.findMany({ take: 5 });
    console.log("Connections found:", JSON.stringify(connections, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
