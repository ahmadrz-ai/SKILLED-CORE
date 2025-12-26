const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Recruiter User...");
    const email = "recruiter@example.com";

    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: "Top Recruiter",
                headline: "Hiring Top Talent for Fortune 500",
                role: "RECRUITER",
                image: "https://i.pravatar.cc/150?u=recruiter",
                bannerUrl: "https://picsum.photos/seed/recruiter/800/200"
            }
        });
        console.log("Created Recruiter:", user.id);
    } else {
        console.log("Recruiter already exists:", user.id);
        // Ensure role is RECRUITER
        if (user.role !== 'RECRUITER') {
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'RECRUITER' }
            });
            console.log("Updated role to RECRUITER");
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
