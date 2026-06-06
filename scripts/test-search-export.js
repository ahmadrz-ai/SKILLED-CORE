/**
 * Live check for talent-search query parsing and resume-export generation against
 * the configured NVIDIA models. Confirms valid, structured JSON for both feature
 * prompt shapes. Run: node scripts/test-search-export.js
 */
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const t = line.trim(); if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('='); if (eq === -1) return;
    const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  });
}

async function call(key, model, messages, maxTokens) {
  const start = Date.now();
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens, response_format: { type: 'json_object' } }),
    signal: AbortSignal.timeout(30000),
  });
  const ms = Date.now() - start;
  if (!res.ok) return { ok: false, ms, detail: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  try { return { ok: true, ms, data: JSON.parse(content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()) }; }
  catch { return { ok: false, ms, detail: `non-JSON: ${content.slice(0, 120)}` }; }
}

async function main() {
  // 1) Talent search parse-query (task 'search' -> SEARCH model)
  const searchKey = process.env.NVIDIA_API_KEY_SEARCH;
  const searchModel = process.env.NVIDIA_MODEL_SEARCH || 'meta/llama-3.1-8b-instruct';
  const sq = await call(searchKey, searchModel, [
    { role: 'system', content: 'You are a talent search query parser. Return ONLY valid JSON.' },
    { role: 'user', content: 'Parse: "Senior React developer with Python who can design interfaces". Return JSON {"requirements":[{"priority":0,"label":"","searchTerms":[],"type":"primary","isHardFilter":false,"experienceLevel":"any","notes":""}],"industry":null,"queryIntent":""}' },
  ], 2048);
  console.log(`[search]  ${searchModel}`);
  console.log(sq.ok ? `  SUCCESS ${sq.ms}ms — requirements=${(sq.data.requirements || []).length}, intent="${(sq.data.queryIntent || '').slice(0, 50)}"`
                    : `  FAIL ${sq.ms}ms — ${sq.detail}`);

  // 2) Resume export generate (task 'resumeExport' -> RESUME_EXPORT model)
  const expKey = process.env.NVIDIA_API_KEY_RESUME_EXPORT;
  const expModel = process.env.NVIDIA_MODEL_RESUME_EXPORT || 'meta/llama-3.1-8b-instruct';
  const ex = await call(expKey, expModel, [
    { role: 'system', content: 'You are a professional resume writer. Return ONLY valid JSON.' },
    { role: 'user', content: 'Turn this profile into a polished resume JSON. Profile: {"name":"Jane Doe","headline":"Full Stack Engineer","skills":["React","Node.js","Python"],"experience":[{"company":"Acme","title":"Senior Engineer","description":"Led microservices migration"}]}. Return JSON {"name":"","headline":"","summary":"","skills":[],"experience":[{"title":"","company":"","bullets":[]}],"education":[],"projects":[]}' },
  ], 4096);
  console.log(`[export]  ${expModel}`);
  console.log(ex.ok ? `  SUCCESS ${ex.ms}ms — summary len=${(ex.data.summary || '').length}, exp=${(ex.data.experience || []).length}, skills=${(ex.data.skills || []).length}`
                    : `  FAIL ${ex.ms}ms — ${ex.detail}`);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
