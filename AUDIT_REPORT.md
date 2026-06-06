# SkilledCore — Audit Report and Fix Log

Date: 2026-06-06
Reviewer: Ahmad's coding assistant
Scope: Fix the live "AI parsing failed" error + safe high-impact wins + MVP readiness review.
Live site: https://skilledcore.com

> Note on secrets: this report never prints API keys or secret values. It only refers to environment variable *names*. Treat every key value as confidential.

---

## 1. TL;DR (read this first)

**What broke:** The AI Resume Profile Builder threw "AI parsing failed". The cause was not one bug, it was four overlapping ones. The biggest is an environment variable name mismatch on Vercel, plus a parser that had no fallback when its only AI provider hit a rate limit.

**What I fixed in code (6 files):**

1. Gemini key detection now reads your production key name `GOOGLE_API_KEY2` (it was being silently ignored).
2. The PDF parse path now falls back to a text model if Gemini fails, instead of dying.
3. A dead API route call (`/api/ai/parse-resume`) was pointing at a route that does not exist (404). Repointed to the real one.
4. Option A ("Parse existing resume") was loading an empty profile even on success because of a response shape mismatch. Fixed.
5. Two N+1 database loops in the feed actions (followers / following) collapsed into one query each.
6. The app layout fired 7 database queries one after another on every single page load. They now run in parallel.

**What only YOU can do (I cannot reach your Vercel dashboard):**

- Verify the AI keys on Vercel are valid and not over quota. This is the most likely live cause.
- Rename `GOOGLE_API_KEY2` to a clean name or keep it (code now reads both).
- Add the NVIDIA keys to Vercel production if you want the new fallback to work there.
- Run `npm run build` locally to confirm the build is green before you push.

---

## 2. Root cause of "AI parsing failed"

The resume builder calls two routes:

- Option A (existing resume): `POST /api/ai/parse-resume-from-url`
- Option B (upload): `POST /api/parse-resume`

Both extract text from the PDF, then call `executeAI('resumeImport', ...)` in `src/lib/ai/modelRouter.ts`.

Here is the exact failure chain.

### Cause 1 — Production env key name does not match the code (highest probability)

`modelRouter.ts` builds its Gemini key list from these names:

```
GEMINI_API_KEY_1..4, GEMINI_API_KEY, GOOGLE_API_KEY_1..5,
GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, QODEE_API_KEY, RESUME_PARSER
```

Your Vercel production snapshot (`.env.vercel`, `.env.production.vercel`) contains:

```
GOOGLE_API_KEY      -> recognised
GOOGLE_API_KEY2     -> NOT recognised  (code looked for GOOGLE_API_KEY_2 with an underscore)
QODEE_API_KEY       -> recognised
```

So in production you were running on fewer Gemini keys than you thought. One of your three valid Google keys was dead weight. If the recognised keys hit their daily free-tier quota, the whole parser dies.

### Cause 2 — The PDF path has no fallback

In `executeAI`, when a `pdfBuffer` is present the code routes **straight to Gemini** and never touches NVIDIA NIM:

```ts
if (options.pdfBuffer) {
  return await callGemini(messages, options);  // Gemini only. No fallback.
}
```

Gemini 2.5 Flash free tier has low daily limits. One `429 RESOURCE_EXHAUSTED` and the resume builder is dead for everyone, even though you have NVIDIA keys and the PDF text was already extracted and sitting right there unused.

### Cause 3 — Production has no NVIDIA keys at all

The Vercel snapshot has zero `NVIDIA_*` keys. Your local `.env` has five. So even the NVIDIA path of the router could not run in production. Everything depended on a single Gemini provider with no safety net.

### Cause 4 — Option A loaded an empty profile even when AI succeeded

`/api/ai/parse-resume-from-url` returns `{ success: true, aiData: {...} }`, but the client passed that whole object into `loadParsedData`, which reads `data.name`, `data.experience`, etc. The real data was nested under `aiData`, so the fields came back blank. Users would see "success" and an empty form. (The other route, `/api/parse-resume`, returns the flat object, so Option B worked.)

---

