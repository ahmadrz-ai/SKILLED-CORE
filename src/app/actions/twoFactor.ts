'use server';

import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { generateSecret, generateURI } from 'otplib';
import { verifyTotpWithSkew } from '@/lib/totp';
import { checkLoginRateLimit } from '@/lib/ratelimit';
import { validateTurnstile } from '@/lib/turnstile';
import QRCode from 'qrcode';

// ACTION 1 — Generate setup data (secret + QR code)
export async function generate2FASetup(): Promise<{
  success: boolean;
  data?: {
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Generate a new secret using functional otplib API
    const secret = generateSecret();

    // Build the OTPAuth URI using functional otplib object signature
    const otpAuthUrl = generateURI({
      secret,
      label: session.user.email ?? 'user',
      issuer: 'SkilledCore'
    });

    // Convert URI to QR code base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#141417',  // var(--text-heading) equivalent
        light: '#FFFFFF', // white background
      }
    });

    // Generate 8 backup codes (each 8 chars, alphanumeric)
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    return {
      success: true,
      data: { secret, qrCodeDataUrl, backupCodes }
    };
  } catch (err: any) {
    console.error('[twoFactor] generate2FASetup failed:', err);
    return { success: false, error: 'Failed to start 2FA configuration. Please try again.' };
  }
}

// ACTION 2 — Verify the code and enable 2FA
export async function enable2FA(
  secret: string,
  verificationCode: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the code with a ±1 step clock-skew window (handles phone/server drift)
    if (!verifyTotpWithSkew(verificationCode, secret)) {
      return { success: false, error: 'Invalid code. Please try again.' };
    }

    // Hash backup codes using bcrypt
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code.toUpperCase(), 10))
    );

    // Encrypt the TOTP secret using AES-256-GCM
    const encryptedSecret = encrypt(secret);

    // Save to database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorVerifiedAt: new Date(),
      }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error('[twoFactor] enable2FA failed:', err);
    return { success: false, error: 'Failed to enable Two-Factor Authentication. Please try again.' };
  }
}

// ACTION 3 — Disable 2FA
export async function disable2FA(
  passwordInput: string,
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify current password first
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) {
      return { success: false, error: 'Cannot verify identity' };
    }

    const passwordValid = await bcrypt.compare(passwordInput, user.password);
    if (!passwordValid) {
      return { success: false, error: 'Incorrect password' };
    }

    // Verify 2FA code
    if (user.twoFactorSecret) {
      const decryptedSecret = decrypt(user.twoFactorSecret);
      if (!verifyTotpWithSkew(verificationCode, decryptedSecret)) {
        return { success: false, error: 'Invalid authenticator code' };
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      }
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error('[twoFactor] disable2FA failed:', err);
    return { success: false, error: 'Failed to disable Two-Factor Authentication.' };
  }
}

// ACTION 4 — Regenerate Backup Codes
export async function regenerateBackupCodes(
  verificationCode: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: '2FA is not enabled on this account.' };
    }

    // Verify TOTP code first
    const decryptedSecret = decrypt(user.twoFactorSecret);
    if (!verifyTotpWithSkew(verificationCode, decryptedSecret)) {
      return { success: false, error: 'Invalid authenticator code. Cannot regenerate backup codes.' };
    }

    // Generate 8 new backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Hash new backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code.toUpperCase(), 10))
    );

    // Save to database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorBackupCodes: hashedBackupCodes,
      }
    });

    revalidatePath('/settings');
    return { success: true, backupCodes };
  } catch (err: any) {
    console.error('[twoFactor] regenerateBackupCodes failed:', err);
    return { success: false, error: 'Failed to regenerate backup codes.' };
  }
}

// ACTION 5 — Get revealable raw backup codes
export async function getBackupCodes(
  verificationCode: string
): Promise<{ success: boolean; hashedCodes?: string[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: '2FA is not enabled' };
    }

    const decryptedSecret = decrypt(user.twoFactorSecret);
    if (!verifyTotpWithSkew(verificationCode, decryptedSecret)) {
      return { success: false, error: 'Invalid authenticator code' };
    }

    return { success: true, hashedCodes: user.twoFactorBackupCodes };
  } catch (err: any) {
    console.error('[twoFactor] getBackupCodes failed:', err);
    return { success: false, error: 'Failed to fetch backup codes.' };
  }
}

