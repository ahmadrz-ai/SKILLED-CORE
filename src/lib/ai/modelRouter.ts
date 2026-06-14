import 'server-only'

// Collect all possible Google / Gemini keys to be 100% compatible with Vercel production
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY,              // legacy Gemini key name
  process.env.GOOGLE_API_KEY_1,            // legacy resume parser name 1
  process.env.GOOGLE_API_KEY_2,            // legacy resume parser name 2
  process.env.GOOGLE_API_KEY_3,            // legacy resume parser name 3
  process.env.GOOGLE_API_KEY_4,            // legacy resume parser name 4
  process.env.GOOGLE_API_KEY_5,            // legacy resume parser name 5
  process.env.GOOGLE_API_KEY,              // legacy singular google key
  process.env.GOOGLE_API_KEY2,             // production no-underscore variant (was being ignored!)
  process.env.GOOGLE_API_KEY3,             // production no-underscore variant
  process.env.GEMINI_API_KEY2,             // production no-underscore variant
  process.env.GOOGLE_GENERATIVE_AI_API_KEY, // Vercel standard
  process.env.QODEE_API_KEY,               // fallback name 1
  process.env.RESUME_PARSER,               // fallback name 2
]
  .filter((k): k is string => Boolean(k?.trim()))
  // de-duplicate so the same key isn't tried twice under two env names
  .filter((k, i, arr) => arr.indexOf(k) === i)

/** First available Gemini/Google key (server-only). Used by the Live token route. */
export function firstGeminiKey(): string | undefined {
  return GEMINI_KEYS[0]
}

function isQuotaError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err).toLowerCase()
  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 0
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('overloaded')
  )
}

export async function callGeminiInterview(
  messages: { role: string; parts: { text: string }[] }[],
  temperature = 0.7,
  systemInstruction?: string
) {
  if (GEMINI_KEYS.length === 0)
    throw new Error('No Gemini API keys configured. Set GOOGLE_API_KEY or GEMINI_API_KEY in environment variables')

  let lastError: unknown = null

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const { GoogleGenAI } = await import('@google/genai')
      const client = new GoogleGenAI({ apiKey: GEMINI_KEYS[i] })

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: messages,
        config: { 
          temperature,
          ...(systemInstruction && { systemInstruction })
        },
      })

      console.log(`[Gemini Interview] Success on key slot ${i + 1}`)
      return response

    } catch (err) {
      lastError = err
      const errMsg = String((err as any)?.message ?? err).toLowerCase()
      const errStatus = (err as any)?.status ?? (err as any)?.statusCode ?? 0
      // Rotate on quota errors, 503 overloads, and transient network errors
      if (isQuotaError(err) || errStatus === 503 || errMsg.includes('fetch failed') || errMsg.includes('econnreset')) {
        console.warn(
          `[Gemini Interview] Key ${i + 1} failed (${errStatus || errMsg.slice(0, 60)}).`,
          i + 1 < GEMINI_KEYS.length ? `Trying key ${i + 2}...` : 'All keys exhausted.'
        )
        continue
      }
      // Non-transient error — still try next key rather than crashing
      console.error(`[Gemini Interview] Error on key ${i + 1}:`, err)
      continue
    }
  }

  throw new Error(
    `All ${GEMINI_KEYS.length} Gemini interview keys exhausted. Last error: ${(lastError as Error)?.message}`
  )
}

/**
 * Interviewer generation with CROSS-PROVIDER fallback so the interview can never
 * "go dead" on a quota wall:
 *   1. Primary  → Gemini (callGeminiInterview, rotates all Gemini keys)
 *   2. Fallback → NVIDIA NIM (rotates all NVIDIA keys) when every Gemini key is
 *      exhausted/erroring.
 * Returns a normalized { text } shape regardless of which provider answered.
 */
