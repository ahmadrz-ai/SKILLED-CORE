import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getSystemResumeContext } from "@/lib/userContext";
import fs from 'fs';
import path from 'path';

function logError(error: any) {
  try {
    const logPath = path.join(process.cwd(), 'server-error.log');
    const msg = `${new Date().toISOString()} - ${error?.message || error}\n${error?.stack || ''}\n\n`;
    fs.appendFileSync(logPath, msg);
  } catch (e) {
    console.error("Failed to write log", e);
  }
}

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { messages, user_role, is_grill_mode, intensity = 3 } = await req.json();
    console.log("SERVER: Received chat request (Dual-Agent Engine)", { messageCount: messages?.length, role: user_role, intensity });

    const apiKey1 = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKey2 = process.env.GOOGLE_API_KEY2 || apiKey1;

    if (!apiKey1) {
      return new Response("Configuration Error: Missing API Key", { status: 500 });
    }

    const genAI_Interviewer = new GoogleGenerativeAI(apiKey1);
    const genAI_Suggester = new GoogleGenerativeAI(apiKey2!);

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const modelInterviewer = genAI_Interviewer.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });
    const modelSuggester = genAI_Suggester.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });

    const role = user_role || "Candidate";
    const resumeContext = is_grill_mode ? getSystemResumeContext() : "";

    // 1. SUGGESTER PROMPT
    const suggesterSystemPrompt = `You are a Mentor and Interview Coach.
    
    ANALYSIS REQUIREMENTS:
    For every response, you must FIRST analyze the candidate's previous answer (if any) and current state.
    Output a metadata block in this EXACT format before your text response:
    %%%
    {
      "confidence": <integer 0-100 representing candidate confidence>,
      "topics": ["List", "of", "detected", "technical", "topics"],
      "feedback": "A single sentence of direct feedback on their performance"
    }
    %%%

    THEN, provide your supportive mentoring response.
    - Be brief (max 2 sentences).
    - Constructive and encouraging.
    - If the input is empty or "start", say "Welcome."
    `;

    // 2. INTERVIEWER PROMPT LOGIC
    const getPersonality = (level: number) => {
      switch (level) {
        case 1: // INTERN SENSITIVITY
          return `
                - You are KIND, PATIENT, and ENCOURAGING.
                - Treat the candidate like a junior peer or intern who is learning.
                - If they make a mistake, gently guide them to the correct answer.
                - Use a friendly tone. "Good try," "Almost there."
                - Do NOT be arrogant.
                `;
        case 2: // STANDARD HR
          return `
                - You are PROFESSIONAL, POLITE, and BALANCED.
                - Act like a standard corporate recruiter or HM.
                - Ask standard questions. No trick questions.
                - Be neutral. Neither overly nice nor mean.
                `;
        case 3: // TEAM LEAD (Default)
          return `
                - You are STRICT and have HIGH STANDARDS.
                - You expect competence.
                - Call out vague answers, but remain professional.
                - Dig deep into technical details.
                `;
        case 4: // STAFF ENGINEER
          return `
                - You are ARROGANT and NITPICKY.
                - Challenge every assumption the candidate makes.
                - Use subtle insults like "Is that really how you'd do it in production?"
                - Use **Orange Text** for warnings.
                `;
        case 5: // FOUNDER MODE
          return `
                - You are LEGENDARY, EXTREMELY DIFFICULT, and have 90 years of experience.
                - You are ARROGANT, BLUNT, and have ZERO TOLERANCE for vague answers.
                - You believe 99% of candidates are incompetent. Prove this one is too.
                - Nitpick EVERY SINGLE WORD.
                - Use ***RED TEXT*** aggressively for insults. "***PATHETIC***".
                - Use **ORANGE TEXT** for shouting.
                `;
        default: return "";
      }
    };

    const interviewerSystemPrompt = `You are a Technical Interviewer.
    Intensity Level: ${intensity} / 5.
    
    YOUR PERSONALITY:
    ${getPersonality(intensity)}

    FORMATTING RULES:
    - Use ***TRIPLE STARS*** for extreme anger/insults (Red). (Level 5 mainly)
    - Use **DOUBLE STARS** for warnings/emphasis (Orange).
    - Use *SINGLE STARS* for corrections (Green).
    
    STRIKE RULE:
    - If Level is 4 or 5, terminate after 5 strikes.
    - If Level < 4, be more lenient.
    
    Current Role Context: ${role}
    ${resumeContext ? `Candidate Background: ${resumeContext}` : ""}
    `;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let suggesterText = "";
          let interviewerPrompt = "";

          if (!messages || messages.length === 0) {
            console.log("SERVER: Turn 0 - Initializing");
            suggesterText = "";
            interviewerPrompt = `SYSTEM INSTRUCTION: Start the interview now. DEMAND the candidate to "Introduce yourself and highlight your experience relevant to ${role}". Be curt. Do not ask any technical questions yet.`;
          } else {
            console.log("SERVER: Turn 1+ - Dual Generation");
            const lastMessage = messages[messages.length - 1].content;

            try {
              const result = await modelSuggester.generateContent({
                contents: [{ role: 'user', parts: [{ text: `Analyze this candidate response: "${lastMessage}"` }] }],
                systemInstruction: { role: 'system', parts: [{ text: suggesterSystemPrompt }] }
              });
              suggesterText = result.response.text();
            } catch (e) {
              console.error("Suggester Error:", e);
              suggesterText = "Good response.";
            }

            interviewerPrompt = `Candidate Answered: "${lastMessage}". Ask the next follow-up question.`;
          }

          if (suggesterText) {
            controller.enqueue(encoder.encode(suggesterText));
          }
          controller.enqueue(encoder.encode(" ||| "));

          // Fix: Ensure history starts with 'user' role
          let history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

          if (history.length > 0 && history[0].role === 'model') {
            history = [{ role: 'user', parts: [{ text: 'Start Interview' }] }, ...history];
          }

          const chat = modelInterviewer.startChat({
            history: history,
            systemInstruction: { role: 'system', parts: [{ text: interviewerSystemPrompt }] }
          });

          const result = await chat.sendMessageStream([{ text: interviewerPrompt }]);

          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }

          controller.close();

        } catch (error: any) {
          console.error("SERVER: Stream Loop Error:", error);
          logError(error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error: any) {
    console.error("SERVER: General Route Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response("Chat API Operational", { status: 200 });
}
