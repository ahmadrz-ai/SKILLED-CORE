/**
 * FIX-004: Production database cleanup script
 * Purges test/bot accounts from the production talent pool.
 *
 * Usage (run ONCE in production, after backing up):
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/purge-test-accounts.ts
 *
 * IMPORTANT: Review the dry-run output BEFORE enabling DELETE mode.
 * Set DRY_RUN=false only after confirming the correct accounts are targeted.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set to false to execute actual deletion (after reviewing dry-run output)
const DRY_RUN = true;

const PLACEHOLDER_BIO = "Experienced professional. Please update your profile with specific details.";
const PLACEHOLDER_ROLE = "Professional Role";
const PLACEHOLDER_COMPANY = "Company Name";

const TEST_NAMES = ['test2', 'testings', 'new', 'Test Analyst', 'OpenAI @ Deep Machines'];
const SANDBOX_EMAIL_DOMAINS = ['@test.com', '@example.com', '@skilledcore-test.com'];

async function main() {
    console.log(`\n🔍 SkilledCore — Test Account Purge Script`);
    console.log(`Mode: ${DRY_RUN ? '🟡 DRY RUN (no changes will be made)' : '🔴 LIVE MODE — will DELETE records'}`);
    console.log(`─────────────────────────────────────────\n`);

    // 1. Find accounts by explicit test names
    const byName = await prisma.user.findMany({
        where: {
            OR: TEST_NAMES.map(name => ({ name: { equals: name, mode: 'insensitive' as const } }))
        },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    // 2. Find accounts with sandbox email domains
    const bySandboxEmail = await prisma.user.findMany({
        where: {
            OR: SANDBOX_EMAIL_DOMAINS.map(domain => ({ email: { endsWith: domain } }))
        },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    // 3. Find accounts with placeholder bio
    const byPlaceholderBio = await prisma.user.findMany({
        where: { bio: PLACEHOLDER_BIO },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    // 4. Find accounts with placeholder company (name = "Company Name")
    const byPlaceholderCompany = await prisma.user.findMany({
        where: {
            company: { name: PLACEHOLDER_COMPANY }
        },
        select: { id: true, name: true, email: true, createdAt: true }
    });

    // Deduplicate all targets
    const allTargets = new Map<string, { id: string; name: string | null; email: string | null; createdAt: Date }>();
    [...byName, ...bySandboxEmail, ...byPlaceholderBio, ...byPlaceholderCompany].forEach(u => {
        if (!allTargets.has(u.id)) allTargets.set(u.id, u);
    });

    const targets = [...allTargets.values()];

    console.log(`Found ${targets.length} candidate accounts for purge:\n`);
    targets.forEach((u, i) => {
        console.log(`  ${i + 1}. ID: ${u.id}`);
        console.log(`     Name: ${u.name || '(no name)'}`);
        console.log(`     Email: ${u.email || '(no email)'}`);
        console.log(`     Created: ${u.createdAt.toISOString()}`);
        console.log('');
    });

    if (targets.length === 0) {
        console.log('✅ No test accounts found. Database is clean.');
        return;
    }

    if (DRY_RUN) {
        console.log(`\n🟡 DRY RUN: No records were deleted.`);
        console.log(`   To execute, set DRY_RUN = false in this script and re-run.\n`);
        return;
    }

    // --- LIVE DELETION ---
    console.log(`\n⚠️  Proceeding with deletion of ${targets.length} accounts...\n`);

    const targetIds = targets.map(u => u.id);

    // Export to backup table before deletion
    // Note: PostgreSQL-specific — adjust for other databases
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS purged_test_accounts (
                id TEXT,
                name TEXT,
                email TEXT,
                role TEXT,
                created_at TIMESTAMPTZ,
                purged_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await prisma.$executeRawUnsafe(`
            INSERT INTO purged_test_accounts (id, name, email, role, created_at)
            SELECT id, name, email, role, "createdAt" FROM "User"
            WHERE id = ANY($1::text[]);
        `, targetIds);

        console.log(`✅ Backed up ${targetIds.length} accounts to purged_test_accounts table`);
    } catch (err) {
        console.error(`⚠️  Backup failed (table may already exist or raw SQL unsupported):`, err);
        console.log(`   Continuing with deletion...`);
    }

    // Delete accounts — Prisma cascades will handle related records
    const deleted = await prisma.user.deleteMany({
        where: { id: { in: targetIds } }
    });

    console.log(`\n✅ Deleted ${deleted.count} test accounts from production.`);
    console.log(`\nNext steps:`);
    console.log(`  1. Verify the talent pool no longer shows test accounts`);
    console.log(`  2. The purged_test_accounts backup table contains an audit trail`);
    console.log(`  3. Deploy FIX-003 (bot protection) to prevent recurrence\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
