import { executeAI, parseAIJson } from "@/lib/ai/modelRouter";
import { NextResponse } from "next/server";
import * as _pdfParse from "pdf-parse";
const pdfParse = (_pdfParse as any).default || _pdfParse;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESUME_EXTRACTION_PROMPT = `You are an expert resume parser and professional profile writer.
Your job is to extract every piece of information from this resume and structure it perfectly.

RULES:
- Extract EVERY piece of data you can find. Miss nothing.
- For projects: expand 1-3 line descriptions into 4-6 professional
  sentences that explain what was built, what problem it solved, what
  technologies were used, and what the outcome or impact was.
  Never invent facts. Only elaborate on what is stated.
- For experience: capture every role, company, date range, and
  responsibility. Rewrite bullet points as flowing professional prose.
- For skills: extract ALL technologies, tools, languages, frameworks,
  and soft skills mentioned anywhere in the resume (job descriptions,
  projects, education, certifications — everywhere). For each skill,
  categorize it as "professional" (active experience) or "learning"
  (learning/basic knowledge) and write a concise 1-2 sentence detail
  about their exact experience level or use case with that skill.
- For education: capture institution name, degree, field of study,
  start year, and graduation year. Also capture honors, GPA (if stated),
  and relevant coursework (if listed).
- For socials: look for LinkedIn, GitHub, portfolio URLs, email addresses,
  phone numbers, Twitter/X, Behance, Dribbble, personal websites,
  or any other contact information stated anywhere in the document.
- For the summary: if a summary or objective section exists, use it.
  If not, write a compelling 3-4 sentence professional summary based
  on the candidate's most impressive experiences and skills.
  Write it in first person. Make it specific to their actual background.
- Clean up typos, inconsistent capitalization, and formatting issues.
- Standardize date formats to "Month Year" (e.g. "June 2022").
- If only a year is given, use "January YEAR" as start and "December YEAR" as end.
- If a field is genuinely missing from the resume, return an empty
  string or empty array — never invent data.

Return ONLY valid JSON. No markdown fences. No backticks. No explanation.
No preamble. Start directly with the opening brace.

Return exactly this structure:

{
  "basics": {
    "name": "Full name as written on resume",
    "email": "email address or empty string",
    "phone": "phone number with country code if present, or empty string",
    "location": "City, Country or City, State format",
    "headline": "A punchy 1-line professional title — e.g. Senior Full Stack Engineer | React & Node.js",
    "summary": "3-4 sentence professional bio written in first person based on their background"
  },
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "location": "City, Country or Remote",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "description": "2-4 professional sentences describing responsibilities, achievements, and impact. Convert bullet points to prose. Quantify achievements if numbers are present."
    }
  ],
  "education": [
    {
      "institution": "University or school name",
      "degree": "Bachelor's | Master's | PhD | Associate's | Diploma | Certificate",
      "fieldOfStudy": "Field of study or major",
      "startYear": "YYYY",
      "endYear": "YYYY or Present",
      "honors": "GPA, honors, or distinctions if mentioned, else empty string",
      "relevantCourses": ["Course 1", "Course 2"]
    }
  ],
  "skills": [
    {
      "name": "Skill name - e.g. React",
      "type": "professional | learning",
      "details": "1-2 sentences detailing their exact experience level or use case based on resume context."
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "4-6 professional sentences. Explain: what was built, what problem it solved, key technical decisions, technologies used, and outcome or impact. Elaborate from any short description given. Never invent specifics.",
      "technologies": ["tech1", "tech2"],
      "url": "Project URL or GitHub link if present, else empty string",
      "startDate": "Month Year or empty string",
      "endDate": "Month Year or Present or empty string"
    }
  ],
  "socials": [
    {
      "label": "Platform name — e.g. LinkedIn, GitHub, Email, Phone, Portfolio, Twitter",
      "url": "Full URL or value — email as mailto:, phone as tel:, URLs as full https://",
      "icon": "linkedin | github | email | whatsapp | behance | dribbble | twitter | instagram | facebook | youtube | fiverr | upwork | globe"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Month Year or Year",
      "url": "Credential URL if present, else empty string"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Native | Fluent | Professional | Conversational | Basic"
    }
  ]
}`;