export async function generateInterviewerTurn(
  geminiMessages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  systemInstruction: string,
  temperature = 0.7,
): Promise<{ text: string; provider: 'gemini' | 'nvidia' }> {
  try {
    const res = await callGeminiInterview(geminiMessages, temperature, systemInstruction)
    const text =
      (res as any)?.text ??
      (res as any)?.candidates?.[0]?.content?.parts?.[0]?.text ??
      ''
    if (!text.trim()) throw new Error('Gemini returned empty interviewer text')
    return { text, provider: 'gemini' }
  } catch (geminiErr) {
    console.warn('[Interviewer] Gemini path failed, falling over to NVIDIA:', (geminiErr as Error)?.message)
    // Translate Gemini parts-format history → NVIDIA chat-format messages.
    const nvidiaMessages = [
      { role: 'system', content: systemInstruction },
      ...geminiMessages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.parts.map(p => p.text).join('\n'),
      })),
    ]
    // Dedicated interviewer-fallback key if provided, else the assistant key pool.
    const fallbackKey =
      process.env.NVIDIA_API_KEY_INTERVIEWER ||
      process.env.NVIDIA_API_KEY_ASSISTANT ||
      process.env.NVIDIA_API_KEY
    const res = await callNvidiaNIM(
      fallbackKey,
      process.env.NVIDIA_MODEL_INTERVIEWER || FAST_MODEL,
      nvidiaMessages,
      { temperature, maxTokens: 1024 },
    )
    const text = (res as any)?.choices?.[0]?.message?.content ?? ''
    return { text, provider: 'nvidia' }
  }
}

const NVIDIA_KEYS = [
  process.env.NVIDIA_API_KEY_SEARCH,
  process.env.NVIDIA_API_KEY_ASSISTANT,
  process.env.NVIDIA_API_KEY_RESUME_IMPORT,
  process.env.NVIDIA_API_KEY_RESUME_EXPORT,
  process.env.NVIDIA_API_KEY_REPORT,
  process.env.NVIDIA_API_KEY,
].filter((k): k is string => Boolean(k?.trim()))

