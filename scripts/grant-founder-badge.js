/**
 * One-off: grant a "PROMPT ENGINEERING" Verified Skill badge to the founder
 * so the badge UI can be previewed. Matches the slug/name format that
 * finalizeInterview() uses, so it de-dupes/upgrades cleanly later.
 *
 * Usage:
 *   node scripts/grant-founder-badge.js                  # auto-finds the admin/founder
 *   node scripts/grant-founder-badge.js you@example.com  # explicit target
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SKILL_ID = 'prompt-engineering';
const SKILL_NAME = 'PROMPT ENGINEERING';
const DEPTH = 95;
const FOUNDER_EMAILS = [
    'ahmad.raza@cloudsurge.solutions',
    'ahmadrazaai801@gmail.com',
    'ahmad@skilledcore.com',
    'support@skilledcore.com',
];

async function resolveUser() {
    const argEmail = process.argv[2];
    if (argEmail) {
        const u = await prisma.user.findFirst({ where: { email: { equals: argEmail, mode: 'insensitive' } } });
        if (u) return u;
        console.error(`No user found with email ${argEmail}`);
        process.exit(1);
    }
    // Prefer an explicit founder email, then fall back to any ADMIN.
    for (const e of FOUNDER_EMAILS) {
        const u = await prisma.user.findFirst({ where: { email: { equals: e, mode: 'insensitive' } } });
        if (u) return u;
    }
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true, name: true } });
    if (admins.length === 1) return admins[0];
    if (admins.length === 0) { console.error('No admin/founder user found. Pass an email arg.'); process.exit(1); }
    console.error('Multiple admins found — pass the target email explicitly:');
    admins.forEach((a) => console.error(`  - ${a.email} (${a.name})`));
    process.exit(1);
}

async function main() {
    const user = await resolveUser();
    console.log(`Target: ${user.email} (${user.id})`);

    const existing = await prisma.verifiedSkill.findFirst({ where: { userId: user.id, skillId: SKILL_ID } });
    if (existing) {
        const updated = await prisma.verifiedSkill.update({
            where: { id: existing.id },
            data: { status: 'VERIFIED', name: SKILL_NAME, depthScore: DEPTH, description: `Verified via AI interview (${DEPTH}/100)`, verifiedAt: new Date() },
        });
        console.log(`Updated existing badge → ${updated.id} (${updated.name}, ${updated.depthScore}/100)`);
    } else {
        const created = await prisma.verifiedSkill.create({
            data: {
                userId: user.id,
                skillId: SKILL_ID,
                name: SKILL_NAME,
                description: `Verified via AI interview (${DEPTH}/100)`,
                status: 'VERIFIED',
                depthScore: DEPTH,
            },
        });
        console.log(`Created badge → ${created.id} (${created.name}, ${created.depthScore}/100)`);
    }

    // Mirror onto the profile skills string (same as finalizeInterview).
    const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { skills: true } });
    const current = (fresh?.skills || '').trim();
    if (!current.toLowerCase().includes(SKILL_NAME.toLowerCase()) && !current.startsWith('[')) {
        const next = current ? `${current}, ${SKILL_NAME}` : SKILL_NAME;
        await prisma.user.update({ where: { id: user.id }, data: { skills: next } });
        console.log('Synced skill onto profile skills string.');
    }
    console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
