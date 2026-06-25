---
name: onboarding-feature-evolution
description: Workflow command scaffold for onboarding-feature-evolution in SKILLED-CORE.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /onboarding-feature-evolution

Use this workflow when working on **onboarding-feature-evolution** in `SKILLED-CORE`.

## Goal

Iteratively improve the onboarding flow, including both frontend logic and backend API/schema, and keep the roadmap updated.

## Common Files

- `src/app/onboarding/**`
- `src/app/api/user/onboarding/route.ts`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `MASTER_ROADMAP.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Modify onboarding frontend components and logic.
- Update or add backend API routes related to onboarding.
- Update database schema and generate/apply migrations if needed.
- Update MASTER_ROADMAP.md to reflect onboarding changes.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.