import { callGLM, callGLMStream } from "@/lib/glm";
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
    const { messages, user_role, is_grill_mode, intensity = 3, sandbox_code, sandbox_output } = await req.json();
    console.log("SERVER: Received chat request (Dual-Agent Engine)", { messageCount: messages?.length, role: user_role, intensity });

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

      let codeContext = "";
      if (sandbox_code) {
        codeContext = `\nCURRENT CODE SANDBOX STATE:\n\`\`\`javascript\n${sandbox_code}\n\`\`\`\n`;
        if (sandbox_output && sandbox_output.length > 0) {
          codeContext += `\nCURRENT TERMINAL RUN OUTPUT:\n${sandbox_output.join("\n")}\n`;
        }
      }
 
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
     
     ROLE ADAPTATION REQUIREMENT:
     - You MUST adapt all questions, technical challenges, and sandbox tasks EXACTLY to the target role: "${role}".
     - If the target role is a NON-CODING or specialized role (e.g., "Prompt Engineer", "Product Manager", "UI/UX Designer", "Behavioral Interviewee"), do NOT ask them to write traditional programming algorithms (like time-complexity O(n) math or standard JavaScript arrays) in the sandbox or chat.
     - Instead, ask them domain-specific questions (e.g., for a Prompt Engineer, ask about prompt design, system instructions, few-shot prompting, and tell them to design a system prompt or optimize a prompt template in the sandbox).
     
     Current Role Context: ${role}
     ${codeContext}
     ${resumeContext ? `Candidate Background (Resume Context active):
  ${resumeContext}
  
  GRILLING INSTRUCTIONS:
  - You must actively ask questions about their specific skills, projects, and experiences listed in the resume.
  - Periodically (e.g., after 2-3 turns, or when they mention a technical skill), challenge them to prove their claims by performing a hands-on live assessment using the sandbox.
  - Clearly direct the user: "Click the **OPEN SANDBOX** button at the top right to open the interactive coding panel, and write a function/solution/prompt/spec to..."
  - Challenge their assumptions, verify implementation details, and keep the grilling intensely professional.
  - If they write code/text in the chat or state they solved it in the Sandbox, analyze their code/text or check their explanation. If it works, highlight the topic and acknowledge their proficiency before moving to the next query.` : `
  GRILLING INSTRUCTIONS:
  - Periodically (e.g., after 2-3 turns), challenge them to prove their skills by performing a hands-on live assessment using the sandbox.
  - Clearly direct the user: "Click the **OPEN SANDBOX** button at the top right to open the interactive coding panel, and write a function/solution/prompt/spec to..."
  - If they write code/text in the chat or state they solved it in the Sandbox, analyze their code/text or check their explanation. If it works, highlight the topic and acknowledge their proficiency before moving to the next query.`}
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
               console.log("SERVER: Trying Suggester via Llama-4 Maverick");
               const suggesterResponseText = await callGLM([
                 { role: 'system', content: suggesterSystemPrompt },
                 { role: 'user', content: `Analyze this candidate response: "${lastMessage}"` }
               ], {
                 temperature: 0.7,
                 maxTokens: 1024,
                 enableThinking: false,
                 model: process.env.NVIDIA_INTERVIEW_MODEL || "meta/llama-4-maverick-17b-128e-instruct"
               });
               console.log("SERVER: Suggester generation succeeded via Llama-4 Maverick");
               suggesterText = suggesterResponseText || "Good response.";
             } catch (e) {
               console.error("Suggester Error via Llama-4 Maverick:", e);
               suggesterText = "Good response.";
             }
 
             interviewerPrompt = `Candidate Answered: "${lastMessage}". Ask the next follow-up question.`;
           }
 
           if (suggesterText) {
             controller.enqueue(encoder.encode(suggesterText));
           }
           controller.enqueue(encoder.encode(" ||| "));
 
           // Build interviewer messages array
           const history = messages.slice(0, -1).map((m: any) => ({
             role: m.role as 'user' | 'assistant',
             content: m.content
           }));

           const interviewerMessages = [
             { role: 'system' as const, content: interviewerSystemPrompt },
             ...history,
             { role: 'user' as const, content: interviewerPrompt }
           ];
 
           console.log("SERVER: Starting Interviewer stream via Llama-4 Maverick");
           const glmResponse = await callGLMStream(interviewerMessages, {
             temperature: 0.7,
             maxTokens: 8192,
             model: process.env.NVIDIA_INTERVIEW_MODEL || "meta/llama-4-maverick-17b-128e-instruct"
           });

           const reader = glmResponse.body?.getReader();
           const decoder = new TextDecoder();
           if (!reader) {
             controller.close();
             return;
           }

           let buffer = "";
           while (true) {
             const { done, value } = await reader.read();
             if (done) break;

             buffer += decoder.decode(value, { stream: true });
             const lines = buffer.split("\n");
             buffer = lines.pop() || "";

             for (const line of lines) {
               const trimmed = line.trim();
               if (!trimmed || trimmed === "data: [DONE]") continue;
               if (trimmed.startsWith("data: ")) {
                 const jsonStr = trimmed.slice(6);
                 try {
                   const parsed = JSON.parse(jsonStr);
                   const content = parsed.choices?.[0]?.delta?.content;
                   if (content) {
                     controller.enqueue(encoder.encode(content));
                   }
                 } catch {}
               }
             }
           }

           if (buffer.trim().startsWith("data: ")) {
             const trimmed = buffer.trim();
             if (trimmed !== "data: [DONE]") {
               const jsonStr = trimmed.slice(6);
               try {
                 const parsed = JSON.parse(jsonStr);
                 const content = parsed.choices?.[0]?.delta?.content;
                 if (content) {
                   controller.enqueue(encoder.encode(content));
                 }
               } catch {}
             }
           }

           console.log("SERVER: Interviewer chat stream successfully read to completion with Llama-4 Maverick");
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
