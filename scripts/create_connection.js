const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for users...");
    const me = await prisma.user.findFirst({
        where: { name: { contains: 'Ahmad', mode: 'insensitive' } }
    });
    const other = await prisma.user.findFirst({
        where: { name: { contains: 'Sarah', mode: 'insensitive' } }
    });

    if (!me || !other) {
        console.error("Could not find users", { me: me?.name, other: other?.name });
        return;
    }

    console.log(`Connecting ${me.name} (${me.id}) with ${other.name} (${other.id})`);

    // Delete existing
    await prisma.connection.deleteMany({
        where: {
            OR: [
                { requesterId: me.id, addresseeId: other.id },
                { requesterId: other.id, addresseeId: me.id }
            ]
        }
    });

    // Create Accepted Connection
    await prisma.connection.create({
        data: {
            requesterId: me.id,
            addresseeId: other.id,
            status: 'ACCEPTED'
        }
    });

    console.log("Connection created!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
