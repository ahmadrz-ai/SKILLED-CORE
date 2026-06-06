/**
 * Realistic-workload test: sends a sample resume + full schema to the configured
 * resume-import model with json_object mode, then checks the JSON is complete and
 * well-structured. Verifies the strong model handles the real prompt (not just a
 * trivial one) without truncating. Run: node scripts/test-resume-model.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  });
}

const KEY = process.env.NVIDIA_API_KEY_RESUME_IMPORT || process.env.NVIDIA_API_KEY;
const MODEL = process.env.NVIDIA_MODEL_RESUME_IMPORT || 'nvidia/nemotron-3-super-120b-a12b';

const SAMPLE_RESUME = `
JANE DOE
Senior Full Stack Engineer | jane.doe@example.com | +1 555 123 4567 | San Francisco, CA
LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe

SUMMARY
Full stack engineer with 7 years building scalable web apps.

EXPERIENCE
Acme Corp — Senior Software Engineer (Jan 2021 - Present), San Francisco
- Led migration of monolith to microservices using Node.js and Docker.
- Built React dashboard reducing support tickets by 30%.

Beta Inc — Software Engineer (Jun 2018 - Dec 2020), Remote
- Developed REST APIs in Python/Django serving 1M requests/day.

EDUCATION
Stanford University — B.S. Computer Science, 2014 - 2018, GPA 3.8

SKILLS
React, Redux, TypeScript, Node.js, Python, Django, PostgreSQL, Docker, AWS, Git, Jest

PROJECTS
OpenSchedule — An open-source scheduling tool built with Next.js and PostgreSQL.
github.com/janedoe/openschedule
`;

const SCHEMA_INSTRUCTIONS = `Extract every skill, experience, education entry, project and social link.
Return ONLY valid JSON with this exact shape:
{
  "basics": {"name":"","email":"","phone":"","location":"","headline":"","summary":""},
  "experience": [{"company":"","title":"","location":"","startDate":"","endDate":"","description":""}],
  "education": [{"institution":"","degree":"","fieldOfStudy":"","startYear":"","endYear":"","honors":"","relevantCourses":[]}],
  "skills": [{"name":"","type":"professional|learning","details":""}],
  "projects": [{"name":"","description":"","technologies":[],"url":"","startDate":"","endDate":""}],
  "socials": [{"label":"","url":"","icon":""}],
  "certifications": [{"name":"","issuer":"","date":"","url":""}],
  "languages": [{"language":"","proficiency":""}]
}`;

async function main() {
  if (!KEY) { console.error('No resume-import key configured.'); process.exit(1); }
  console.log(`Model: ${MODEL}`);
  const start = Date.now();
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert resume parser. Return ONLY valid JSON. No markdown.' },
        { role: 'user', content: `Parse this resume.\n\nResume Text:\n${SAMPLE_RESUME}\n\nInstructions and schema:\n${SCHEMA_INSTRUCTIONS}` },
      ],
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const ms = Date.now() - start;
  if (!res.ok) { console.error(`FAIL HTTP ${res.status}: ${(await res.text()).slice(0, 300)} (${ms}ms)`); process.exit(1); }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  const finish = json.choices?.[0]?.finish_reason;
  let parsed;
  try {
    parsed = JSON.parse(content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
  } catch (e) {
    console.error(`FAIL: response was not valid JSON (${ms}ms, finish=${finish}). First 300 chars:\n${content.slice(0, 300)}`);
    process.exit(1);
  }
  const skills = (parsed.skills || []).length;
  const exp = (parsed.experience || []).length;
  const edu = (parsed.education || []).length;
  const proj = (parsed.projects || []).length;
  const socials = (parsed.socials || []).length;
  console.log(`SUCCESS in ${ms}ms (finish_reason=${finish})`);
  console.log(`  name=${parsed.basics?.name} | skills=${skills} exp=${exp} edu=${edu} projects=${proj} socials=${socials}`);
  if (finish === 'length') console.warn('  WARNING: output hit max_tokens (possible truncation) — consider raising maxTokens.');
  if (skills < 5 || exp < 2) console.warn('  WARNING: extraction looks shallow vs the sample (expected >=11 skills, 2 jobs).');
}

main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
