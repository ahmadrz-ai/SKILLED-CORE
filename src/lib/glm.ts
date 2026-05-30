/**
 * SkilledCore — GLM-5.1 Client via NVIDIA NIM
 * Used by: Qodee chatbot, AI Interviewer, Interview Analyzer,
 *          Talent Search Query Parser, Job Description Rewriter
 * NOT used by: Resume parsing routes (those use Gemini)
 */

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'z-ai/glm-5.1'

function getApiKey(): string {
  const key = process.env.NVIDIA_API_KEY
  if (!key) throw new Error('NVIDIA_API_KEY is not set in environment variables')
  return key
}

interface GLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GLMOptions {
  temperature?: number
  maxTokens?: number
  enableThinking?: boolean
  model?: string
}

/**
 * Standard non-streaming GLM call — for JSON extraction, analysis, rewriting tasks
 * Use for: query parser, interview analyzer, job description rewriter
 */
export async function callGLM(
  messages: GLMMessage[],
  options: GLMOptions = {}
): Promise<string> {
  const {
    temperature = 0.3,
    maxTokens = 4096,
    enableThinking = false,
    model = NVIDIA_MODEL,
  } = options

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: false,
      // Enable deep reasoning for complex analysis tasks (GLM only)
      ...(enableThinking && model.includes("glm") && {
        chat_template_kwargs: {
          enable_thinking: true,
          clear_thinking: true, // strip reasoning from final output
        },
      }),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GLM-5.1 API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) throw new Error('GLM-5.1 returned empty response')
  return content
}

/**
 * Streaming GLM call — for real-time chat interfaces
 * Use for: Qodee chatbot, AI Interview Conductor
 * Returns a ReadableStream compatible with Vercel AI SDK streamText
 */
export async function callGLMStream(
  messages: GLMMessage[],
  options: GLMOptions = {}
): Promise<Response> {
  const {
    temperature = 0.7,
    maxTokens = 8192,
    enableThinking = false,
    model = NVIDIA_MODEL,
  } = options

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: true,
      ...(enableThinking && model.includes("glm") && {
        chat_template_kwargs: {
          enable_thinking: true,
          clear_thinking: false,
        },
      }),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GLM-5.1 stream error ${response.status}: ${errorText}`)
  }

  return response
}

/**
 * Server-side SSE Stream Translation helper
 * Parses incoming SSE events on the server and yields raw text chunks to the client.
 * Perfect for frontend readers that expect plain text chunks.
 */
export async function streamGLMText(
  messages: GLMMessage[],
  options: GLMOptions = {}
): Promise<Response> {
  const glmResponse = await callGLMStream(messages, options);
  const reader = glmResponse.body?.getReader();
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

/**
 * JSON extraction helper — strips markdown fences and parses JSON
 * Use after callGLM when expecting structured JSON output
 */
export function parseGLMJson<T>(rawContent: string): T {
  let cleaned = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  // Remove thinking block if present (between <think> tags)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  try {
    return JSON.parse(cleaned) as T
  } catch (err) {
    console.error('GLM JSON parse failed. Raw content:', rawContent)
    throw new Error(`Failed to parse GLM response as JSON: ${(err as Error).message}`)
  }
}
