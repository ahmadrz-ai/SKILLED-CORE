import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Distributed login rate limiting (Upstash Redis).
 *
 * Serverless functions don't share memory, so an in-memory limiter is useless across
 * instances. Upstash gives a shared store. If the env vars aren't configured, this
 * gracefully no-ops (allows the request) so the app still works before Upstash is set
 * up — but logs a one-time warning so it's not silently unprotected in production.
 *
 * Required env (add in Vercel + local .env):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

let limiter: Ratelimit | null = null
let warned = false

function getLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (!warned) {
      console.warn('[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — login rate limiting is DISABLED.')
      warned = true
    }
    return null
  }
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      // 10 login attempts per 60s per identifier (IP). Bursty enough for real users,
      // tight enough to stop credential-stuffing / a thundering herd.
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      prefix: 'rl:login',
      analytics: false,
    })
  }
  return limiter
}

export async function checkLoginRateLimit(identifier: string): Promise<{ success: boolean; reset: number }> {
  const rl = getLimiter()
  if (!rl) return { success: true, reset: 0 } // not configured → allow
  try {
    const res = await rl.limit(identifier)
    return { success: res.success, reset: res.reset }
  } catch (err) {
    // Never let a rate-limiter outage block logins.
    console.error('[ratelimit] check failed, allowing request:', err)
    return { success: true, reset: 0 }
  }
}

// ── Generic, per-bucket distributed limiter ──────────────────────────────────
// Used to protect expensive endpoints (paid AI calls) from anonymous/abusive
// floods. Each `name` gets its own sliding-window limiter, cached per process.
const buckets = new Map<string, Ratelimit>()

function getBucketLimiter(name: string, limit: number, windowSec: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const key = `${name}:${limit}:${windowSec}`
  let rl = buckets.get(key)
  if (!rl) {
    rl = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `rl:${name}`,
      analytics: false,
    })
    buckets.set(key, rl)
  }
  return rl
}

/**
 * Rate-limit an arbitrary action bucket. Returns { success } — if Upstash isn't
 * configured it allows (so dev/local keeps working) but the caller should still
 * require auth as the primary gate.
 */
export async function checkRateLimit(
  name: string,
  identifier: string,
  limit = 20,
  windowSec = 60,
): Promise<{ success: boolean; reset: number }> {
  const rl = getBucketLimiter(name, limit, windowSec)
  if (!rl) return { success: true, reset: 0 }
  try {
    const res = await rl.limit(identifier)
    return { success: res.success, reset: res.reset }
  } catch (err) {
    console.error('[ratelimit] bucket check failed, allowing request:', err)
    return { success: true, reset: 0 }
  }
}
