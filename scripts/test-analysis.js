
const { generateAnalysis } = require('../src/app/actions/interview');

async function test() {
    console.log("Testing generateAnalysis...");
    const messages = [
        { role: "user", content: "Hi, I am a frontend dev." },
        { role: "assistant", content: "Great. What is React?" },
        { role: "user", content: "React is a library for building UIs." }
    ];

    try {
        const result = await generateAnalysis(messages, "Frontend Developer", 3);
        console.log("Result:", result);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
