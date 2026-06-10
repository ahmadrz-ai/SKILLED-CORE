/**
 * Interview pass/fail policy — single source of truth.
 *
 * A Verified Skill Badge is granted ONLY when an interview's final score meets
 * INTERVIEW_PASS_THRESHOLD. Failed, terminated, abandoned, or integrity-voided
 * sessions never grant a badge and never count as "verified assessments".
 *
 * @Ahmad: change the threshold here (one place) if 70 isn't the number you want.
 */
export const INTERVIEW_PASS_THRESHOLD = 70; // out of 100

export function isPassingScore(score: number, cheated?: boolean): boolean {
    return !cheated && score >= INTERVIEW_PASS_THRESHOLD;
}

/** Stable machine id for a skill derived from the interview's target role. */
export function skillSlug(role: string): string {
    return (role || "general")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "general";
}

/** Canonical display name for a verified skill tag (e.g. "FRONTEND"). */
export function skillDisplayName(role: string): string {
    return (role || "General").trim().toUpperCase();
}
