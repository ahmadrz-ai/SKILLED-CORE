import 'server-only'

/**
 * Server-side Cloudflare Turnstile verification.
 * Gracefully skips (returns true) if TURNSTILE_SECRET_KEY isn't configured so local/dev
 * and unconfigured deploys still work — logs a warning so it's not silently off.
 */
export async function validateTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey || secretKey === 'YOUR_TURNSTILE_SECRET_KEY') {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not configured — skipping CAPTCHA validation')
    return true
  }
  if (!token) return false
  try {
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) formData.append('remoteip', remoteIp)
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })
    const data = await result.json()
    return !!data.success
  } catch (err) {
    console.error('[turnstile] verification failed:', err)
    return false
  }
}
