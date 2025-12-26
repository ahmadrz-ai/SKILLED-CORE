
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding assessments...");

    const assessments = [
        {
            title: "React Developer",
            description: "Verify your expertise in React.js, hooks, and component lifecycle.",
            category: "Frontend",
            icon: "react",
            questions: {
                create: [
                    {
                        text: "What is the primary purpose of useEffect?",
                        options: ["State management", "Side effects", "Routing", "Styling"],
                        correctIndex: 1
                    },
                    {
                        text: "Which hook is used for performance optimization?",
                        options: ["useState", "useEffect", "useMemo", "useContext"],
                        correctIndex: 2
                    },
                    {
                        text: "What prevents a component from re-rendering?",
                        options: ["React.memo", "usePrevent", "stopRender", "blockUpdate"],
                        correctIndex: 0
                    }
                ]
            }
        },
        {
            title: "Node.js Backend",
            description: "Test your knowledge of Node.js runtime, event loop, and streams.",
            category: "Backend",
            icon: "node",
            questions: {
                create: [
                    {
                        text: "Is Node.js multi-threaded?",
                        options: ["Yes", "No, it's single-threaded", "Only via worker threads", "Depends on OS"],
                        correctIndex: 1
                    },
                    {
                        text: "Which module is used for file operations?",
                        options: ["http", "fs", "path", "os"],
                        correctIndex: 1
                    }
                ]
            }
        }
    ];

    for (const a of assessments) {
        await prisma.assessment.create({
            data: a
        });
    }

    console.log("Seeding complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
