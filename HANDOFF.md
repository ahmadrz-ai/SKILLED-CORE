# SkilledCore — Engineering Handoff (state @ commit `eb4bdb8`)

Condensed technical snapshot for the next session. Repo: `ahmadrz-ai/SKILLED-CORE`, branch `main` (auto-deploys to Vercel → skilledcore.com).

---

## 1. Architecture state

- **Stack:** Next.js 16 (App Router, `--webpack`), React 19, Tailwind **v4** (`@theme` tokens + `:root` vars in `src/app/globals.css`), Prisma 5.22 + Neon Postgres, NextAuth v5.
- **Theme system (critical gotcha):** Tailwind v4 only generates a color utility (`bg-X`/`text-X`/`border-X`) if `--color-X` exists in the `@theme` block. Many `:root` tokens (`--text-error`, `--text-sidebar-*`, `--bg-dropdown`, `--btn-primary-*`, `--icon-default`) are **NOT** mapped → those utilities silently render nothing (text falls back to inherited color; backgrounds go transparent). Status ramps (`sc-red/green/amber`) + status semantics are now mapped (commit `b90b0b5`). **Still unmapped (latent):** `text-sidebar-*`, `bg-dropdown`, `bg-tooltip`, `btn-primary-*`, `icon-default`, `sc-blue` (sc-blue intentionally — Branding deprecates blue).
- **Global light-shim** (`globals.css` ~L418-549, `html:not(.admin-dark)`): force-converts dark Tailwind classes (`bg-zinc-9*`, `bg-black`, `text-white`, faint `text-zinc-*`) to light. This is why dark-coded admin components still render readable. **Trap:** any `button` with both a `bg-*` and a `text-white` substring (incl. `hover:text-white`) is forced `color:#fff !important` → white-on-white icons. Fixed in composer/admin; watch for it.
- **Branding:** `/Branding.md` is source of truth. Primary purple `#5B35D5` (`sc-purple-*`). Danger badge `#E5484D` (`--badge-danger` → `bg-badge-danger`). Plan label mapping: stored legacy `ULTRA`→display "Elite", `PRO`→"Pro", `BASIC`→"Free" (compat layer in `src/lib/plans.ts`; gating still checks `=== 'ULTRA'`).
- **Realtime (Ably):** server key `ABLY_API_KEY` (Vercel Prod+Preview + local; auth verified). Client uses **token auth** via `GET /api/ably/token` (subscribe-only, channel `user:{id}`). `src/lib/ably.ts → notifyUser(userId)` is fire-and-forget; publishes a `"badge"` signal. Client refetches `getBadgeCounts()` (debounced) + focus + 45s fallback.
- **Support/Reports pipeline:** built on the live `Report` model (+ `ReportMessage` thread, `aiSummary`/`fixPrompt`/`threadStatus` columns). Canonical status = `src/lib/reportStatus.ts` (Pending/Resolving/Completed/Junk; normalizes legacy PENDING/UNDER_REVIEW/RESOLVED/DISMISSED).
- **Known deferred:** `middleware.ts → proxy.ts` Next 16 rename (build warning, non-fatal). `SystemReport` model is legacy/duplicate of `Report` (flagged, not removed). Build runs `prisma db push` (DB confirmed in sync).

---

## 2. Files modified this session (last 8 commits, `96d05df..eb4bdb8`)

