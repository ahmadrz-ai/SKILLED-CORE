---
name: update-roadmap-and-related-feature-implementation
description: Workflow command scaffold for update-roadmap-and-related-feature-implementation in SKILLED-CORE.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-roadmap-and-related-feature-implementation

Use this workflow when working on **update-roadmap-and-related-feature-implementation** in `SKILLED-CORE`.

## Goal

Update the MASTER_ROADMAP.md to reflect new features, fixes, or tech debt, while simultaneously implementing related code changes (feature, fix, migration, or dependency update).

## Common Files

- `MASTER_ROADMAP.md`
- `src/app/**`
- `src/components/**`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Implement code changes for the feature, fix, or tech debt (could include backend, frontend, schema, or dependencies).
- Update MASTER_ROADMAP.md to describe the change, progress, or outstanding issues.
- Commit both the code changes and updated roadmap together.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.