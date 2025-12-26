
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Running credit adjustment script...');

    try {
        const result = await prisma.user.updateMany({
            where: {
                credits: {
                    lt: 10
                }
            },
            data: {
                credits: 10
            }
        });

        console.log(`✅ Success: Updated ${result.count} users to minimum 10 credits.`);
    } catch (error) {
        console.error('❌ Error updating credits:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
