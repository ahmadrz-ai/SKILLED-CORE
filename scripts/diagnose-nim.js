/**
 * NVIDIA NIM diagnostic.
 *
 * For each configured NVIDIA key SLOT (never printing the key value), tests a set
 * of candidate models against the official endpoint with response_format=json_object
 * — exactly the mode the app uses for resume import/export and talent search.
 *
 * Output: per slot × model, SUCCESS/FAIL + latency + whether valid JSON came back.
 * Run:  node scripts/diagnose-nim.js
 */
const fs = require('fs');
const path = require('path');

// --- Load .env manually (no dotenv dependency) ---
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  });
}

// Key slots in priority order. We print only the NAME and SET/EMPTY — never the value.
const KEY_SLOTS = [
  'NVIDIA_API_KEY_SEARCH',
  'NVIDIA_API_KEY_ASSISTANT',
  'NVIDIA_API_KEY_RESUME_IMPORT',
  'NVIDIA_API_KEY_RESUME_EXPORT',
  'NVIDIA_API_KEY_REPORT',
  'NVIDIA_API_KEY',
];

// Candidate models to evaluate (non-reasoning instruct models first).
const CANDIDATE_MODELS = [
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'nvidia/nemotron-3-super-120b-a12b',
];

const JSON_PROMPT = [
  { role: 'system', content: 'You output only valid JSON. No markdown, no backticks.' },
  { role: 'user', content: 'Return a JSON object with one key "ok" set to true. Nothing else.' },
];

async function testModel(keyValue, model) {
  const start = Date.now();
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyValue}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: JSON_PROMPT,
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const ms = Date.now() - start;
    if (!response.ok) {
      const text = await response.text();
      return { ok: false, ms, detail: `HTTP ${response.status}: ${text.slice(0, 140)}` };
    }
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '';
    let validJson = false;
    try {
      const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      JSON.parse(cleaned);
      validJson = true;
    } catch { /* not valid JSON */ }
    return { ok: true, ms, validJson, detail: validJson ? 'valid JSON' : `non-JSON: ${content.slice(0, 60)}` };
  } catch (err) {
    const ms = Date.now() - start;
    return { ok: false, ms, detail: (err && err.message ? err.message : String(err)).slice(0, 140) };
  }
}

async function main() {
  console.log('=== NVIDIA NIM diagnostic (json_object mode) ===\n');
  const score = {}; // model -> { success, jsonOk, totalMs, n }
  for (let i = 0; i < KEY_SLOTS.length; i++) {
    const name = KEY_SLOTS[i];
    const val = process.env[name];
    if (!val || !val.trim()) {
      console.log(`Slot ${i + 1} (${name}): EMPTY — skipping\n`);
      continue;
    }
    console.log(`Slot ${i + 1} (${name}): SET (len ${val.trim().length})`);
    for (const model of CANDIDATE_MODELS) {
      const r = await testModel(val.trim(), model);
      const tag = r.ok ? (r.validJson ? 'SUCCESS+JSON' : 'SUCCESS(no-json)') : 'FAIL';
      console.log(`  - ${model.padEnd(42)} ${tag.padEnd(16)} ${String(r.ms).padStart(6)}ms  ${r.detail}`);
      score[model] = score[model] || { success: 0, jsonOk: 0, totalMs: 0, n: 0 };
      score[model].n += 1;
      if (r.ok) { score[model].success += 1; score[model].totalMs += r.ms; }
      if (r.ok && r.validJson) score[model].jsonOk += 1;
    }
    console.log('');
  }

  console.log('=== SUMMARY (pick the model with highest JSON-OK, then lowest latency) ===');
  Object.entries(score)
    .sort((a, b) => (b[1].jsonOk - a[1].jsonOk) || (a[1].totalMs / Math.max(a[1].success, 1) - b[1].totalMs / Math.max(b[1].success, 1)))
    .forEach(([model, s]) => {
      const avg = s.success ? Math.round(s.totalMs / s.success) : 0;
      console.log(`  ${model.padEnd(42)} json-ok ${s.jsonOk}/${s.n}  success ${s.success}/${s.n}  avg ${avg}ms`);
    });
}

main();
