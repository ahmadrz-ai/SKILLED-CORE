# SkilledCore SAAS — Complete Codebase Report

> **Generated:** May 13, 2026 | **Total Source Files:** ~150+ | **Framework:** Next.js 16 + React 19 + TypeScript

---

## 1. Executive Summary

**SkilledCore** is a **LinkedIn-style professional networking and talent intelligence SaaS platform**. It combines:

- **ATS** (Applicant Tracking System) — job posting, applications, candidate pipeline
- **LMS** (Learning Management System) — courses & assessments (ULTRA-gated)
- **AI-Driven Skill Profiling** — AI interviews, semantic candidate search, AI assistant
- **Social Feed** — posts, polls, likes, comments, follows, connections
- **Real-time Messaging** — chat with replies, reactions, attachments
- **Monetization** — 3-tier subscription (BASIC/PRO/ULTRA) + credit system via Payoneer

The platform uses a **military/sci-fi themed UI** (e.g. "Command Center", "Ghost Protocol", "Neural Interview Simulator") with a clean SaaS aesthetic underneath.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 + custom CSS |
| **UI Components** | Radix UI (shadcn/ui pattern) — 28 components |
| **Animations** | Framer Motion |
| **Database** | PostgreSQL via Prisma ORM v5 |
| **Auth** | NextAuth v5 (beta) — Credentials + Google + GitHub |
| **AI** | Google Gemini via `@ai-sdk/google` + Vercel AI SDK |
| **File Uploads** | UploadThing |
| **Email** | Resend + React Email templates |
| **Charts** | Recharts + Chart.js |
| **Code Editor** | Monaco Editor (interview sandbox) |
| **Deployment** | Vercel |
| **Fonts** | Inter + JetBrains Mono (Google Fonts) |

### Key Dependencies
- `bcryptjs` — password hashing
- `zod` — schema validation
- `react-hook-form` — form management
- `react-dropzone` — file drag-and-drop
- `react-easy-crop` — image cropping
- `react-markdown` + `remark-gfm` — markdown rendering
- `emoji-picker-react` — emoji support in chat
- `react-confetti` — celebration animations
- `date-fns` — date formatting
- `sonner` — toast notifications
- `cmdk` — command palette
- `@dnd-kit` — drag and drop (Kanban)
- `pdf-parse` — resume PDF parsing

---

## 3. Database Schema (Prisma — 30 Models)

### Core User System
| Model | Purpose |
|---|---|
| `User` | Central user model — name, email, role (CANDIDATE/RECRUITER/ADMIN), bio, headline, skills, plan (BASIC/PRO/ULTRA), credits, ghostMode, nodeType (OPEN/BROADCAST) |
| `Account` | OAuth provider accounts (Google, GitHub) |
| `Session` | JWT sessions |
| `VerificationToken` | Email OTP tokens |

### Social & Networking
| Model | Purpose |
|---|---|
| `Post` | Feed posts — TEXT, polls, code snippets, images, tags |
| `Like` | Post likes (unique per user) |
| `Comment` | Threaded comments with parent/child |
| `CommentVote` | UP/DOWN votes on comments |
| `Poll` / `PollOption` / `PollVote` | Poll system attached to posts |
| `Follow` | One-way follow relationship |
| `Connection` | Two-way connection requests (PENDING/ACCEPTED) |
| `ProfileView` | Who viewed whose profile |

### Professional Profile
| Model | Purpose |
|---|---|
| `Experience` | Work history entries |
| `Education` | Education entries |
| `Project` | Portfolio projects |

### Jobs & Hiring
| Model | Purpose |
|---|---|
| `Company` | Companies with logo, website, description |
| `Job` | Job postings — title, location, type, salary range, skills, screening questions |
| `Application` | Job applications with status tracking (PENDING → REVIEWED → SHORTLISTED → HIRED/REJECTED), match scores |
| `SavedJob` | Bookmarked jobs |
| `JobAlert` | Saved search criteria with frequency |

### Messaging
| Model | Purpose |
|---|---|
| `Conversation` | Chat threads with themes |
| `ConversationParticipant` | Users in a conversation with unread tracking |
| `Message` | Messages with replies, reactions (JSON), attachments, forwarding, soft delete |

### Assessment & Interview
| Model | Purpose |
|---|---|
| `Assessment` | Skill assessments with categories |
| `Question` | Multiple choice questions with correct answer index |
| `UserAssessment` | User attempt results (PASSED/FAILED) |
| `Interview` | AI interview sessions — role, difficulty, score (0-100), radar data (JSON), transcript (JSON) |

