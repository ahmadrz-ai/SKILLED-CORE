/**
 * SkilledCore — Gemini API Key Rotation
 * Used ONLY by resume parsing routes:
 *   - /api/parse-resume
 *   - /api/ai/parse-resume-from-url
 *
 * Rotates through up to 5 API keys automatically when quota is exhausted.
 * Never use this file for any other AI task.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Collect all 5 keys in order — skip undefined ones
function getGeminiKeys(): string[] {
  const keys = [
    process.env.GOOGLE_API_KEY_1,
    process.env.GOOGLE_API_KEY_2,
    process.env.GOOGLE_API_KEY_3,
    process.env.GOOGLE_API_KEY_4,
    process.env.GOOGLE_API_KEY_5,
  ].filter((k): k is string => Boolean(k && k.trim().length > 0))

  if (keys.length === 0) {
    throw new Error(
      'No Gemini API keys found. Set GOOGLE_API_KEY_1 through GOOGLE_API_KEY_5 in .env'
    )
  }

  return keys
}

/**
 * Determines if an error is a quota/rate limit error that warrants key rotation
 */
function isQuotaError(error: unknown): boolean {
  if (!error) return false
  const message = String((error as any)?.message || error).toLowerCase()
  const status = (error as any)?.status || (error as any)?.statusCode || 0
  return (
    status === 429 ||
    status === 503 ||
    message.includes('quota') ||
    message.includes('resource_exhaust5ed') ||
    message.includes('resource_exhausted') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('overloaded')
  )
}

/**
 * Call Gemini with automatic key rotation on quota exhaustion.
 * Tries each key in sequence until one succeeds.
 *
 * @param buildRequest - Function that receives a GoogleGenerativeAI instance
 *                       and returns a promise with the result.
 *                       This lets you use any Gemini feature (multimodal, etc.)
 */
export async function callGeminiWithRotation<T>(
  buildRequest: (client: GoogleGenerativeAI, keyIndex: number) => Promise<T>
): Promise<T> {
  const keys = getGeminiKeys()
  let lastError: unknown = null

  for (let i = 0; i < keys.length; i++) {
    try {
      const client = new GoogleGenerativeAI(keys[i])
      console.log(`[Gemini] Attempting with key ${i + 1} of ${keys.length}`)
      const result = await buildRequest(client, i)
      console.log(`[Gemini] Success with key ${i + 1}`)
      return result
    } catch (err) {
      lastError = err
      if (isQuotaError(err)) {
        console.warn(
          `[Gemini] Key ${i + 1} quota exhausted. ${
            i + 1 < keys.length ? `Trying key ${i + 2}...` : 'No more keys available.'
          }`
        )
        // Continue to next key
        continue
      }
      // Non-quota error — do not rotate, throw immediately
      console.error(`[Gemini] Non-quota error on key ${i + 1}:`, err)
      throw err
    }
  }

  // All keys exhausted
  console.error('[Gemini] All API keys quota exhausted')
  throw new Error(
    `All ${keys.length} Gemini API keys are quota exhausted. ` +
      `Last error: ${(lastError as Error)?.message || lastError}`
  )
}
