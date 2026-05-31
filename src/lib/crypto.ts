import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || "";

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not set in environment variables.");
    }
    let key: Buffer;
    if (ENCRYPTION_KEY.length === 64) {
        key = Buffer.from(ENCRYPTION_KEY, 'hex');
    } else {
        key = Buffer.alloc(32);
        Buffer.from(ENCRYPTION_KEY, 'utf-8').copy(key);
    }

    const iv = crypto.randomBytes(12); // 12-byte IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not set in environment variables.");
    }
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    let key: Buffer;
    if (ENCRYPTION_KEY.length === 64) {
        key = Buffer.from(ENCRYPTION_KEY, 'hex');
    } else {
        key = Buffer.alloc(32);
        Buffer.from(ENCRYPTION_KEY, 'utf-8').copy(key);
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}