### Monetization
| Model | Purpose |
|---|---|
| `Transaction` | Payment records — amount, credits, currency, provider (PAYONEER), status, plan upgrades |

### Admin & Moderation
| Model | Purpose |
|---|---|
| `Report` | User reports with category, severity, status |
| `VerificationRequest` | Identity verification documents |
| `Notification` | System notifications with actor reference |

---

## 4. Authentication System

**Provider:** NextAuth v5 (beta) with Prisma Adapter

### Login Methods
1. **Email/Password** — bcrypt hashing, case-insensitive lookup by email OR username
2. **OTP Login** — email verification code flow via VerificationToken
3. **Google OAuth** — conditional (only if credentials configured)
4. **GitHub OAuth** — conditional

### Key Features
- JWT session strategy with DB sync on every session call
- Auto-generates unique username from email on first sign-up
- Tracks `lastLogin` timestamp
- Mock login fallback in development for test accounts
- Middleware protects all routes except API/static assets

### Auth Config (`auth.config.ts`)
- Authorized callback redirects unauthenticated users to `/login`
- JWT callback stores user role in token
- Session callback syncs fresh role, name, image, username, credits from DB

---

## 5. Pages — Complete Inventory

### 5.1 Public Pages (No Auth Required)

#### Landing Page (`/`)
- Uses `LandingContent` from `landing-v2/` (clean SaaS design)
- Auto-redirects logged-in users: if profile complete → `/feed`, else → `/onboarding`
- **Components:** LandingNavbar, LandingHero, LandingFeatures, LandingHowItWorks, LandingPricing, LandingTestimonials, LandingBlog, LandingCTA, LandingFooter
- Previous dark design (`landing-v1-dark/`) hibernated with restoration instructions

#### Login (`/login`)
- `LoginPageContent` component — email/password + OTP flow + social login buttons

#### Register (`/register`)
- `RegisterPageContent` component — full registration with role selection

#### Forgot Password (`/forgot-password`) & Reset Password (`/reset-password`)

#### Legal Pages (`/legal/*`)
- Cookie Policy, Copyright Policy, Data Deletion, Privacy Policy, Professional Community Policies, Security, User Agreement
- Shared `LegalSidebar` + `LegalPagePlaceholder` components

#### About (`/about`), Help (`/help`), Terms (`/terms`), Accessibility (`/accessibility`)

---

### 5.2 Authenticated App Pages (`/(app)/*`)

All wrapped in `AppLayout` which provides:
- **Sidebar** (desktop, fixed left, 64px wide) with live badge counts from DB
- **Header** (sticky top) with credits display
- **MobileNav** (bottom bar for mobile)

#### Feed (`/feed`)
- **The main home page** after login
- Server-side fetches: user data, posts with author info, follows, connections, latest jobs, promoted users, trending topics, user stats
- **Components:** `FeedClient`, `StartPostWidget`, `PostCard` (25KB — full post rendering with likes, comments, polls, code snippets), `CommentSection`, `CreationStation`, `ProfileSideWidget`, `TrendingWidget`, `RecommendationsWidget`, `RecommendedJobsWidget`, `PromotedWidget`, `InstagramPoll`, `ReportPostModal`
- **Server Actions (29KB):** create/delete posts, like/unlike, comment CRUD, follow/unfollow, poll voting, connection management

#### Network (`/network`)
- Connection management — pending requests, accepted connections, people suggestions
- **Server Actions (12KB):** accept/reject connections, send requests, search users

#### Jobs (`/jobs`)
- Job listing with filters (type, location, experience, salary range)
- `JobFilters` sidebar + `JobList` grid + `JobListSkeleton` loading state
- Suspense boundary for async data fetching

#### Job Detail (`/jobs/[id]`)
- Individual job page with apply flow

#### Create Job (`/jobs/create`)
- Job posting form (recruiter-only, 44KB page)

#### Messages (`/messages`)
- Full-featured chat system (30KB page)
- **Server Actions (12KB):** conversations CRUD, send messages, mark read
- **Components:** `InvitationCard` (golden chance interview cards with CSS animations)

#### Profile (`/profile/[username]`)
- `ProfileClient` (55KB — the largest component) — full LinkedIn-style profile
- Sections: avatar/banner, headline, bio, skills, experience, education, projects, custom links
- **Components:** `ProfileEditor`, `ProfileEditModals` (43KB — modals for editing every section), `IconPicker`, `FollowListDialog`

