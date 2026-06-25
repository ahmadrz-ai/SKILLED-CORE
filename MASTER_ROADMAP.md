# SKILLED CORE — MASTER ROADMAP

Living tracker for platform work. **Update this file as items move between sections.**
Last updated: 2026-06-25.

---

## 🚨 0. DEPLOY ACTION ITEMS (do before/at next deploy)

- [ ] **Add `DIRECT_URL` to Vercel env** — the build's `prisma db push` FAILS without it (`P1012: Environment variable not found: DIRECT_URL`) and is silently swallowed by `|| true`, so the new Company columns never reach the DB. Copy the non-pooled Neon connection string from local `.env`, then redeploy. Until then `/company/[slug]` and recruiter onboarding throw "column does not exist".
- [x] **Set `ADMIN_EMAILS` in Vercel** — done (verify value): `ahmadrazaai801@gmail.com,ahmad@skilledcore.com,support@skilledcore.com`. If unset, no email auto-elevates to ADMIN.
- [ ] **(Optional) Remove `|| true` from the build's `prisma db push`** — so schema-sync failures fail the build loudly instead of shipping a broken DB.
- [ ] **Company migration file** — `prisma/migrations/20260624120000_company_profile_fields/migration.sql` exists as a record; not required since the pipeline uses `db push` (syncs straight from schema once `DIRECT_URL` is set).

---

## ✅ 1. DONE (2026-06-25)

- [x] **Recruiter payment soft-wall** — `/hire` + interview-booking creation gated on an active recruiter plan (`lib/recruiterAccess.ts`, `RecruiterPlanWall`). Feed/profile/messaging stay open. Activation via existing PENDING-transaction → admin-approval flow.
- [x] **Company Profiles (real data)** — DB-backed `/company/[slug]` with real jobs + team, unique slugs from onboarding, owner-only edit modal (`updateCompanyProfile`). Replaced the old all-mock page.
- [x] **Security: admin emails → env** — removed hardcoded admin emails from source (`auth.config.ts` → `ADMIN_EMAILS`).
- [x] **Security: `AUTH_SECRET` hard-fail in production** — app refuses to boot in prod without it (was a silent `console.error`).
- [x] **Security: PII/debug log cleanup** — removed logs leaking emails / message content / post objects (auth, qodee-chat, feed, profile, PostCard, SinglePostClient).
- [x] **Perf: bounded the feed query** — `/feed` used to fetch EVERY post in the DB (+ every like row) unbounded; now `take: 50`.
- [x] **(Verified already in code)** resume-export auth, qodee-chat auth+rate-limit, verified-skill badges on profile (I3), interview auto-react / no-stall (I5).

---

## 🔄 2. IN PROGRESS

- [x] **Migrate raw `<img>` → `next/image`** — done on `staging` (36 converted, ~17 left raw with reasons).
- [x] **Made recruiter onboarding real (no more demo theater)** — DROPPED the fake "Bidirectional ATS Sync" step and the fake "Ontology compile" animation. Recruiter onboarding is now 2 real steps: Company HQ → Hiring Calibration → Launch. The 3 calibration cohorts (hero/missed/mismatched) are persisted to `Company.calibration` and injected into the talent-search `parse-query` LLM prompt, so they genuinely shape each search. Copy de-jargoned (no "trains your model" overclaim).
- [ ] **Real ATS integration (Greenhouse/Lever/Ashby)** — deferred until a paying recruiter actually needs it. Requires the recruiter's own API key/OAuth + per-vendor connectors + webhook endpoints. Not worth building pre-traction.

### Company Profiles — make discoverable + editable
- [x] Added a **"My Company"** link for recruiters/admins in the profile dropdown → their `/company/<slug>` (where the owner Edit modal lives). Slug threaded layout → AppShell → Sidebar.
- [x] **Fixed** `jobs/[id]` SEO `sameAs` link to use `company.slug` (was `company.id`).
- [ ] Make **company names clickable** on job cards / candidate profiles → company page (needs `companySlug` threaded into `JobProps` across the app — bigger surface area).

---