## 3. Fixes applied (code)

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/lib/ai/modelRouter.ts` | Added `GOOGLE_API_KEY2`, `GOOGLE_API_KEY3`, `GEMINI_API_KEY2` to the Gemini key list. De-duplicate keys so the same key is not retried twice. | Very low |
| 2 | `src/app/api/ai/parse-resume-from-url/route.ts` | Always include extracted text in the prompt. If the Gemini PDF call fails, retry once via the text-only path (NVIDIA, which itself falls back to Gemini). | Low |
| 3 | `src/app/api/parse-resume/route.ts` | Same text-only fallback as above. | Low |
| 4 | `src/components/profile/ResumeProfileBuilder.tsx` | Unwrap `resData.aiData` before loading, so Option A actually populates the profile. | Very low |
| 5 | `src/components/profile/ProfileEditor.tsx` | Repointed dead `/api/ai/parse-resume` (404) to `/api/parse-resume`. Mapped `summary` to `bio`. | Very low |
| 6 | `src/app/(app)/feed/actions.ts` | `getFollowers` and `getFollowing`: replaced per-row follow-back lookups with one batched `findMany`. | Low |
| 7 | `src/app/(app)/layout.tsx` | 7 independent queries now run in one `Promise.all` instead of sequentially. | Low |

After these changes the resume parser has three layers of safety: more Gemini keys recognised, Gemini PDF first, then a text model fallback. It will only fail if every provider is down or every key is invalid.

---

## 4. Database and performance findings

I scanned 264 source files and 338 Prisma call sites.

### Good (no action needed)

- Prisma client is a proper global singleton (`src/lib/prisma.ts`). No connection leak.
- Most queries use `select` to limit columns. Good discipline.
- I found only two true N+1 loops in the whole app (both now fixed).

### Fixed

- **N+1 in `getFollowers` / `getFollowing`** — was one `follow.findUnique` per row. A user with 500 followers triggered 500 queries. Now one batched query. ~500x fewer round-trips on those screens.
- **Sequential layout queries** — `src/app/(app)/layout.tsx` runs on every page navigation and fired 7 queries back to back. Now parallel. This shaves real latency off every single page load, which is exactly what investors feel when they click around.

### Still worth doing later (did not touch, out of "safe wins" scope)

- `feed/actions.ts` is 900+ lines and the heaviest file (39 query sites). Worth splitting and reviewing the main `getPosts` include tree for over-fetching once you have time.
- Consider adding DB indexes on the hot filter columns: `Follow.followerId`, `Follow.followingId`, `Notification.userId + read`, `ConversationParticipant.userId + hasUnread`, `ProfileView.profileId + viewedAt`. If they are not indexed, the layout counts get slow as data grows.

---

## 5. Other issues found (ranked)

| Severity | Issue | Recommendation |
|----------|-------|----------------|
| High | **Local repo file corruption / OneDrive sync.** The project lives inside a OneDrive folder. During this session the Linux build sandbox kept reading stale and truncated copies of source files (files cut off mid-line, trailing null bytes). | Move the repo out of OneDrive (e.g. `C:\dev\skilled-core`). OneDrive "files on demand" can corrupt or truncate active source files and node_modules. This is a real risk to your builds. |
| High | **Single AI provider dependency in production.** Already mitigated in code, but production env still needs the NVIDIA keys added or the fallback cannot fire on Vercel. | Add `NVIDIA_API_KEY_*` to Vercel, or accept Gemini-only and move to a paid Gemini tier. |
| Medium | **AI key quota.** Free-tier Gemini will throttle under any real demo load. A single investor demo with a few uploads can exhaust it. | Put at least one paid key behind the rotation before any live demo. |
| Medium | **Two parse routes with different response shapes** (`{aiData}` vs flat). Easy to reintroduce the empty-profile bug. | Standardise both routes on one shape. I left both working but they should be unified. |
| Low | `build` script runs `prisma db push || true` on every deploy. Fine for an MVP, dangerous later (silent schema drift). | Switch to `prisma migrate deploy` before you have real user data. |
| Low | Test files (`test-auth.js`, `test-db-conn.js`) and force-rebuild marker files sit in repo root. | Move to a `scripts/` or delete. Cosmetic, but investors do look at repos. |

---

## 6. Your action checklist

1. **Verify on Vercel (most important):** open the project env vars and confirm the Gemini/Google keys are present, valid, and not over quota. Re-test the resume builder on the live site.
2. Add the `NVIDIA_API_KEY_*` values to Vercel production so the new fallback works there too.
3. Run a local build to confirm my edits compile:
   ```
   npm run build
   ```
   (Do this on Windows directly, not through any synced/sandbox path — the sandbox view of your files was unreliable this session.)
4. Review the diff before pushing: `git diff`.
5. Strongly consider moving the repo off OneDrive.

---

## 7. MVP readiness for investors (honest take)

The product is real and broad: 35+ routes, AI interview, talent search, feed, messaging, billing. That is genuinely impressive for one person and it is your strongest pitch point. Do not undersell it.

The risk is not features, it is reliability during a demo. Three things will embarrass you in front of an investor, in order:

1. The AI parser failing on quota (now far less likely, but verify the keys).
2. A slow click-through because of sequential DB calls (the layout fix helps; index the hot columns next).
3. The OneDrive corruption causing a broken local build right before you push a "quick fix" during diligence.

Fix the three above and the MVP demos clean. Everything else in this report is polish you can do after you have term sheets, not before.