#### Profile Edit (`/profile/edit`)

#### Analytics (`/analytics`)
- Real-time telemetry dashboard with Recharts
- Area charts (engagement pulse), Pie charts (viewer demographics), live signal feed
- Fetches real data via `getAnalytics()` server action

#### Search (`/search`)
- Global search across users/jobs/posts
- `SearchClient` with debounced queries
- Server actions for search

#### Find Talent / Hire (`/hire`)
- **AI-powered candidate search** with semantic matching
- Filter sidebar (tech stack, location, experience)
- Candidate cards with hover overlays (View Profile, Message, Invite)
- `SendInvitationModal` — sends golden chance interview invitations via messaging

#### Hire Dashboard (`/hire/dashboard`)
- Recruiter analytics dashboard

#### Hire Jobs (`/hire/jobs`)
- Recruiter's job management

#### Assessments (`/assessments`)
- Skill assessment listing with `AssessmentList` component
- Individual assessment pages (`/assessments/[id]`)

#### Settings (`/settings`)
- 3 tabs: Account Access, Privacy & Visibility, Alert Preferences
- **Account:** email display, password change (UI), 2FA toggle (disabled)
- **Privacy:** Ghost Protocol (hide from search), Network Architecture (OPEN vs BROADCAST node), Data Export (JSON download)
- **Notifications:** Security alerts toggle, Marketing emails toggle
- **Danger Zone:** Account deletion with "type DELETE" confirmation

#### Billing (`/billing`)
- 3 pricing tiers: SCOUT (Free), COMMANDER ($49/mo), ENTERPRISE (Custom)
- Usage bars (job bounties, InMail, talent search views)
- Transaction ledger with invoice history
- Monthly/Yearly toggle
- **Note:** Currently uses mock data for invoices

#### Credits (`/credits`)
- 3-tier plan display: BASIC (Free/10 credits), PRO ($5/50 credits), ULTRA ($10/100 credits)
- Current balance display, plan upgrade via `PaymentModal`
- Quick top-up option (5 credits for $1)

#### Salary (`/salary`)
- **ULTRA-only** — shows "Restricted Access" for non-ULTRA users
- Mock salary dashboard: Frontend ($145K), Backend ($162K), AI/ML ($210K)
- Placeholder chart area

#### Learning (`/learning`)
- **ULTRA-only** — gated access page
- Mock course cards: "Advanced Technical Screening", "Negotiation Tactics", "AI-Driven Sourcing Mastery"

#### Notifications (`/notifications`)
- `NotificationsClient` — real-time notification feed

#### Applications (`/applications`)
- Application tracking for candidates (14KB page)

#### Company (`/company/[slug]`)
- Company profile pages (currently uses mock data per roadmap)

#### Feedback (`/feedback`)
- User feedback form (12KB page)

#### Support (`/support`)
- Help center / support page (14KB page)

#### Project (`/project/[projectId]`)
- Individual project detail pages

---

### 5.3 Interview System (`/interview`)

A standalone **AI-powered mock interview simulator**:
- **ConfigurationModal** — set role, difficulty, persona, resume context
- **ChatInterface** (21KB) — real-time AI conversation with Google Gemini
- **LiveAnalysisPanel** — confidence meter, topic tracking, live feedback
- **CodeEditorPanel** — Monaco editor sandbox for coding questions
- **Scorecard** (10KB) — post-interview performance report with radar chart
- Voice mode toggle (UI only)
- Requires authentication, redirects to register if not logged in

---

### 5.4 Admin Panel (`/admin`)

Protected admin-only section with dedicated layout:

#### Admin Dashboard (`/admin`)
- System stats (users, jobs, applications, posts)
- `StorageBrowser` — file management with image lightbox
- **Verification Queue** — approve/reject identity verification requests
- **Moderation Stream** — handle user reports (resolve/dismiss) with severity badges

#### Admin Sub-pages
- `/admin/billing` — billing management
- `/admin/health` — system health monitoring
- `/admin/reports` — detailed report management
- `/admin/users` — user management
- `/admin/verifications` — verification queue

#### Admin Actions (8.5KB)
- `getDashboardData`, `updateVerificationStatus`, `updateReportStatus`

---

## 6. API Routes

