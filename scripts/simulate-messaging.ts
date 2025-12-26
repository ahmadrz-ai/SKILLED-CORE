
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Messaging System...");

    // 1. Get Users
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
        console.error("❌ Need at least 2 users to test messaging.");
        return;
    }

    const sender = users[0];
    const recipient = users[1];

    console.log(`Sender: ${sender.email} (${sender.id})`);
    console.log(`Recipient: ${recipient.email} (${recipient.id})`);

    // 2. Simulate Start Conversation / Send Message Logic
    console.log("\n--- Sending Message ---");

    // Find existing conversation
    const existingConversations = await prisma.conversation.findMany({
        where: {
            participants: {
                every: {
                    userId: { in: [sender.id, recipient.id] }
                }
            }
        },
        include: { participants: true }
    });

    // Exact match (2 participants)
    let conversation = existingConversations.find(c => c.participants.length === 2);

    if (!conversation) {
        console.log("Creating NEW Conversation...");
        conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: sender.id },
                        { userId: recipient.id, hasUnread: true }
                    ]
                }
            },
            include: { participants: true }
        });
    } else {
        console.log(`Using EXISTING Conversation: ${conversation.id}`);
    }

    // Create Text Message
    const msg1 = await prisma.message.create({
        data: {
            content: "Hello! checking the system.",
            senderId: sender.id,
            conversationId: conversation.id
        }
    });
    console.log(`✅ Sent Text Message: "${msg1.content}"`);

    // Create Attachment Message
    const msg2 = await prisma.message.create({
        data: {
            content: "Here is my resume",
            attachmentUrl: "https://example.com/resume.pdf",
            attachmentType: "file",
            senderId: sender.id,
            conversationId: conversation.id
        }
    });
    console.log(`✅ Sent Attachment Message: ${msg2.attachmentUrl}`);

    // 3. Verify Retrieval (Receiver View)
    console.log("\n--- Verifying Retrieval (Receiver) ---");
    const messages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${messages.length} messages in conversation.`);

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.attachmentUrl === "https://example.com/resume.pdf") {
        console.log("✅ Attachment Persistence Verified.");
    } else {
        console.error("❌ Attachment Verification Failed.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