**Realtime badges (CR2):**
- `src/lib/ably.ts` (NEW) — Ably REST publisher.
- `src/app/api/ably/token/route.ts` (NEW) — token-auth endpoint.
- `src/components/realtime/RealtimeBadgeProvider.tsx` (NEW) — shell store + `useBadges()` + `<NavBadge/>`.
- `src/app/actions/notifications.ts` — `getBadgeCounts()` extended (+bookings, +support).
- `src/components/layout/AppShell.tsx` — wraps shell in provider, passes `userId`; removed old poller.
- `src/components/layout/Sidebar.tsx` — consumes `useBadges()`; Interviews/Support badges; **icon-only width fix (Bug 4)**.
- `src/components/NotificationBell.tsx` — live bell count from store.
- `src/app/(app)/layout.tsx` — passes `userId` to AppShell.
- Publishers: `src/app/(app)/messages/actions.ts`, `src/app/(app)/network/actions.ts`, `src/app/(app)/feed/actions.ts`, `src/app/actions/bookings.ts`, `src/app/actions/reportPipeline.ts`.

**Theme / badges:**
- `src/app/globals.css` — `--badge-danger`, `--control-chip-*`; registered `sc-red/green/amber` ramps + `text-error/success/warning`, `border-error`. (Build break from a `*/`-in-comment fixed in `00c984e`.)

**Support 4-status workflow:**
- `src/lib/reportStatus.ts` (NEW) — canonical statuses + helpers.
- `src/app/admin/actions.ts` — `updateReportStatus` accepts 4 statuses (+legacy), notifies on terminal.
- `src/app/admin/reports/ReportsTable.tsx` — status filter chips + per-row status chip + setter `<select>`.
- `src/app/help/page.tsx` — "Active Support Uplinks" tickets now `<Link>` to thread + normalized status.
- `src/app/(app)/support/reports/MyReports.tsx`, `.../[id]/UserReportThread.tsx` — normalized status display.

**Other (CR1 / mobile, earlier in session):** `src/components/GlobalAiAssistant.tsx` (draggable orb), `src/components/feed/StartPostWidget.tsx` + `ImageEditorModal.tsx` (composer/editor mobile), `src/app/(app)/messages/page.tsx` (chat bubbles), `src/components/interview/ConfigurationModal.tsx`/`Scorecard.tsx` (markdown).

---

## 3. Fully complete & shipped

- Mobile Bugs 1–4: composer footer/image-controls/emoji, emoji Close, chat bubble vertical-text + reply avatar/align, icon-only sidebar rail.
- CR1: draggable/persistent Qodee orb (touch+mouse, viewport-clamped, edge-snap, localStorage, drag-vs-tap).
- CR2: Ably realtime badges — bell + Network/Messages/Interviews/Support (single shell store, token auth, event publishers, focus/45s fallback).
- Badge color fix + status-ramp `@theme` registration (badges now solid `#E5484D`).
- Support 4-status system (Pending/Resolving/Completed/Junk): auto-Resolving on support reply; `/help` tickets clickable → `/support/reports/[id]`; admin filter+sort+set-status.
- Earlier: onboarding 500/resume-parse hardening, 2FA OTP-authorize fix, prefetch/poll/session perf, geo-fetch guard, blank-page guards, Elite/Ultra labels, admin rebrand + lazy storage, storage orphan scanner + `ufs.sh` delete fix, reports AI-triage pipeline + threads.

---

## 4. Precise next step

1. **Verify the deploy of `eb4bdb8` is green** (the prior build `b90b0b5` failed on the CSS comment; `00c984e` fixed it). Confirm badges render solid red and `/help` tickets open the thread.
2. **Existing pre-fix ticket** (`SC-526721`, status PENDING with 2 admin replies): auto-Resolving only triggers on the *next* reply — set it via the admin ReportsTable status `<select>` (or accept it normalizes on next message).
3. **Optional (offered, not done): full theme-token audit** — register the remaining unmapped semantic utilities (`text-sidebar-*`, `bg-dropdown`, `bg-tooltip`, `btn-primary-*`, `icon-default`) in `@theme` so they stop relying on inheritance. Low-risk, ~15 one-line mappings in `globals.css`.
4. **Optional:** wire realtime badges for the remaining nav tabs (Jobs/Learning/Find-Talent/Salary/Analytics/Credits) — infra proven; each needs a "new" event definition + a `notifyUser` call at its source.
