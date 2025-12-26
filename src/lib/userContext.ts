export const CURRENT_USER_CONTEXT = {
    name: "Ahmad",
    role: "AI Engineer / Prompt Engineer",
    skills: [
        "Prompt Engineering & LLM Workflow Design",
        "Generative AI (Visual & Conversational Systems)",
        "Automation Architecture (n8n, Zapier, Make, Python Scripts)",
        "AI Communication and Data Extraction",
        "Visual Identity and UX Design",
        "Python (Automation)",
        "JavaScript",
        "VS Code"
    ],
    experience: [
        {
            role: "AI Communicator & Prompt Engineer",
            company: "Trivia.Global",
            details: "Built intelligent communication frameworks for Internal AI tools. Designed structured prompts for GPT-based agents. Converted manual workflows into semi-autonomous systems."
        },
        {
            role: "Graphic Designer (Freelance)",
            company: "Fiverr",
            details: "Delivered professional brand identities and visual systems."
        }
    ],
    projects: [
        {
            name: "AI-Powered Receptionist Agent for White's Castle Restaurant",
            details: "Developed voice-enabled agent using OpenAI GPT-4o-mini and Eleven Labs API. Integrated OpenAI API via Omni-Dimension."
        },
        {
            name: "Vizora - AI-Powered Visual SaaS Platform",
            details: "Developed AI SaaS combining prompt engineering and image generation. Integrated Gemini Pro and OpenAI GPT-5 APIs."
        },
        {
            name: "Viral Video Automation Workflow with n8n",
            details: "Created automation system generating and publishing short-form videos using Fal.ai and OpenAI APIs."
        }
    ]
};

export function getSystemResumeContext() {
    return `
CANDIDATE PROFILE (RESUME DATA):
Name: ${CURRENT_USER_CONTEXT.name}
Target Role: ${CURRENT_USER_CONTEXT.role}

CORE COMPETENCIES:
${CURRENT_USER_CONTEXT.skills.map(s => `- ${s}`).join('\n')}

PROFESSIONAL EXPERIENCE:
${CURRENT_USER_CONTEXT.experience.map(e => `[${e.company}] ${e.role}: ${e.details}`).join('\n')}

KEY PROJECTS:
${CURRENT_USER_CONTEXT.projects.map(p => `[${p.name}] ${p.details}`).join('\n')}
    `;
}