## ⏭️ 3. NEXT UP

- [ ] **CI/CD pipeline** — GitHub Actions on every PR: `tsc --noEmit`, lint, tests, `npm audit`. Vercel: `staging` → preview URL, `main` → production. Gate merges on green CI.
- [ ] **Live payment gateway (Pakistan)** — integrate **Safepay** (subscriptions + Visa/MC/AMEX, developer-friendly) to replace the manual admin-approval flow; or register a US/Delaware entity for Stripe. Wire webhooks → auto-grant plan/credits.
- [ ] **Feed infinite-scroll pagination** — complete the feed fix: cursor-based paging beyond the 50-post cap (+ optional DOM virtualization).
- [ ] **Automated tests for critical flows** — credits engine, badge issuance (`finalizeInterview`), booking flow, recruiter gate.
- [ ] **Tech debt (from build warnings):** rename `src/middleware.ts` → `src/proxy.ts` (Next 16 deprecation); plan Prisma 5.22 → 7.x major upgrade; refresh `baseline-browser-mapping`.

---

## 🧩 4. FEATURE BACKLOG (accepted)

> Salary Insights & Learning Academy intentionally deferred (do later, not now).

- [ ] **Groups / Communities** — skill-based communities, group feeds, recruiter job posts inside groups (needs `Group` model).
- [ ] **Resume Score / ATS Audit tool** — free "will your resume survive ATS keyword filters" hook (viral acquisition, uses existing NVIDIA NIM).
- [ ] **Recruiter dashboard analytics** — pipeline metrics, candidates viewed, time-to-hire, saved-search performance (justifies $79–$199 plans).
- [ ] **Open-to-Work signal** — recruiter-visible availability toggle on profiles.
- [ ] **Job alerts for candidates** — notify on matching new jobs / saved searches.
- [ ] **Events** — virtual meetups / hackathons / prep sessions, registration + attendance.
- [ ] **Projects portfolio** — GitHub/Cloudinary-hosted project showcases with AI capability summary.
- [ ] **Referral system** — candidate & recruiter referral credits/discounts.
- [ ] **Interview replay** — replay AI interview with per-answer scoring (ELITE upsell).

---

## 🎨 5. UI/UX IMPROVEMENTS

- [ ] Landing: make the candidate/recruiter audience toggle the dominant first interaction.
- [ ] Onboarding progress bar polish + completion nudges.
- [ ] Profile completeness ("Profile Strength") meter.
- [ ] Better empty states (first-login feed, recruiter `/hire` with no searches).
- [ ] Make the gold Verified Skill Badge unmissable in search results (size + hover tooltip with score).
- [ ] Booking accept screen: show credit cost + balance inline before tapping.
- [ ] System-wide dark mode (interview is already dark).
- [ ] `/notifications` page filter tabs + mark-all-read.
- [ ] Qodee orb: snap-to-corner so it never covers CTAs.

---

## 🔐 6. SECURITY UPGRADES

- [ ] Nonce-based CSP so `unsafe-inline` no longer applies to scripts.
- [ ] DB-backed admin permissions table + audit log (replace env allowlist long-term).
- [ ] Rate-limit `/api/ably/token`.
- [ ] Surface login audit trail (IP/device/country/2FA) in Settings → "Recent activity".
- [ ] Monthly API key rotation reminder (Gemini / NVIDIA NIM).
- [ ] GDPR basics: privacy policy, cookie consent, "Delete my account" flow that wipes PII.
- [ ] Regular `npm audit` (fold into CI).

---

## 🛠️ 7. ADMIN FEATURES

- [ ] "Login as user" impersonation (audited, auto-expiring) for support.
- [ ] Feature-flag panel (toggle features without a deploy).
- [ ] Bulk user actions (plan/credits/email/deactivate).
- [ ] Interview quality monitoring / review queue (auto-flag suspicious sessions).
- [ ] Revenue dashboard (MRR/ARR, churn, plan distribution, pending count).
- [ ] Scheduled system announcements (`publishAt`).
- [ ] Abuse / spam detection dashboard.
