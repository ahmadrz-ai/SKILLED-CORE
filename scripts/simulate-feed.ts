
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Social Feed System...");

    // 1. Get Users
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
        console.error("❌ Need at least 2 users to test feed.");
        return;
    }

    const author = users[0];
    const liker = users[1];

    console.log(`Author: ${author.email}`);
    console.log(`Liker/Commenter: ${liker.email}`);

    // 2. Create Post
    console.log("\n--- Creating Post ---");
    const post = await prisma.post.create({
        data: {
            content: "Hello World! This is a system check #verification",
            userId: author.id,
            tags: "verification",
            type: "TEXT"
        }
    });

    console.log(`✅ Post Created: ${post.id}`);

    // 3. Like Post
    console.log("\n--- Liking Post ---");
    await prisma.like.create({
        data: {
            postId: post.id,
            userId: liker.id
        }
    });
    console.log("✅ Post Liked.");

    // 4. Comment on Post
    console.log("\n--- Commenting on Post ---");
    const comment = await prisma.comment.create({
        data: {
            content: "Great post! 🚀",
            postId: post.id,
            userId: liker.id
        }
    });
    console.log(`✅ Comment Added: "${comment.content}"`);

    // 5. Verify Aggregates
    console.log("\n--- Verifying Stats ---");
    const fetchedPost = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
            likes: true,
            _count: { select: { comments: true } }
        }
    });

    if (fetchedPost) {
        console.log(`Likes: ${fetchedPost.likes.length} (Expected: 1)`);
        console.log(`Comments: ${fetchedPost._count.comments} (Expected: 1)`);

        if (fetchedPost.likes.length === 1 && fetchedPost._count.comments === 1) {
            console.log("✅ Feed Interaction Verified.");
        } else {
            console.error("❌ Stats Mismatch.");
        }
    } else {
        console.error("❌ Could not fetch post.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
