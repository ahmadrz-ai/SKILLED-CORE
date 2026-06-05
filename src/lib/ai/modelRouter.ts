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
  process.env.GOOGLE_GENERATIVE_AI_API_KEY, // Vercel standard
  process.env.QODEE_API_KEY,               // fallback name 1
  process.env.RESUME_PARSER,               // fallback name 2
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

  // Support fallback model rotation in case the API key tier is restricted
  const modelsToTry = [
    primaryModel,
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    'nvidia/nemotron-3-super-120b-a12b',
    'meta/llama-3.1-8b-instruct',
    'meta/llama-3.3-70b-instruct',
    'nvidia/llama-3.1-nemotron-70b-instruct',
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

// ─── KNOWN-WORKING MODELS (verified warm on NVIDIA NIM) ──────────────────────
// These are used as the ultimate fallback when specific env vars are not set.
// DO NOT fall back to process.env.NVIDIA_MODEL — on Vercel production it still
// points to 'z-ai/glm-5.1' which gateway-timeouts (504) and breaks everything.
const FAST_MODEL   = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning' // ~500ms, JSON-capable
const STRONG_MODEL = 'meta/llama-3.3-70b-instruct'           // ~900ms, high quality

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
  if (options.pdfBuffer) {
    console.log(`[executeAI] Routing task "${task}" with native PDF buffer to Gemini...`);
    return await callGemini(messages, options);
  }

  // Fallback API key — the legacy single key that already exists on Vercel
  const fallbackKey = process.env.NVIDIA_API_KEY || '';

  try {
    switch (task) {
      case 'search':
        return await callNvidiaNIM(
          process.env.NVIDIA_API_KEY_SEARCH || fallbackKey,
          process.env.NVIDIA_MODEL_SEARCH || FAST_MODEL,
          messages,
          options
        )

      case 'assistant':
        return await callNvidiaNIM(
          process.env.NVIDIA_API_KEY_ASSISTANT || fallbackKey,
          process.env.NVIDIA_MODEL_ASSISTANT || STRONG_MODEL,
          messages,
          options
        )

      case 'resumeImport':
        return await callNvidiaNIM(
          process.env.NVIDIA_API_KEY_RESUME_IMPORT || fallbackKey,
          process.env.NVIDIA_MODEL_RESUME_IMPORT || STRONG_MODEL,
          messages,
          options
        )

      case 'resumeExport':
        return await callNvidiaNIM(
          process.env.NVIDIA_API_KEY_RESUME_EXPORT || fallbackKey,
          process.env.NVIDIA_MODEL_RESUME_EXPORT || STRONG_MODEL,
          messages,
          options
        )

      case 'report':
        return await callNvidiaNIM(
          process.env.NVIDIA_API_KEY_REPORT || fallbackKey,
          process.env.NVIDIA_MODEL_REPORT || STRONG_MODEL,
          messages,
          { ...options, jsonMode: true }
        )

      case 'roleClassify':
        // Uses the fastest available model for instant classification
        // Role classification runs BEFORE the interview starts — must be <2s
        return await callNvidiaNIM(
          process.env.NVIDIA_API_KEY_SEARCH || fallbackKey,
          process.env.NVIDIA_MODEL_SEARCH || FAST_MODEL,
          messages,
          { ...options, temperature: 0.1, maxTokens: 1024, jsonMode: true }
        )

      default:
        throw new Error(`Unknown AI task: ${task}`)
    }
  } catch (nvidiaErr: any) {
    console.warn(`[executeAI] NVIDIA NIM failed for task "${task}". Falling back to Gemini... Error:`, nvidiaErr?.message || nvidiaErr)
    return await callGemini(messages, options)
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

