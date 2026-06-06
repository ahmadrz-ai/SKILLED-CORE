/**
 * One-time, ACCOUNT-SCOPED 2FA recovery.
 *
 * Disables two-factor auth for a SINGLE user (by email) so they can log back in after
 * being locked out by a 2FA misconfiguration. After logging in, the user should
 * re-enable 2FA from Settings — it will store a fresh secret with the now-correct key.
 *
 * Usage:  node scripts/disable-2fa.js you@example.com
 *
 * Safety: requires an explicit email argument; never prints secrets; touches exactly
 * one row; refuses to run without a match.
 */
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL etc. from .env (no dotenv dependency)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  });
}

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/disable-2fa.js <email>');
    process.exit(1);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, twoFactorEnabled: true },
    });
    if (!user) {
      console.error(`No user found with email "${email}". Nothing changed.`);
      process.exit(1);
    }
    if (!user.twoFactorEnabled) {
      console.log(`2FA is already disabled for ${user.email}. Nothing to do.`);
      process.exit(0);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      },
    });
    console.log(`2FA disabled for ${user.email}. You can log in with just your password now.`);
    console.log('Re-enable 2FA from Settings afterwards to store a fresh secret with the correct key.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error('Recovery failed:', e.message); process.exit(1); });
