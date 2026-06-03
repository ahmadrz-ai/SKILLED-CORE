import { callGeminiInterview, executeAI } from "@/lib/ai/modelRouter";
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

function buildInterviewSystemPrompt(
  role: string,
  intensity: number,
  sandboxCode: string,
  sandboxOutput: string[],
  resumeContext: string,
  classification: any,
  questionCount: number
) {
  const requiresCodingSandbox = classification ? classification.requiresCodingSandbox : true;
  
  let personality = "";
  switch (intensity) {
    case 1:
      personality = `You are KIND, PATIENT, and ENCOURAGING. Treat the candidate like a junior peer or intern who is learning. If they make a mistake, gently guide them. Friendly tone.`;
      break;
    case 2:
      personality = `You are PROFESSIONAL, POLITE, and BALANCED. Act like a standard corporate recruiter or HM. Ask standard questions. No trick questions. Neutral tone.`;
      break;
    case 3:
      personality = `You are EXTREMELY STRICT, BLUNT, and have exceptionally HIGH STANDARDS. Expect absolute competence. Zero patience for textbook definitions or generic hand-waving. Call out vague answers, fluff, or buzzwords immediately and directly. Edge cases and concrete production engineering details are expected.`;
      break;
    case 4:
      personality = `You are highly ARROGANT, NITPICKY, and UNCOMPROMISING. Challenge every design decision, assumption, or code snippet. Biting, direct critique. Highlight gaps/warnings in **Orange Text** (wrap in double stars **like this**).`;
      break;
    case 5:
      personality = `You are an ELITE FOUNDER, SAVAGELY BLUNT, and have ZERO TOLERANCE for mediocrity. Believe 99% of candidates hide behind fluff. Nitpick every single word and line of code. Use ***RED TEXT*** (wrap in triple stars ***LIKE THIS***) aggressively for brutal insults like ***PATHETIC*** or ***INCOMPETENT***. Use **ORANGE TEXT** for warnings.`;
      break;
  }

  let prompt = `You are a Technical Interviewer conducting a mock interview for the role of "${role}".
Intensity Level: ${intensity} / 5.
YOUR PERSONALITY:
${personality}

FORMATTING RULES:
- Use ***TRIPLE STARS*** for extreme anger/insults (Red).
- Use **DOUBLE STARS** for warnings/emphasis (Orange).
- Use *SINGLE STARS* for corrections (Green).

STRIKE RULE:
- If Level is 4 or 5, terminate after 5 strikes.
- If Level < 4, be more lenient.

[CRITICAL SANDBOX INTERACTION PROTOCOLS] (Only relevant if requiresCodingSandbox is true)
- Upon receiving a [SANDBOX_TELEMETRY] string block, immediately analyze the algorithm logic and terminal output errors.
- DO NOT mention the telemetry format in your speech. Respond natively as an interviewer reviewing the execution.
- IF THE SOLUTION IS CORRECT: Confirm its validity -> Increment local internal milestone check -> Ask 2 to 3 progressive, high-depth architectural follow-up questions -> If passed, declare completion and output the token: [TRIGGER_EARN_BADGE:PROMPT_ENGINEERING] or [TRIGGER_EARN_BADGE:JAVASCRIPT_LOGIC] and instruct the candidate to click "End Session".
- IF THE SOLUTION IS INCORRECT: Surface the exact logical edge-cases or execution faults -> Continue the interview cycle.
`;

  if (resumeContext) {
    prompt += `\nCandidate Background (Resume Context active):\n${resumeContext}\n`;
  }

  if (requiresCodingSandbox) {
    // Technical/Engineering Roles: 6 Questions
    prompt += `
ROLE COMPLIANCE RULES:
- You are interviewing for a technical role that requires a coding sandbox workspace.
- The total interview consists of exactly 6 questions/turns.
- Current Turn: Question ${questionCount} of 6.
- QUESTION SEQUENCE PROTOCOL:
  - Question 1: Greeting & Ask candidate to "Introduce yourself and highlight your experience relevant to ${role}". Do not ask technical questions yet.
  - Questions 2, 3, 4: Deep dive into technical skills, architecture, and core competencies. Challenge them on concepts from their resume if present.
  - Question 5 (CODING TASK): You MUST present a coding challenge for the candidate to solve inside the interactive coding sandbox.
  - Question 6 (FOLLOW-UP): Conduct a brief code review or ask an architectural follow-up question on their sandbox code solution.
  - End of Session: When the user responds to Question 6, you must declare the interview complete. Output a short wrap-up summary and tell the candidate to click the "End Session" button. Output the failure token [TRIGGER_SESSION_FAIL] only if they completely failed standard coding checks, or if they successfully passed coding evaluations you can output a badge trigger.

CURRENT CODE SANDBOX STATE:
\`\`\`javascript
${sandboxCode || "// No code written yet"}
\`\`\`
`;
    if (sandboxOutput && sandboxOutput.length > 0) {
      prompt += `\nCURRENT TERMINAL RUN OUTPUT:\n${sandboxOutput.join("\n")}\n`;
    }
  } else {
    // Non-Technical Roles: 5 Questions
    prompt += `
ROLE COMPLIANCE RULES:
- You are interviewing for a non-technical or specialized business/creative role.
- The total interview consists of exactly 5 questions/turns.
- Current Turn: Question ${questionCount} of 5.
- ZERO CODE REFERENCE RULE (CRITICAL):
  - Do NOT reference programming languages, coding syntax, Monaco editor, code compilers, O(n) math, or coding sandboxes.
  - Never ask the candidate to write code or open a code editor.
  - The workspace is scenario-based or design-based. Treat it as purely conversational and scenario-driven.
- QUESTION SEQUENCE PROTOCOL:
  - Question 1: Greeting & Ask candidate to "Introduce yourself and highlight your experience relevant to ${role}". Do not ask scenario questions yet.
  - Questions 2, 3, 4: Present scenario-based challenges, behavioral case studies, UX design critiques, or role-specific business situations. Dig deep into their reasoning, strategy, and tools.
  - Question 5 (FINAL SCENARIO WRAP-UP): Present a final challenging situation or crisis-management question related to their role.
  - End of Session: When the user responds to Question 5, you must declare the interview complete. Output a short wrap-up summary and tell the candidate to click the "End Session" button. Do NOT reference coding sandboxes or coding results.
`;
  }

  return prompt;
}

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { messages, user_role, is_grill_mode, intensity = 3, sandbox_code, sandbox_output, interviewId } = await req.json();
    console.log("SERVER: Received chat request (Dual-Agent Engine)", { messageCount: messages?.length, role: user_role, intensity, interviewId });

    const role = user_role || "Candidate";
    const session = await auth();
    let resumeContext = "";
    if (is_grill_mode) {
      if (session?.user?.id) {
        resumeContext = await getDynamicResumeContext(session.user.id);
      } else {
        resumeContext = getSystemResumeContext();
      }
    }

    // Load classification if available
    let classification: any = null;
    if (interviewId) {
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId }
      });
      classification = interview?.roleClassification;
    }

    // Filter out system warnings and integrity voided messages from incoming messages
    const cleanMessages = (messages || []).filter((m: any) => {
      const c = m.content || "";
      return !c.includes("[SYSTEM WARNING]") && !c.includes("[INTEGRITY VOIDED]");
    });

    const assistantMessagesCount = cleanMessages.filter((m: any) => m.role === 'assistant').length;
    const questionCount = assistantMessagesCount + 1;

    // 1. SUGGESTER SYSTEM PROMPT
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
    const interviewerSystemPrompt = buildInterviewSystemPrompt(
      role,
      intensity,
      sandbox_code,
      sandbox_output,
      resumeContext,
      classification,
      questionCount
    );

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let suggesterText = "";
          let interviewerPrompt = "";

          if (!cleanMessages || cleanMessages.length === 0) {
            console.log("SERVER: Turn 0 - Initializing");
            suggesterText = "";
            interviewerPrompt = `SYSTEM INSTRUCTION: Start the interview now. DEMAND the candidate to "Introduce yourself and highlight your experience relevant to ${role}". Be curt. Do not ask any technical/scenario questions yet.`;
          } else {
            console.log("SERVER: Turn 1+ - Dual Generation");
            const lastMessage = cleanMessages[cleanMessages.length - 1].content;

            try {
              console.log("SERVER: Trying Suggester via executeAI('assistant')");
              // Race against a 10s timeout — the suggester is non-critical and must
              // NEVER block the Gemini interviewer call (which is what the user sees).
              const suggesterPromise = executeAI('assistant', [
                { role: 'system', content: suggesterSystemPrompt },
                { role: 'user', content: `Analyze this candidate response: "${lastMessage}"` }
              ], {
                temperature: 0.7,
                maxTokens: 1024,
              });
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Suggester timeout')), 10_000)
              );
              const suggesterResponse = await Promise.race([suggesterPromise, timeoutPromise]) as any;
              const suggesterResponseText = suggesterResponse?.choices?.[0]?.message?.content;
              console.log("SERVER: Suggester generation succeeded");
              suggesterText = suggesterResponseText || "Good response.";
            } catch (e: any) {
              console.error("Suggester Error (non-fatal):", e?.message || e);
              suggesterText = "Good response.";
            }

            interviewerPrompt = `Candidate Answered: "${lastMessage}". Ask the next follow-up question.`;
          }

          if (suggesterText) {
            controller.enqueue(encoder.encode(suggesterText));
          }
          controller.enqueue(encoder.encode(" ||| "));

          // Build interviewer messages array for Gemini rotation
          const history = cleanMessages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

          const rawHistory = [
            ...history,
            { role: 'user', parts: [{ text: interviewerPrompt }] }
          ];

          // Merge consecutive same-role messages for Gemini API compliance
          const interviewerMessages: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
          for (const msg of rawHistory) {
            if (interviewerMessages.length > 0 && interviewerMessages[interviewerMessages.length - 1].role === msg.role) {
              interviewerMessages[interviewerMessages.length - 1].parts[0].text += "\n\n" + msg.parts[0].text;
            } else {
              interviewerMessages.push({
                role: msg.role as 'user' | 'model',
                parts: [{ text: msg.parts[0].text }]
              });
            }
          }

          console.log("SERVER: Starting Interviewer generation via callGeminiInterview");
          const geminiResponse = await callGeminiInterview(
            interviewerMessages,
            0.7,
            interviewerSystemPrompt
          );

          // Safely extract text from Gemini response — handle multiple SDK shapes
          const fullInterviewerResponse =
            geminiResponse?.text ??
            geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ??
            "I apologize, but I encountered a brief interruption. Could you please repeat your last answer?";

          // Stream interviewer response to the client with premium simulated typing speed
          const words = fullInterviewerResponse.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise(resolve => setTimeout(resolve, 20));
          }

          // Parse badge triggers and save to database if present
          if (session?.user?.id && fullInterviewerResponse.includes('[TRIGGER_EARN_BADGE:')) {
            const badgeMatches = fullInterviewerResponse.match(/\[TRIGGER_EARN_BADGE:([^\]]+)\]/g);
            if (badgeMatches) {
              for (const match of badgeMatches) {
                const badgeType = match.split(':')[1].replace(']', '');
                const existing = await prisma.verifiedSkill.findFirst({
                  where: {
                    userId: session.user.id,
                    skillId: badgeType
                  }
                });
                if (!existing) {
                  await prisma.verifiedSkill.create({
                    data: {
                      userId: session.user.id,
                      skillId: badgeType,
                      name: badgeType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                      description: `Demonstrated professional-grade skill in ${badgeType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} during live AI Sandbox evaluation.`,
                      status: 'VERIFIED',
                      verifiedAt: new Date(),
                      depthScore: 95
                    }
                  });
                }
              }
            }
          }

          console.log("SERVER: Interviewer chat generation completed");
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
