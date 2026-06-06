import 'server-only'
import { createHmac } from 'crypto'

/**
 * RFC-6238 TOTP verification with a clock-skew window.
 *
 * Why this exists: otplib@13's functional `verify()` is hard-locked to the real
 * current time with ZERO tolerance — its `timestamp`/`window`/`delta`/`epochTolerance`
 * options are silently ignored. That makes login fail whenever the user's phone or the
 * server clock drifts by even one 30s step. This helper reimplements the standard
 * algorithm (base32 secret, SHA-1, 6 digits, 30s period — exactly what Google
 * Authenticator uses, verified to produce identical codes to otplib) and accepts a
 * configurable ±window of time steps.
 *
 * We still use otplib's generateSecret()/generateURI() for setup/QR — only the
 * verification path is replaced.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, '').toUpperCase().replace(/\s+/g, '')
  let bits = ''
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char)
    if (val === -1) continue // ignore non-base32 chars defensively
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

/** Generate the TOTP code for a given counter (time step). */
function generateForCounter(secret: string, counter: number, digits = 6, algorithm = 'sha1'): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = createHmac(algorithm, key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return (binary % 10 ** digits).toString().padStart(digits, '0')
}

/**
 * Verify a 6-digit TOTP token against a base32 secret, allowing ±`window` time steps
 * of clock skew (default 1 step = ±30s, i.e. a ~90s acceptance span — the common,
 * RFC-recommended default).
 */
export function verifyTotpWithSkew(
  token: string,
  secret: string,
  options: { window?: number; step?: number; digits?: number; algorithm?: string } = {}
): boolean {
  const window = options.window ?? 1
  const step = options.step ?? 30
  const digits = options.digits ?? 6
  const algorithm = options.algorithm ?? 'sha1'

  const normalized = (token || '').replace(/\s+/g, '').trim()
  if (!/^\d{6}$/.test(normalized) || !secret) return false

  const counter = Math.floor(Date.now() / 1000 / step)
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const expected = generateForCounter(secret, counter + errorWindow, digits, algorithm)
    // length-safe comparison (both are fixed-length numeric strings)
    if (expected === normalized) return true
  }
  return false
}
