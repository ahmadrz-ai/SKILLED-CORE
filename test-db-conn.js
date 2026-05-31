const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: 'support', mode: 'insensitive' } },
          { username: { equals: 'support', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        twoFactorEnabled: true,
      }
    });
    console.log("Database query successful!");
    console.log("User details found:", user);
  } catch (err) {
    console.error("Database connection or query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