// ACTION 6 — Password Verification prior to NextAuth 2FA redirection
export async function verifyPasswordLogin(
  identifier: string,
  passwordInput: string,
  turnstileToken: string = ''
): Promise<{ success: boolean; twoFactorRequired?: boolean; error?: string }> {
  try {
    const cleanEmail = identifier.toLowerCase().trim();

    // Resolve client IP for rate limiting + Turnstile.
    let ip = 'unknown';
    try {
      const { headers } = await import('next/headers');
      const h = await headers();
      ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
    } catch { /* headers unavailable — fall through with 'unknown' */ }

    // Rate-limit by IP to stop credential-stuffing / login storms (no-ops if Upstash
    // isn't configured). Keyed by IP so one abuser can't lock out everyone.
    const rl = await checkLoginRateLimit(ip);
    if (!rl.success) {
      return { success: false, error: 'Too many login attempts. Please wait a minute and try again.' };
    }

    // Bot protection (no-ops if Turnstile isn't configured).
    const human = await validateTurnstile(turnstileToken, ip);
    if (!human) {
      return { success: false, error: 'Security check failed. Please complete it and try again.' };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { username: { equals: cleanEmail, mode: 'insensitive' } }
        ]
      }
    });

    if (!user || !user.password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const passwordValid = await bcrypt.compare(passwordInput, user.password);
    if (!passwordValid) {
      await logLoginEvent(user.id, false);
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.twoFactorEnabled) {
      // Write secure short-lived cookie containing user ID and expiration
      const tempPayload = {
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      };
      const encryptedCookieVal = encrypt(JSON.stringify(tempPayload));
      
      const cookieStore = await cookies();
      cookieStore.set('skilledcore_2fa_temp', encryptedCookieVal, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300 // 5 minutes
      });

      return { success: true, twoFactorRequired: true };
    }

    return { success: true, twoFactorRequired: false };
  } catch (err: any) {
    console.error('[twoFactor] verifyPasswordLogin failed:', err);
    return { 
      success: false, 
      error: `Debug Error: ${err?.message || err}. Stack: ${err?.stack || 'None'}` 
    };
  }
}

// ACTION 7 — Verify 2FA verification code against temporary cookie
export async function verify2FAAndLogin(
  verificationCode: string
): Promise<{ success: boolean; email?: string; otp?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const tempCookie = cookieStore.get('skilledcore_2fa_temp')?.value;

    if (!tempCookie) {
      return { success: false, error: 'Session expired. Please try signing in again.' };
    }

    let payload: { userId: string; email: string; expiresAt: number };
    try {
      payload = JSON.parse(decrypt(tempCookie));
    } catch (err) {
      return { success: false, error: 'Authentication token is invalid or corrupt.' };
    }

    if (Date.now() > payload.expiresAt) {
      cookieStore.delete('skilledcore_2fa_temp');
      return { success: false, error: 'Session expired. Please try signing in again.' };
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.twoFactorSecret) {
      return { success: false, error: 'User account or 2FA parameters not found.' };
    }

    // Decrypt the stored secret. If the encryption key is missing or wrong (e.g. the
    // env var differs from where 2FA was enabled), decrypt throws — surface this as a
    // clear configuration error instead of a misleading "invalid code".
    let decryptedSecret: string;
    try {
      decryptedSecret = decrypt(user.twoFactorSecret);
    } catch (decErr) {
      console.error('[twoFactor] decrypt failed — TWO_FACTOR_ENCRYPTION_KEY missing or mismatched:', decErr);
      return {
        success: false,
        error: 'Two-factor is misconfigured on the server (encryption key). Please contact support.',
      };
    }

    let verified = verifyTotpWithSkew(verificationCode, decryptedSecret);

    if (!verified) {
      // Verify backup codes
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const isMatch = await bcrypt.compare(
          verificationCode.toUpperCase(),
          user.twoFactorBackupCodes[i]
        );
        if (isMatch) {
          verified = true;
          
          // Remove used backup code from array
          const updatedCodes = [...user.twoFactorBackupCodes];
          updatedCodes.splice(i, 1);
          
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: updatedCodes }
          });
          break;
        }
      }
    }

    if (!verified) {
      await logLoginEvent(user.id, false);
      return { success: false, error: 'Invalid authenticator or backup code.' };
    }

    // Create a single-use NextAuth OTP token, consumed by the credentials provider's
    // 2FA branch in authorize(). 120s window: long enough to survive a Neon cold-start
    // between this action returning and signIn() completing, short enough to stay safe.
    const otpToken = Math.random().toString(36).substring(2, 12).toUpperCase();
    await prisma.verificationToken.create({
      data: {
        identifier: user.email!.toLowerCase().trim(),
        token: otpToken,
        expires: new Date(Date.now() + 120000) // 120 seconds
      }
    });

    // Log successful login event
    await logLoginEvent(user.id, true);

    // Clear 2FA setup temp cookie
    cookieStore.delete('skilledcore_2fa_temp');

    return { success: true, email: user.email!, otp: otpToken };
  } catch (err: any) {
    console.error('[twoFactor] verify2FAAndLogin failed:', err);
    return { success: false, error: 'Two-factor verification failed. Please try again.' };
  }
}