export async function POST(req: Request) {
    try {
        let pdfBuffer: Buffer;
        let mimeType = "application/pdf";

        try {
            const contentType = req.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const body = await req.json();
                const resumeUrl = body.url;
                if (!resumeUrl) {
                    return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 400 });
                }
                const response = await fetch(resumeUrl);
                if (!response.ok) {
                    return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
                }
                const arrayBuffer = await response.arrayBuffer();
                pdfBuffer = Buffer.from(arrayBuffer);
            } else {
                const formData = await req.formData();
                const file = formData.get("file") as File;
                const resumeUrl = formData.get("url") as string;

                if (file) {
                    const arrayBuffer = await file.arrayBuffer();
                    pdfBuffer = Buffer.from(arrayBuffer);
                    mimeType = file.type || "application/pdf";
                } else if (resumeUrl) {
                    const response = await fetch(resumeUrl);
                    if (!response.ok) {
                        return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    pdfBuffer = Buffer.from(arrayBuffer);
                } else {
                    return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 400 });
                }
            }
        } catch (fileErr: any) {
            console.error("File read failed:", fileErr);
            return NextResponse.json({ error: "Could not retrieve resume file" }, { status: 500 });
        }

        // Extract text from PDF
        let extractedText = "";
        try {
            if (mimeType.includes("pdf") || mimeType.includes("octet-stream")) {
                const pdfData = await pdfParse(pdfBuffer);
                extractedText = pdfData.text || "";
            } else {
                extractedText = pdfBuffer.toString("utf-8");
            }
        } catch (pdfErr) {
            console.error("pdf-parse failed, falling back to buffer string:", pdfErr);
            extractedText = pdfBuffer.toString("utf-8");
        }

        if (!extractedText.trim()) {
            return NextResponse.json({ error: "Could not extract text from resume file" }, { status: 400 });
        }

        // Send to executeAI with resumeImport task
        let textResult = "";
        try {
            const result = await executeAI('resumeImport', [
                {
                    role: 'system',
                    content: 'You are an expert resume parser and professional profile writer. Return ONLY valid JSON. No markdown. No backticks.'
                },
                {
                    role: 'user',
                    content: `Parse this resume text and structure it according to the schema rules:\n\nResume Text:\n${extractedText}\n\nInstructions and schema:\n${RESUME_EXTRACTION_PROMPT}`
                }
            ], {
                temperature: 0.1,
                jsonMode: true
            });
            textResult = result.choices[0].message.content;
        } catch (aiErr: any) {
            console.error("executeAI resumeImport failed:", aiErr);
            return NextResponse.json({ error: "AI parsing failed", details: aiErr.message }, { status: 500 });
        }

        try {
            const parsed = parseAIJson<any>(textResult);
            const mapped = mapToClientFormat(parsed);
            return NextResponse.json({ success: true, aiData: mapped });
        } catch (jsonErr: any) {
            console.error("JSON parse failed. Raw text was:", textResult, jsonErr);
            return NextResponse.json({ error: "Could not parse AI response", raw: textResult }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Fatal Parse Error:", error);
        return NextResponse.json({ error: "AI parsing failed", details: error.message }, { status: 500 });
    }
}

const mapToClientFormat = (parsed: any) => {
    const basics = parsed.basics || {};
    
    // Extract flat string array of skills:
    let skillsList: string[] = [];
    if (Array.isArray(parsed.skills)) {
        skillsList = parsed.skills.map((s: any) => {
            if (typeof s === 'string') return s;
            if (s && typeof s === 'object' && s.name) return s.name;
            return '';
        }).filter(Boolean);
    }

    // Map experience: position -> Title/Role, company, startDate -> start, endDate -> end, description -> desc
    const experience = (parsed.experience || []).map((exp: any) => ({
        position: exp.title || exp.position || "",
        company: exp.company || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        description: exp.description || ""
    }));

    // Map education: school -> institution/school, degree, startDate -> startYear/startDate, endDate -> endYear/endDate
    const education = (parsed.education || []).map((edu: any) => ({
        school: edu.institution || edu.school || "",
        degree: edu.degree || "",
        startDate: edu.startDate || edu.startYear || "",
        endDate: edu.endDate || edu.endYear || ""
    }));

    // Map projects
    const projects = (parsed.projects || []).map((proj: any) => ({
        title: proj.name || proj.title || "",
        description: proj.description || "",
        link: proj.url || proj.link || "",
        technologies: proj.technologies || []
    }));

    return {
        name: basics.name || parsed.name || "",
        email: basics.email || parsed.email || "",
        phone: basics.phone || parsed.phone || "",
        location: basics.location || parsed.location || "",
        headline: basics.headline || parsed.headline || "",
        summary: basics.summary || parsed.summary || "",
        skills: skillsList,
        experience,
        education,
        projects
    };
};