| Route | Purpose |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/ai/*` | AI-related endpoints |
| `/api/chat/*` | Chat/messaging API |
| `/api/cron/*` | Scheduled tasks |
| `/api/parse-resume/*` | PDF resume parsing |
| `/api/qodee-chat/*` | Global AI assistant (Qodee) streaming endpoint |
| `/api/test-gemini/*` | Gemini AI testing |
| `/api/uploadthing/*` | File upload handler |
| `/api/user/*` | User data endpoints |

---

## 7. Server Actions — Complete List

| File | Key Functions |
|---|---|
| `actions/analytics.ts` | `getAnalytics()` — profile views, demographics, trends |
| `actions/assessments.ts` | Assessment CRUD, attempt submission |
| `actions/ats.ts` | Application tracking system helpers |
| `actions/auth.ts` | Registration, OTP sending/verification |
| `actions/authActions.ts` | `logout()` |
| `actions/billing.ts` | Billing management, transaction creation |
| `actions/credits.ts` | `getCredits()`, `getPlan()`, credit deduction |
| `actions/hire.ts` | Recruiter hiring actions |
| `actions/interview.ts` | AI interview session management |
| `actions/jobs.ts` | Job CRUD, search, save/unsave, alerts |
| `actions/notifications.ts` | Notification management |
| `actions/reset-password.ts` | Password reset flow |
| `actions/search.ts` | Global search |
| `actions/sendEmail.ts` | Email sending via Resend |
| `actions/testimonials.ts` | Testimonial data |
| `src/actions/feedback.ts` | Feedback submission |
| `feed/actions.ts` (29KB) | Post CRUD, likes, comments, polls, follows, connections |
| `network/actions.ts` (12KB) | Connection management |
| `messages/actions.ts` (12KB) | Messaging system |
| `settings/actions.ts` | Ghost mode, node type, notifications, data export, account deletion |
| `hire/actions.ts` | `getAllCandidates()`, `searchCandidates()` (AI semantic search) |
| `profile/actions.ts` | Profile CRUD operations |
| `search/actions.ts` | Search queries |

---

## 8. Component Library — Complete Inventory

### 8.1 UI Primitives (28 components in `components/ui/`)

`accordion`, `avatar`, `badge`, `button`, `card`, `checkbox`, `context-menu`, `dialog`, `dropdown-menu`, `floating-input`, `glass-card`, `holo-panel`, `image-cropper`, `input`, `label`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `slider`, `switch`, `table`, `textarea`, `tooltip`, `Button3D`, `CoreLoader`

### 8.2 Layout Components (3)
- **`Header`** (9KB) — top navigation bar with search, notifications bell, credits display
- **`Sidebar`** (10KB) — left navigation with live badge counts, role-gated items, plan badge
- **`MobileNav`** (3.6KB) — bottom tab bar for mobile

### 8.3 Global Components (7)
- **`CommandPalette`** (6.5KB) — Cmd+K command palette using `cmdk`
- **`GlobalAiAssistant`** (16.6KB) — "Qodee" AI chatbot FAB with streaming responses
- **`NotificationBell`** (7.5KB) — notification dropdown
- **`FilterDeck`** (28KB) — advanced filter system
- **`JobCard`** (5.4KB) — job listing card
- **`TalentCard`** (5.5KB) — candidate card
- **`QodeeLogo`** — SVG logo component

### 8.4 Feed Components (11)
`StartPostWidget`, `PostCard` (25KB), `CommentSection` (12.7KB), `CreationStation` (14.9KB), `InstagramPoll`, `ProfileSideWidget`, `TrendingWidget`, `RecommendationsWidget`, `RecommendedJobsWidget`, `PromotedWidget`, `ReportPostModal`

### 8.5 Profile Components (4)
`ProfileEditor` (19.5KB), `ProfileEditModals` (44KB), `IconPicker` (19.5KB), `FollowListDialog` (9.3KB)

### 8.6 Interview Components (5)
`ChatInterface` (21KB), `ConfigurationModal` (11KB), `LiveAnalysisPanel` (4.5KB), `Scorecard` (10.5KB), `CodeEditorPanel` (5KB)

### 8.7 Hire/Recruiter Components (5)
`CandidateCard` (7.5KB), `FilterSidebar` (5.9KB), `SmartSearchBar` (4.2KB), `BulkActionBar` (2.3KB), `ScheduleInterviewDialog` (9.4KB)

### 8.8 Auth Components (4)
`LoginPageContent` (14KB), `RegisterPageContent` (21.7KB), `RoleGate` (1KB), `SessionWrapper`

### 8.9 Credits/Payment Components (3)
`PaymentModal` (17.7KB), `PlanBadge` (1.3KB), `PurchaseCreditsModal` (3.1KB)

### 8.10 Onboarding Components (2)
`ResumeUploader` (10.4KB), `ResumeUploadZone` (3.7KB)

### 8.11 Landing Page Components
**V2 (Active — 10 files):** LandingNavbar, LandingHero (12KB), LandingFeatures, LandingHowItWorks, LandingPricing, LandingTestimonials, LandingBlog, LandingCTA, LandingContent, LandingFooter

**V1 Dark (Hibernated — 8 files):** BentoGrid, HowItWorks, LandingContent, MetricMarquee, ParticleBackground, PremiumFooter, PricingSection, Testimonials

### 8.12 Email Templates (3)
`OtpEmail`, `MessageNotification`, `RetentionEmail`

### 8.13 Admin Components (2)
`StorageBrowser` (13.5KB), `ImageLightbox` (3.1KB)

### 8.14 Other Components (2)
`LegalPagePlaceholder`, `LegalSidebar`

---

## 9. Custom Hooks (4)

| Hook | Purpose |
|---|---|
| `use-debounce` | Debounced value for search inputs |
| `useResumeParser` | Client-side resume parsing logic |
| `useRoleGuard` | Role-based access control with denial trigger |
| `useRoleMock` | Development mock roles |

---

## 10. Utility Libraries (6 files in `lib/`)

| File | Purpose |
|---|---|
| `prisma.ts` | Singleton Prisma client |
| `utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `uploadthing.ts` | UploadThing configuration |
| `userContext.ts` | User context utilities |
| `canvasUtils.ts` | Image crop/canvas helpers |
| `content-safety.ts` | Content moderation/safety checks |

---

## 11. Security & Infrastructure

### Security Headers (next.config.ts)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Content-Security-Policy with whitelisted domains
- Permissions-Policy (camera/microphone/geolocation)

### Image Optimization
- WebP + AVIF formats
- Whitelisted remote domains: uploadthing, Google, GitHub
- 1-week cache TTL

### Bundle Optimization
- `optimizePackageImports` for lucide-react, radix-ui, framer-motion

---

## 12. Monetization Model

### 3-Tier Subscription
| Plan | Price | Credits | Key Perks |
|---|---|---|---|
| **BASIC** | Free | 10/month | Basic job search, standard applications |
| **PRO** | $5/month | 50/month | Verified badge, promoted feed, InMail, profile analytics |
| **ULTRA** | $10/month | 100/month | Everything in PRO + Salary Insights + Learning Academy + Unlimited Search |

### Credit System
- Credits used for premium actions
- Quick top-up: 5 credits for $1
- Payment via Payoneer (manual transaction + admin approval)

### Gated Features
- `/salary` — ULTRA only
- `/learning` — ULTRA only
- `/jobs/create` — RECRUITER role only
- `/hire/search` — RECRUITER role only
- `/admin` — ADMIN role only

---

## 13. Scripts & Tooling (24 scripts)

Development/testing scripts including:
- `seed-assessments.ts` — seed assessment data
- `simulate-application.ts`, `simulate-feed.ts`, `simulate-job-post.ts`, `simulate-messaging.ts`, `simulate-payment.ts` — simulation scripts
- `purge-test-accounts.ts` — cleanup
- `verify-ai-real.ts`, `verify-billing.ts`, `verify-interview-analysis.ts` — verification
- `give-credits.js`, `update-credits.ts` — credit management
- Various debug and test scripts

---

## 14. Current State & Roadmap

### Completed ✅
- Full authentication system (credentials + OAuth + OTP)
- Social feed with posts, polls, likes, comments
- Connection/follow networking
- Real-time messaging with reactions and replies
- Job posting and application system
- AI interview simulator with Gemini
- Global AI assistant (Qodee)
- Analytics dashboard (partially real data)
- Admin panel with moderation
- Credit/subscription system
- Profile system with full editing
- Onboarding flow with resume parsing
- Command palette
- Security headers and CSP
- Email notifications (OTP, messages, retention)

### Pending (from MASTER_ROADMAP.md)
- **Mock Data Elimination:** Salary insights, Learning/Academy, Company pages, Sidebar credit badges
- **Missing Features:** Groups, Events, Newsletters/Articles, Services Marketplace
- **Enhancements:** Advanced search, mobile responsiveness audit, accessibility (WCAG 2.1), i18n, WebSockets for real-time, performance optimization, testing suite, SEO strategy, PWA, observability (Sentry), design system (Storybook), security hardening, content moderation AI, GDPR/CCPA compliance, CI/CD, API documentation
