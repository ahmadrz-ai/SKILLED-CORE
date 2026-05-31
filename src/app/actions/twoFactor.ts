'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Static Imports for secure typescript compiling
// @ts-ignore
const otplib = require('otplib');
const authenticator = otplib.authenticator;
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import geoip from 'geoip-lite';

// ACTION 1 — Generate setup data (secret + QR code)
// Called when user clicks "Set Up Two-Factor Auth"
export async function generate2FASetup(): Promise<{
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');

  // Generate a new secret
  const secret = authenticator.generateSecret();

  // Build the OTPAuth URI
  const otpAuthUrl = authenticator.keyuri(
    session.user.email ?? 'user',
    'SkilledCore',
    secret
  );

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

  // Return — do NOT save to DB yet
  return { secret, qrCodeDataUrl, backupCodes };
}

// ACTION 2 — Verify the code and enable 2FA
// Called when user submits the 6-digit code from their authenticator app during setup
export async function enable2FA(
  secret: string,
  verificationCode: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

  // Verify the code against the secret
  const isValid = authenticator.verify({ token: verificationCode, secret });
  if (!isValid) {
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
}

// ACTION 3 — Disable 2FA
// Requires the user to enter their current password + a valid 2FA code
export async function disable2FA(
  passwordInput: string,
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

  // Verify current password first
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { success: false, error: 'Cannot verify identity' };

  const passwordValid = await bcrypt.compare(passwordInput, user.password);
  if (!passwordValid) return { success: false, error: 'Incorrect password' };

  // Verify 2FA code
  if (user.twoFactorSecret) {
    const decryptedSecret = decrypt(user.twoFactorSecret);
    const codeValid = authenticator.verify({
      token: verificationCode,
      secret: decryptedSecret
    });
    if (!codeValid) return { success: false, error: 'Invalid authenticator code' };
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    }
  });

  revalidatePath('/settings');
  return { success: true };
}

// ACTION 4 — Regenerate Backup Codes
// Requires the user to verify their current TOTP code first
export async function regenerateBackupCodes(
  verificationCode: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: '2FA is not enabled on this account.' };
  }

  // Verify TOTP code first
  const decryptedSecret = decrypt(user.twoFactorSecret);
  const codeValid = authenticator.verify({
    token: verificationCode,
    secret: decryptedSecret
  });
  if (!codeValid) return { success: false, error: 'Invalid authenticator code. Cannot regenerate backup codes.' };

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
}

// ACTION 5 — Get revealable raw backup codes
// Requires verifying TOTP code first
export async function getBackupCodes(
  verificationCode: string
): Promise<{ success: boolean; hashedCodes?: string[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: '2FA is not enabled' };
  }

  const decryptedSecret = decrypt(user.twoFactorSecret);
  const codeValid = authenticator.verify({
    token: verificationCode,
    secret: decryptedSecret
  });

  if (!codeValid) {
    return { success: false, error: 'Invalid authenticator code' };
  }

  return { success: true, hashedCodes: user.twoFactorBackupCodes };
}

// ACTION 6 — Password Verification prior to NextAuth 2FA redirection
// Verifies email + password, and writes a short-lived httpOnly secure cookie if 2FA is required
export async function verifyPasswordLogin(
  identifier: string,
  passwordInput: string
): Promise<{ success: boolean; twoFactorRequired?: boolean; error?: string }> {
  const cleanEmail = identifier.toLowerCase().trim();

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
    // Log failed login event
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

  // If no 2FA required, standard credentials login proceeds on the client
  return { success: true, twoFactorRequired: false };
}

// ACTION 7 — Verify 2FA verification code against temporary cookie
// Generates a 30-second single-use NextAuth OTP token on success
export async function verify2FAAndLogin(
  verificationCode: string
): Promise<{ success: boolean; email?: string; otp?: string; error?: string }> {
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

  const decryptedSecret = decrypt(user.twoFactorSecret);

  let verified = authenticator.verify({
    token: verificationCode,
    secret: decryptedSecret
  });

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

  // Create standard NextAuth OTP verification request (expires in 30 seconds)
  const otpToken = Math.random().toString(36).substring(2, 12).toUpperCase();
  await prisma.verificationToken.create({
    data: {
      identifier: user.email!.toLowerCase().trim(),
      token: otpToken,
      expires: new Date(Date.now() + 30000) // 30 seconds
    }
  });

  // Log successful login event
  await logLoginEvent(user.id, true);

  // Clear 2FA setup temp cookie
  cookieStore.delete('skilledcore_2fa_temp');

  return { success: true, email: user.email!, otp: otpToken };
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

    let location: string | undefined = undefined;
    if (geoip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('10.') && !ip.startsWith('192.168.')) {
      const geo = geoip.lookup(ip);
      if (geo) {
        const parts = [];
        if (geo.city) parts.push(geo.city);
        if (geo.region) parts.push(geo.region);
        if (geo.country) parts.push(geo.country);
        location = parts.join(', ');
      }
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
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const uaSessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const { UAParser } = await import('ua-parser-js');

    return uaSessions.map((s: any) => {
      const parser = new UAParser(s.userAgent || '');
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const deviceName = `${browser.name || 'Unknown Browser'} on ${os.name || 'Unknown OS'}`;

      return {
        id: s.id,
        sessionToken: s.sessionToken,
        deviceName,
        ipAddress: s.ipAddress || null,
        location: s.location || null,
        lastActive: s.createdAt || new Date(),
        isCurrent: false,
      };
    });
  } catch (err: any) {
    // Columns like userAgent/ipAddress/location may not exist yet (migration pending)
    console.warn('getActiveSessions fallback — new Session columns missing:', err?.message);
    try {
      const uaSessions = await prisma.session.findMany({
        where: { userId: session.user.id },
      });
      return uaSessions.map((s: any) => ({
        id: s.id,
        sessionToken: s.sessionToken,
        deviceName: 'Browser session',
        ipAddress: null,
        location: null,
        lastActive: s.expires || new Date(),
        isCurrent: false,
      }));
    } catch {
      return [];
    }
  }
}

// ACTION 9 — Revoke Session
export async function revokeSession(sessionToken: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    await prisma.session.delete({
      where: { sessionToken }
    });
    return true;
  } catch (err) {
    console.error('Failed to revoke session:', err);
    return false;
  }
}

// ACTION 10 — Revoke all other sessions
export async function revokeAllOtherSessions(currentSessionToken: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
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
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const events = await prisma.loginEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const { UAParser } = await import('ua-parser-js');

    return events.map((e: any) => {
      const parser = new UAParser(e.userAgent || '');
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const deviceName = `${browser.name || 'Browser'} on ${os.name || 'OS'}`;

      return {
        id: e.id,
        deviceName,
        ipAddress: e.ipAddress,
        location: e.location,
        success: e.success,
        createdAt: e.createdAt,
      };
    });
  } catch (err: any) {
    // LoginEvent table does not exist yet (migration pending)
    console.warn('getLoginHistory fallback — LoginEvent table missing:', err?.message);
    return [];
  }
}
