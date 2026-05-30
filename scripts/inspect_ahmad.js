const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Ahmad' } },
        { username: 'ahmii' }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      skills: true,
      bio: true,
      headline: true,
      location: true
    }
  });
  console.log('Ahmad users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