async function callNvidiaNIM(
  preferredApiKey: string | undefined,
  primaryModel: string,
  messages: { role: string; content: string }[],
  options: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    stream?: boolean
  } = {}
) {
  const keysToTry = [
    preferredApiKey,
    ...NVIDIA_KEYS
  ].filter((k): k is string => Boolean(k?.trim()))

  const uniqueKeys = Array.from(new Set(keysToTry))

  if (uniqueKeys.length === 0) {
    throw new Error('No NVIDIA API keys configured in environment variables')
  }

  // Fallback model rotation if the primary model is cold/unavailable. Verified via
  // scripts/diagnose-nim.js + scripts/test-resume-model.js against our keys:
  //   meta/llama-3.1-8b-instruct  → 5/5 SUCCESS, ~5s on a full resume prompt, complete JSON.
  // Deliberately EXCLUDED:
  //   meta/llama-3.3-70b-instruct          → intermittent 30s timeouts.
  //   nvidia/llama-3.1-nemotron-70b-instruct → 404 on these accounts.
  //   nvidia/nemotron-3-super-120b-a12b    → reasoning model, >30s on large (resume) prompts.
  // Resilience comes primarily from rotating the 5 dedicated keys (each ~40 rpm).
  const modelsToTry = [
    primaryModel,
    'meta/llama-3.1-8b-instruct',
  ].filter((m): m is string => Boolean(m?.trim()))

  const uniqueModels = Array.from(new Set(modelsToTry))
  let lastError: any = null

  // Outer loop: Try keys
  for (let k = 0; k < uniqueKeys.length; k++) {
    const currentKey = uniqueKeys[k]

    // Inner loop: Try models
    for (let i = 0; i < uniqueModels.length; i++) {
      const currentModel = uniqueModels[i]
      try {
        console.log(`[NIM] Attempting model="${currentModel}" with key slot ${k + 1} (try ${i + 1} of ${uniqueModels.length})`)
        
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
            Accept: options.stream ? 'text/event-stream' : 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: options.maxTokens ?? 4096,
            top_p: 0.9,
            stream: options.stream ?? false,
            ...(options.jsonMode && { response_format: { type: 'json_object' } }),
          }),
          signal: AbortSignal.timeout(30000), // 30s timeout per model attempt to prevent premature abortion on large prompts
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errText}`)
        }

        console.log(`[NIM] Success with model="${currentModel}" on key slot ${k + 1}`)
        if (options.stream) return response
        return response.json()

      } catch (err: any) {
        lastError = err
        const errMsg = String(err?.message || err).toLowerCase()
        const errStatus = err?.status ?? err?.statusCode ?? 0
        console.warn(`[NIM] Model "${currentModel}" failed with key slot ${k + 1}:`, errMsg)
        
        // If it is an auth error, stop trying models on this key and move to next key
        if (errStatus === 401 || errMsg.includes('unauthorized') || errMsg.includes('api key') || errMsg.includes('invalid api key')) {
          console.warn(`[NIM] Key slot ${k + 1} is unauthorized. Rotating key...`)
          break;
        }
      }
    }
  }

  throw new Error(`All NVIDIA NIM keys/models failed. Last error: ${lastError?.message || lastError}`)
}

async function callGemini(
  messages: { role: string; content: string }[],
  options: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    stream?: boolean
    pdfBuffer?: Buffer
  } = {}
) {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured in environment variables')
  }

  const formattedContents = messages.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    return {
      role,
      parts: [{ text: m.content }]
    };
  });

  const systemMessage = messages.find(m => m.role === 'system');
  const systemInstruction = systemMessage?.content;
  const contents = formattedContents.filter((_, idx) => messages[idx].role !== 'system');

  if (options.pdfBuffer) {
    const firstUserContent = contents.find(c => c.role === 'user');
    if (firstUserContent) {
      (firstUserContent.parts as any[]).unshift({
        inlineData: {
          data: options.pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      });
    }
  }

  let lastError: any = null;
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey: GEMINI_KEYS[i] });

      if (options.stream) {
        console.log(`[Gemini Fallback Stream] Attempting streaming on key slot ${i + 1}`);
        const responseStream = await client.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: options.maxTokens ?? 2048,
            ...(systemInstruction && { systemInstruction }),
          }
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of responseStream) {
                const text = chunk.text;
                if (text) {
                  const sseChunk = `data: ${JSON.stringify({
                    choices: [
                      {
                        delta: {
                          content: text
                        }
                      }
                    ]
                  })}\n\n`;
                  controller.enqueue(encoder.encode(sseChunk));
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          }
        });

        console.log(`[Gemini Fallback Stream] Success on key slot ${i + 1}`);
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      } else {
        console.log(`[Gemini Fallback] Attempting on key slot ${i + 1}`);
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: options.maxTokens ?? 2048,
            ...(systemInstruction && { systemInstruction }),
            ...(options.jsonMode && { responseMimeType: 'application/json' }),
          }
        });

        const content = response.text || '';
        console.log(`[Gemini Fallback] Success on key slot ${i + 1}`);
        return {
          choices: [
            {
              message: {
                content
              }
            }
          ]
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Key slot ${i + 1} failed:`, err?.message || err);
    }
  }

  throw new Error(`All Gemini keys failed in fallback. Last error: ${lastError?.message || lastError}`);
}

// ─── TASK-BASED ROUTER ────────────────────────────────────────────────────────
export type AITask =
  | 'search'
  | 'assistant'
  | 'resumeImport'
  | 'resumeExport'
  | 'report'
  | 'roleClassify'

// ─── KNOWN-WORKING MODEL (verified on NVIDIA NIM) ────────────────────────────
// Used when a task's NVIDIA_MODEL_* env var is not set. meta/llama-3.1-8b-instruct
// was the only model that is BOTH reliable (5/5 keys, json_object) AND fast enough
// for real workloads — it parsed a full resume in ~5s with complete JSON, while
// the larger models either time out (>30s) or 404 on these accounts. See
// scripts/diagnose-nim.js and scripts/test-resume-model.js.
// FAST_MODEL and STRONG_MODEL intentionally point at the same proven model; the
// distinction is kept so individual tasks can be retargeted via NVIDIA_MODEL_* env.
const FAST_MODEL   = 'meta/llama-3.1-8b-instruct'  // ~900ms trivial / ~5s full resume, reliable JSON
const STRONG_MODEL = 'meta/llama-3.1-8b-instruct'