// LOGGING HELPER — Log user login events
export async function logLoginEvent(userId: string, success: boolean) {
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const xForwardedFor = headersList.get('x-forwarded-for');
    const xRealIp = headersList.get('x-real-ip');
    const ip = xForwardedFor?.split(',')[0]?.trim() || xRealIp || '127.0.0.1';

    // Vercel Geolocation headers
    const city = headersList.get("x-vercel-ip-city");
    const region = headersList.get("x-vercel-ip-country-region");
    const country = headersList.get("x-vercel-ip-country");

    let location: string | null = null;
    if (city || country) {
      const parts = [];
      if (city) parts.push(city);
      if (region) parts.push(region);
      if (country) parts.push(country);
      location = parts.join(", ");
    } else if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      location = "Localhost (Development)";
    }

    await prisma.loginEvent.create({
      data: {
        userId,
        success,
        ipAddress: ip,
        userAgent,
        location: location || null,
      }
    });
  } catch (err) {
    console.error('Failed to log login event:', err);
  }
}

// ACTION 8 — Get Active Sessions
export async function getActiveSessions(): Promise<any[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const uaSessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        sessionToken: true,
        expires: true,
      }
    });

    return uaSessions.map((s: any) => {
      return {
        id: s.id,
        sessionToken: s.sessionToken,
        deviceName: 'Active Session',
        ipAddress: null,
        location: null,
        lastActive: s.expires.toISOString(),
        isCurrent: false,
      };
    });
  } catch (err: any) {
    console.warn('[settings] getActiveSessions failed:', err?.message);
    return [];
  }
}

// ACTION 9 — Revoke Session (Using deleteMany for robust non-crashing behavior)
export async function revokeSession(sessionToken: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    await prisma.session.deleteMany({
      where: {
        sessionToken,
        userId: session.user.id
      }
    });
    return true;
  } catch (err) {
    console.error('Failed to revoke session:', err);
    return false;
  }
}

// ACTION 10 — Revoke all other sessions (Using deleteMany for robust non-crashing behavior)
export async function revokeAllOtherSessions(currentSessionToken: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        sessionToken: { not: currentSessionToken }
      }
    });
    return true;
  } catch (err) {
    console.error('Failed to revoke other sessions:', err);
    return false;
  }
}

// ACTION 11 — Get Login History
export async function getLoginHistory(): Promise<any[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Verify LoginEvent model exists in DB schema
    const events = await prisma.loginEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        success: true,
        ipAddress: true,
        location: true,
        createdAt: true,
      }
    });

    return events.map((e: any) => {
      return {
        id: e.id,
        deviceName: 'Security Sign-in Alert',
        ipAddress: e.ipAddress ?? 'Unknown',
        location: e.location ?? 'Unknown',
        success: e.success,
        createdAt: e.createdAt.toISOString(),
      };
    });
  } catch (err: any) {
    console.warn('[settings] getLoginHistory failed, returning empty:', err?.message);
    return [];
  }
}
