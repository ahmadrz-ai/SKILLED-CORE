/**
 * B2 — One-time Verified Skill Badge backfill / cleanup.
 *
 * Re-derives verified status from ACTUAL interview scores:
 *  - REVOKE badges whose backing interview never met INTERVIEW_PASS_THRESHOLD
 *    (or that have no passing interview for their skill at all).
 *  - DE-DUPE multiple badges for the same skill (keep the best, revoke the rest).
 *  - LINK kept badges to their best passing interview + its real score.
 *  - GRANT missing badges for passing interviews that never got one (old flow
 *    never wrote VerifiedSkill rows at all).
 *
 * DRY RUN by default — prints what would change and touches nothing.
 * Apply with:  node scripts/backfill-verified-skills.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const INTERVIEW_PASS_THRESHOLD = 70; // keep in sync with src/lib/interviewScoring.ts

const slug = (role) =>
    (role || "general").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
const display = (role) => (role || "General").trim().toUpperCase();

async function main() {
    console.log(`\n=== Verified Skill Badge backfill — ${APPLY ? "APPLY MODE" : "DRY RUN (no writes)"} ===\n`);

    const [badges, interviews] = await Promise.all([
        prisma.verifiedSkill.findMany(),
        prisma.interview.findMany({ select: { id: true, userId: true, role: true, score: true, radarData: true, createdAt: true } }),
    ]);

    // Best PASSING interview per (userId, skillSlug)
    const bestPass = new Map(); // key: userId|slug -> { id, score }
    for (const iv of interviews) {
        const cheated = iv.radarData && typeof iv.radarData === "object" && iv.radarData.cheated;
        if (cheated || (iv.score || 0) < INTERVIEW_PASS_THRESHOLD) continue;
        const key = `${iv.userId}|${slug(iv.role)}`;
        const prev = bestPass.get(key);
        if (!prev || iv.score > prev.score) bestPass.set(key, { id: iv.id, score: iv.score });
    }

    const toRevoke = [];   // { id, reason }
    const toUpdate = [];   // { id, data }
    const keptPerKey = new Map(); // userId|slug -> badge id kept

    // Sort so the highest-scored badge per skill wins the de-dupe.
    const sorted = [...badges].sort((a, b) => (b.depthScore || 0) - (a.depthScore || 0));
    for (const b of sorted) {
        const key = `${b.userId}|${b.skillId || slug(b.name)}`;
        const pass = bestPass.get(key);

        if (!pass) {
            toRevoke.push({ id: b.id, name: b.name || b.skillId, userId: b.userId, reason: "no passing interview backs this skill" });
            continue;
        }
        if (keptPerKey.has(key)) {
            toRevoke.push({ id: b.id, name: b.name || b.skillId, userId: b.userId, reason: "duplicate skill badge (kept the best one)" });
            continue;
        }
        keptPerKey.set(key, b.id);
        if (b.interviewId !== pass.id || b.depthScore !== pass.score || b.status !== "VERIFIED") {
            toUpdate.push({ id: b.id, name: b.name || b.skillId, data: { interviewId: pass.id, depthScore: pass.score, status: "VERIFIED" } });
        }
    }

    // Grant badges for passing interviews with no badge at all.
    const toCreate = [];
    for (const [key, pass] of bestPass.entries()) {
        if (keptPerKey.has(key)) continue;
        const [userId, skillId] = key.split("|");
        const iv = interviews.find((i) => i.id === pass.id);
        toCreate.push({
            userId, skillId,
            name: display(iv?.role),
            description: `Verified via AI interview (${pass.score}/100)`,
            status: "VERIFIED", depthScore: pass.score, interviewId: pass.id,
        });
    }

    console.log(`Badges examined:        ${badges.length}`);
    console.log(`REVOKE (failed/orphan): ${toRevoke.filter(r => r.reason.includes("no passing")).length}`);
    console.log(`REVOKE (duplicates):    ${toRevoke.filter(r => r.reason.includes("duplicate")).length}`);
    console.log(`RELINK/fix kept badges: ${toUpdate.length}`);
    console.log(`GRANT (missing badges): ${toCreate.length}\n`);

    for (const r of toRevoke) console.log(`  - REVOKE ${r.name} (user ${r.userId.slice(0, 8)}…): ${r.reason}`);
    for (const u of toUpdate) console.log(`  - FIX    ${u.name}: link interview ${u.data.interviewId.slice(0, 8)}… score ${u.data.depthScore}`);
    for (const c of toCreate) console.log(`  - GRANT  ${c.name} (user ${c.userId.slice(0, 8)}…): score ${c.depthScore}`);

    if (!APPLY) {
        console.log("\nDry run complete. Re-run with --apply to write these changes.");
        return;
    }

    let revoked = 0, updated = 0, created = 0;
    for (const r of toRevoke) {
        await prisma.verifiedSkill.update({ where: { id: r.id }, data: { status: "REVOKED" } });
        revoked++;
    }
    for (const u of toUpdate) {
        await prisma.verifiedSkill.update({ where: { id: u.id }, data: u.data });
        updated++;
    }
    for (const c of toCreate) {
        await prisma.verifiedSkill.create({ data: c });
        created++;
    }
    console.log(`\nAPPLIED: ${revoked} revoked, ${updated} fixed, ${created} granted.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
