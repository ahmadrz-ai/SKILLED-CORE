import 'server-only'

// ─── GEMINI ROTATION (AI Interview only) ───────────────────────────────────
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter((k): k is string => Boolean(k?.trim()))

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
    throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY_1 through _4 in .env')

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
      if (isQuotaError(err)) {
        console.warn(
          `[Gemini Interview] Key ${i + 1} quota exhausted.`,
          i + 1 < GEMINI_KEYS.length ? `Trying key ${i + 2}...` : 'All keys exhausted.'
        )
        continue
      }
      // Non-quota error — do not rotate, throw immediately
      console.error(`[Gemini Interview] Non-quota error on key ${i + 1}:`, err)
      throw err
    }
  }

  throw new Error(
    `All ${GEMINI_KEYS.length} Gemini interview keys exhausted. Last error: ${(lastError as Error)?.message}`
  )
}

// ─── NVIDIA NIM UNIVERSAL CALLER ─────────────────────────────────────────────
async function callNvidiaNIM(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  options: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    stream?: boolean
  } = {}
) {
  if (!apiKey) throw new Error(`NVIDIA API key missing for model: ${model}`)
  if (!model) throw new Error('NVIDIA model name is required')

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: options.stream ? 'text/event-stream' : 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      top_p: 0.9,
      stream: options.stream ?? false,
      ...(options.jsonMode && { response_format: { type: 'json_object' } }),
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`NVIDIA NIM error [${model}] ${response.status}: ${errText}`)
  }

  if (options.stream) return response
  return response.json()
}

// ─── TASK-BASED ROUTER ────────────────────────────────────────────────────────
export type AITask =
  | 'search'
  | 'assistant'
  | 'resumeImport'
  | 'resumeExport'
  | 'report'
  | 'roleClassify'

export async function executeAI(
  task: AITask,
  messages: { role: string; content: string }[],
  options: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    stream?: boolean
  } = {}
) {
  const mainKey = process.env.NVIDIA_API_KEY || '';
  const mainModel = process.env.NVIDIA_MODEL || '';

  switch (task) {
    case 'search':
      return callNvidiaNIM(
        process.env.NVIDIA_API_KEY_SEARCH || mainKey,
        process.env.NVIDIA_MODEL_SEARCH || mainModel || 'meta/llama-3.1-8b-instruct',
        messages,
        options
      )

    case 'assistant':
      return callNvidiaNIM(
        process.env.NVIDIA_API_KEY_ASSISTANT || mainKey,
        process.env.NVIDIA_MODEL_ASSISTANT || mainModel || 'meta/llama-3.1-8b-instruct',
        messages,
        options
      )

    case 'resumeImport':
      return callNvidiaNIM(
        process.env.NVIDIA_API_KEY_RESUME_IMPORT || mainKey,
        process.env.NVIDIA_MODEL_RESUME_IMPORT || mainModel || 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages,
        options
      )

    case 'resumeExport':
      return callNvidiaNIM(
        process.env.NVIDIA_API_KEY_RESUME_EXPORT || mainKey,
        process.env.NVIDIA_MODEL_RESUME_EXPORT || mainModel || 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages,
        options
      )

    case 'report':
      return callNvidiaNIM(
        process.env.NVIDIA_API_KEY_REPORT || mainKey,
        process.env.NVIDIA_MODEL_REPORT || mainModel || 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages,
        { ...options, jsonMode: true }
      )

    case 'roleClassify':
      // Uses the fastest available model for instant classification
      // Role classification runs BEFORE the interview starts — must be <2s
      return callNvidiaNIM(
        process.env.NVIDIA_API_KEY_SEARCH || mainKey,
        process.env.NVIDIA_MODEL_SEARCH || mainModel || 'meta/llama-3.1-8b-instruct',
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
    console.error('[AI Router] JSON parse failed. Raw:', raw)
    throw new Error('AI response was not valid JSON')
  }
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

