import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getSystemResumeContext } from "@/lib/userContext";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

async function getDynamicResumeContext(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        experience: true,
        education: true,
        projects: true,
      }
    });

    if (!user) return "";

    const skillsList = user.skills ? user.skills.split(',').map(s => s.trim()) : [];
    
    let context = `CANDIDATE PROFILE (DYNAMIC DB RESUME):
Name: ${user.name || "Candidate"}
Headline: ${user.headline || ""}
Bio: ${user.bio || ""}
Resume URL: ${user.resumeUrl || "Not uploaded"}
`;

    if (skillsList.length > 0) {
      context += `\nCORE COMPETENCIES / SKILLS:\n${skillsList.map(s => `- ${s}`).join('\n')}\n`;
    }

    if (user.experience && user.experience.length > 0) {
      context += `\nPROFESSIONAL EXPERIENCE:\n${user.experience.map(e => `- ${e.position} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'}): ${e.description || ''}`).join('\n')}\n`;
    }

    if (user.projects && user.projects.length > 0) {
      context += `\nKEY PROJECTS:\n${user.projects.map(p => `- ${p.title}: ${p.description || ''} ${p.link ? `(Link: ${p.link})` : ''}`).join('\n')}\n`;
    }

    if (user.education && user.education.length > 0) {
      context += `\nEDUCATION:\n${user.education.map(ed => `- ${ed.degree} in ${ed.fieldOfStudy || ''} from ${ed.school} (${ed.startDate || ''} - ${ed.endDate || ''})`).join('\n')}\n`;
    }

    // Fall back to static context if DB fields are totally empty
    if (!user.skills && (!user.experience || user.experience.length === 0) && (!user.projects || user.projects.length === 0)) {
      return getSystemResumeContext();
    }

    return context;
  } catch (error) {
    console.error("Error generating dynamic resume context:", error);
    return getSystemResumeContext(); // Safe fallback
  }
}

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

    const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"];
 
     const role = user_role || "Candidate";
     let resumeContext = "";
     if (is_grill_mode) {
       const session = await auth();
       if (session?.user?.id) {
         resumeContext = await getDynamicResumeContext(session.user.id);
       } else {
         resumeContext = getSystemResumeContext();
       }
     }
 
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
                  - You are EXTREMELY STRICT, BLUNT, and have exceptionally HIGH STANDARDS.
                  - You expect absolute competence and have ZERO patience for textbook definitions or generic hand-waving.
                  - Call out vague answers, fluff, or buzzwords immediately and directly. Tell them bluntly if their response is weak or incomplete.
                  - Dig deep into real production engineering details, demanding they explain concrete edge cases and system performance.
                  - Actively grill them. Challenge their assumptions on the spot.
                  `;
          case 4: // STAFF ENGINEER
            return `
                  - You are highly ARROGANT, NITPICKY, and UNCOMPROMISING.
                  - Challenge every design decision, assumption, or code snippet the candidate makes.
                  - Call out sub-par answers with biting, direct critique: "Is that really how you'd deploy this to production?", "That approach is incredibly fragile and full of memory leaks."
                  - Express your dissatisfaction openly and hold them to extreme standards.
                  - Highlight gaps and warnings in **Orange Text** (wrap in double stars **like this**).
                  `;
          case 5: // FOUNDER MODE
            return `
                  - You are an ELITE FOUNDER, SAVAGELY BLUNT, and have ZERO TOLERANCE for mediocrity.
                  - You believe 99% of candidates are incompetent and hide behind fluff. Prove this one is no different.
                  - Nitpick EVERY SINGLE WORD, concept, and line of code. Show no mercy.
                  - If their response is even slightly flawed, destroy their logic and call it out.
                  - Use ***RED TEXT*** (wrap in triple stars ***LIKE THIS***) aggressively for brutal insults: "***PATHETIC***", "***INCOMPETENT***", "***AMATEUR HOUR***".
                  - Use **ORANGE TEXT** (wrap in double stars) to shout warnings.
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
     ${resumeContext ? `Candidate Background (Resume Context active):
 ${resumeContext}
 
 GRILLING INSTRUCTIONS:
 - You must actively ask questions about their specific skills, projects, and experiences listed in the resume.
 - Periodically (e.g., after 2-3 turns, or when they mention a technical skill), challenge them to prove their claims by performing a hands-on live-coding assessment.
 - Clearly direct the user: "Click the **OPEN SANDBOX** button at the top right to open the interactive coding panel, and write a function/solution to..."
 - Give them a concrete, relevant coding problem (e.g., in JavaScript/TypeScript).
 - Challenge their assumptions, verify implementation details, and keep the grilling intensely professional.
 - If they write code in the chat or state they solved it in the Sandbox, analyze their code or check their explanation. If it works, highlight the topic and acknowledge their proficiency before moving to the next query.` : ""}
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
               let suggesterResponseText = "";
               let suggesterErr = null;
               for (const modelName of MODELS) {
                 try {
                   console.log(`SERVER: Trying Suggester with model ${modelName}`);
                   const modelSuggester = genAI_Suggester.getGenerativeModel({ model: modelName, safetySettings });
                   const result = await modelSuggester.generateContent({
                     contents: [{ role: 'user', parts: [{ text: `Analyze this candidate response: "${lastMessage}"` }] }],
                     systemInstruction: { role: 'system', parts: [{ text: suggesterSystemPrompt }] }
                   });
                   suggesterResponseText = result.response.text();
                   console.log(`SERVER: Suggester generation succeeded with ${modelName}`);
                   break;
                 } catch (err) {
                   console.warn(`SERVER: Suggester model ${modelName} failed, trying next... Error:`, err);
                   suggesterErr = err;
                 }
               }
               if (!suggesterResponseText && lastMessage) {
                 throw suggesterErr;
               }
               suggesterText = suggesterResponseText || "Good response.";
             } catch (e) {
               console.error("Suggester Error (All models failed):", e);
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
 
            let activeModelName = "";
            let streamReadSuccess = false;
            let lastChatError = null;

            for (const modelName of MODELS) {
              try {
                console.log(`SERVER: Trying Interviewer chat stream with model ${modelName}`);
                const modelInterviewer = genAI_Interviewer.getGenerativeModel({ model: modelName, safetySettings });
                const chat = modelInterviewer.startChat({
                  history: history,
                  systemInstruction: { role: 'system', parts: [{ text: interviewerSystemPrompt }] }
                });

                const chatResult = await chat.sendMessageStream([{ text: interviewerPrompt }]);
                
                // Read from the stream immediately inside the model selection try-catch block!
                for await (const chunk of chatResult.stream) {
                  const text = chunk.text();
                  controller.enqueue(encoder.encode(text));
                }
                
                // If we successfully read the entire stream without throwing, we mark success and break!
                activeModelName = modelName;
                streamReadSuccess = true;
                console.log(`SERVER: Interviewer chat stream successfully read to completion with model ${modelName}`);
                break;
              } catch (e) {
                console.warn(`SERVER: Interviewer model ${modelName} failed during stream initialization or reading, trying next... Error:`, e);
                lastChatError = e;
              }
            }

            if (!streamReadSuccess) {
              throw lastChatError || new Error("All interview models failed");
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