export async function executeAI(
  task: AITask,
  messages: { role: string; content: string }[],
  options: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    stream?: boolean
    pdfBuffer?: Buffer
  } = {}
) {
  // NVIDIA-ONLY for these tasks. Gemini keys are reserved exclusively for the AI
  // Interview (see callGeminiInterview) and must never be consumed here. NVIDIA NIM
  // chat models are text-only, so any pdfBuffer is ignored — callers extract the PDF
  // text themselves and pass it in the prompt.

  // Fallback API key — the legacy single key that already exists on Vercel
  const fallbackKey = process.env.NVIDIA_API_KEY || ''

  switch (task) {
    case 'search':
      return await callNvidiaNIM(
        process.env.NVIDIA_API_KEY_SEARCH || fallbackKey,
        process.env.NVIDIA_MODEL_SEARCH || FAST_MODEL,
        messages,
        options
      )

    case 'assistant':
      // Streaming chatbot — use the fast, non-reasoning model so users never see
      // <think> tokens and time-to-first-token stays low.
      return await callNvidiaNIM(
        process.env.NVIDIA_API_KEY_ASSISTANT || fallbackKey,
        process.env.NVIDIA_MODEL_ASSISTANT || FAST_MODEL,
        messages,
        options
      )

    case 'resumeImport':
      // Rich structured extraction — strong model, generous token budget so large
      // resumes don't truncate the JSON.
      return await callNvidiaNIM(
        process.env.NVIDIA_API_KEY_RESUME_IMPORT || fallbackKey,
        process.env.NVIDIA_MODEL_RESUME_IMPORT || STRONG_MODEL,
        messages,
        { ...options, maxTokens: options.maxTokens ?? 8192 }
      )

    case 'resumeExport':
      return await callNvidiaNIM(
        process.env.NVIDIA_API_KEY_RESUME_EXPORT || fallbackKey,
        process.env.NVIDIA_MODEL_RESUME_EXPORT || STRONG_MODEL,
        messages,
        { ...options, maxTokens: options.maxTokens ?? 8192 }
      )

    case 'report':
      return await callNvidiaNIM(
        process.env.NVIDIA_API_KEY_REPORT || fallbackKey,
        process.env.NVIDIA_MODEL_REPORT || STRONG_MODEL,
        messages,
        { ...options, jsonMode: true, maxTokens: options.maxTokens ?? 8192 }
      )

    case 'roleClassify':
      // Role classification runs BEFORE the interview starts — must be <2s, so use
      // the fast model.
      return await callNvidiaNIM(
        process.env.NVIDIA_API_KEY_SEARCH || fallbackKey,
        process.env.NVIDIA_MODEL_SEARCH || FAST_MODEL,
        messages,
        { ...options, temperature: 0.1, maxTokens: 1024, jsonMode: true }
      )

    default:
      throw new Error(`Unknown AI task: ${task}`)
  }
}

// ─── JSON PARSER HELPER ──────────────────────────────────────────────────────
export function parseAIJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fallback: some models wrap the JSON in prose or leftover reasoning text.
    // Extract the first balanced {...} or [...] block and parse that.
    const extracted = extractFirstJsonBlock(cleaned)
    if (extracted) {
      try {
        return JSON.parse(extracted) as T
      } catch {
        /* fall through to error */
      }
    }
    console.error('[AI Router] JSON parse failed. Raw:', raw)
    throw new Error('AI response was not valid JSON')
  }
}

/**
 * Scans for the first complete, balanced JSON object or array in a string,
 * respecting string literals and escapes so braces inside strings don't count.
 * Returns the substring, or null if none is found.
 */
function extractFirstJsonBlock(text: string): string | null {
  const startObj = text.indexOf('{')
  const startArr = text.indexOf('[')
  const candidates = [startObj, startArr].filter(i => i !== -1)
  if (candidates.length === 0) return null
  const start = Math.min(...candidates)
  const open = text[start]
  const close = open === '{' ? '}' : ']'

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

/**
 * Server-side SSE Stream Translation helper for Nvidia NIM
 */
export async function streamNvidiaText(
  task: AITask,
  messages: { role: string; content: string }[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<Response> {
  const response = await executeAI(task, messages, { ...options, stream: true }) as Response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close();
        return;
      }
      let buffer = "";
      try {
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
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
  });
}

