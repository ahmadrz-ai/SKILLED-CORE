```markdown
# SKILLED-CORE Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you how to contribute effectively to the SKILLED-CORE codebase, a TypeScript project built with Next.js. You'll learn the repository's coding conventions, commit patterns, and the main workflows for keeping features, onboarding, and the project roadmap in sync. This guide ensures consistency and clarity for all contributors.

## Coding Conventions

### File Naming

- Use **PascalCase** for all file and component names.

  **Example:**
  ```
  src/components/UserProfile.tsx
  src/app/onboarding/OnboardingStep.tsx
  ```

### Import Style

- Use **alias imports** for modules.

  **Example:**
  ```typescript
  import UserProfile from '@/components/UserProfile';
  import { getSession } from '@/lib/auth';
  ```

### Export Style

- Use **default exports** for components and modules.

  **Example:**
  ```typescript
  // src/components/UserProfile.tsx
  const UserProfile = () => { /* ... */ };
  export default UserProfile;
  ```

### Commit Patterns

- Commit types: `docs`, `feat`, `fix`, `security`
- Prefix each commit with the type.
- Keep commit messages concise (average ~73 characters).

  **Example:**
  ```
  feat: add onboarding step for profile completion
  fix: resolve user session bug in onboarding flow
  docs: update roadmap with new onboarding features
  ```

## Workflows

### Update Roadmap and Related Feature Implementation

**Trigger:** When adding a new feature, fixing a bug, or addressing tech debt, and you want to keep the roadmap in sync.  
**Command:** `/roadmap-sync`

1. Implement code changes for the feature, fix, or tech debt.
    - This could include changes in backend, frontend, schema, or dependencies.
2. Update `MASTER_ROADMAP.md` to describe the change, progress, or outstanding issues.
3. Commit both the code changes and the updated roadmap together.

**Files Involved:**
- `MASTER_ROADMAP.md`
- `src/app/**`
- `src/components/**`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json`
- `package-lock.json`

**Example:**
```bash
# Make code changes
git add src/app/FeatureX.tsx

# Update roadmap
git add MASTER_ROADMAP.md

# Commit together
git commit -m "feat: implement FeatureX and update roadmap"
```

---

### Onboarding Feature Evolution

**Trigger:** When adding, removing, or refining steps in the onboarding process.  
**Command:** `/onboarding-update`

1. Modify onboarding frontend components and logic in `src/app/onboarding/**`.
2. Update or add backend API routes in `src/app/api/user/onboarding/route.ts`.
3. Update the database schema in `prisma/schema.prisma` and generate/apply migrations if needed.
4. Update `MASTER_ROADMAP.md` to reflect onboarding changes.

**Files Involved:**
- `src/app/onboarding/**`
- `src/app/api/user/onboarding/route.ts`
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `MASTER_ROADMAP.md`

**Example:**
```typescript
// src/app/onboarding/NewStep.tsx
const NewStep = () => { /* ... */ };
export default NewStep;
```
```bash
# Update schema and run migration
npx prisma migrate dev --name add_new_onboarding_step

# Update roadmap
git add MASTER_ROADMAP.md

# Commit all changes
git commit -m "feat: add new onboarding step and update roadmap"
```

## Testing Patterns

- Test files use the pattern: `*.test.*`
- The testing framework is currently **unknown** (check for Jest, Vitest, etc.).
- Place test files alongside the modules they test or in a dedicated `__tests__` directory.

**Example:**
```
src/components/UserProfile.test.tsx
src/app/onboarding/OnboardingStep.test.ts
```

## Commands

| Command            | Purpose                                                      |
|--------------------|--------------------------------------------------------------|
| /roadmap-sync      | Sync code changes with updates to the roadmap                |
| /onboarding-update | Evolve onboarding features and keep roadmap up to date       |
```
