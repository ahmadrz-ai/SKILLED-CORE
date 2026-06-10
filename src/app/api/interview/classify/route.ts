import { NextRequest, NextResponse } from 'next/server'
import { executeAI, parseAIJson } from '@/lib/ai/modelRouter'
import type { RoleClassification } from '@/types/roleClassification'

const CLASSIFIER_SYSTEM_PROMPT = `You are SkilledCore's Role Intelligence Engine.

Your job is to classify any job title into a structured assessment profile.

THE 20 MASTER CATEGORIES:
1. Software Engineering & Development
2. Data Science, ML & AI
3. DevOps, Cloud & Infrastructure
4. QA & Testing
5. Product Management
6. UX/UI Design & Research
7. Marketing & Growth
8. Social Media & Community
9. Sales & Business Development
10. Finance & Accounting
11. Human Resources & People Operations
12. Customer Success & Support
13. Content & Copywriting
14. Operations & Project Management
15. Legal & Compliance
16. Healthcare & Clinical
17. Research & Science
18. Education & Training
19. Creative & Media Production
20. General Business & Administration

SANDBOX GATING RULE (CRITICAL):
requiresCodingSandbox = true ONLY for these categories:
  "Software Engineering & Development", "Data Science, ML & AI",
  "DevOps, Cloud & Infrastructure", "QA & Testing"
  AND ONLY when the title contains words like: engineer, developer, programmer,
  coder, architect, devops, sysadmin, data scientist, ML engineer, AI engineer.

requiresCodingSandbox = false for EVERY other role without exception:
  Marketing, Social Media, HR, Sales, Finance, Product, Design (unless design engineer),
  Legal, Healthcare, Education, Creative, Operations, Support, Content.

FALLBACK RULE: If the job title is completely unknown, unclear, or nonsense (e.g., random string of letters):
  category = "General Business & Administration"
  requiresCodingSandbox = false
  assessmentMethod = "scenario-based"

Return ONLY valid JSON. No markdown. No explanation. Start directly with {`

// Safe Fallback Object
const SAFE_FALLBACK: RoleClassification = {
  jobTitle: 'Unknown',
  category: 'General Business & Administration',
  subCategory: 'General',
  isTechnical: false,
  requiresCodingSandbox: false,
  requiresDesignPortfolio: false,
  assessmentMethod: 'scenario-based',
  coreCompetencies: ['communication', 'problem solving', 'organization', 'teamwork'],
  senioritySignals: ['junior', 'senior', 'lead', 'manager'],
  toolsToAskAbout: ['Microsoft Office', 'Google Workspace', 'Slack'],
  industryContext: 'any',
};

export async function POST(req: NextRequest) {
  try {
    const { jobTitle } = await req.json()
    if (!jobTitle?.trim()) {
      return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })
    }

    const titleLower = jobTitle.trim().toLowerCase();

    // Defensive check: Detect nonsense random strings or clearly unknown titles
    // e.g. "asjdklfjasdf"
    const isRepeatedNonsense = /^[a-z]{10,}$/i.test(titleLower) || 
                               titleLower.includes('asjdklfjasdf') || 
                               titleLower.includes('xyz') && titleLower.length > 15;
    
    if (isRepeatedNonsense) {
      return NextResponse.json({
        ...SAFE_FALLBACK,
        jobTitle: jobTitle.trim()
      });
    }

    const result = await executeAI('roleClassify', [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Classify this job title and return the full RoleClassification JSON object:
"${jobTitle.trim()}"

Return this exact structure:
{
  "jobTitle": "${jobTitle.trim()}",
  "category": "one of the 20 categories",
  "subCategory": "more specific sub-role",
  "isTechnical": true/false,
  "requiresCodingSandbox": true/false,
  "requiresDesignPortfolio": true/false,
  "assessmentMethod": "sandbox" | "scenario-based" | "portfolio-critique",
  "coreCompetencies": ["competency1", "competency2", "competency3", "competency4"],
  "senioritySignals": ["junior", "senior", "lead", "manager", "director"],
  "toolsToAskAbout": ["tool1", "tool2", "tool3"],
  "industryContext": "any"
}`
      },
    ])

    const content = result.choices[0].message.content
    const classification = parseAIJson<RoleClassification>(content)

    // Force strict alignment with sandbox gating rules
    const targetCategory = classification.category;
    const allowedSandboxCategories = [
      'Software Engineering & Development',
      'Data Science, ML & AI',
      'DevOps, Cloud & Infrastructure',
      'QA & Testing'
    ];
    
    // Bare role names like "frontend" or "react" must count as coding roles — the
    // audit's "frontend" interview fell through this gate and got served an
    // administrative SOP scenario (bug I2).
    const codingKeywords = [
        'engineer', 'developer', 'programmer', 'coder', 'architect', 'devops', 'sysadmin', 'scientist', 'ml', 'ai',
        'frontend', 'front-end', 'front end', 'backend', 'back-end', 'back end', 'fullstack', 'full-stack', 'full stack',
        'web dev', 'mobile dev', 'android', 'ios', 'react', 'angular', 'vue', 'node', 'python', 'java', 'golang',
        'swe', 'sde', 'software', 'programming', 'data eng',
    ];
    const hasCodingKeyword = codingKeywords.some(keyword => titleLower.includes(keyword));

    if (!allowedSandboxCategories.includes(targetCategory) || !hasCodingKeyword) {
      classification.requiresCodingSandbox = false;
      if (classification.assessmentMethod === 'sandbox') {
        classification.assessmentMethod = classification.requiresDesignPortfolio ? 'portfolio-critique' : 'scenario-based';
      }
    }

    return NextResponse.json(classification)

  } catch (err) {
    console.error('[Role Classifier] Error:', err)
    return NextResponse.json(SAFE_FALLBACK)
  }
}
