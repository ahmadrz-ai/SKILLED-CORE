import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer | null {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY
  if (!key || key.length < 64) return null
  return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
  const key = getKey()
  if (!key) {
    console.error('[crypto] TWO_FACTOR_ENCRYPTION_KEY not set or invalid')
    throw new Error('Encryption key not configured. Contact administrator.')
  }

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join(':')
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  if (!key) {
    console.error('[crypto] TWO_FACTOR_ENCRYPTION_KEY not set or invalid')
    throw new Error('Decryption key not configured.')
  }

  const [ivHex, authTagHex, dataHex] = encryptedText.split(':')
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Invalid encrypted text format.')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(dataHex, 'hex')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8')
}
