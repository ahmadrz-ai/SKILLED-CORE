const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const postId = "d19243f9-4e98-4fce-97e6-1f561bf027aa";
    console.log(`Fetching post with ID ${postId}...`);
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: true,
            likes: true,
            _count: {
                select: { comments: true }
            }
        }
    });
    console.log("Post found:", JSON.stringify(post, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
