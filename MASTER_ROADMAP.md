# SKILLED CORE - MASTER ROADMAP

This document tracks the progression of the Skilled Core platform, specifically focusing on removing mock data and implementing missing core LinkedIn features. 
**DO NOT DELETE OR MODIFY THIS LIST WITHOUT EXPLICIT INSTRUCTION.**

## 1. MOCK DATA ELIMINATION
*Verify and replace static/mock data with real database implementations.*

- [x] **Analytics Page** (`/analytics`) - *Partially Implemented (Real DB data, but hardcoded trends)*
- [ ] **Salary Insights** (`/salary`)
    - *Current*: Static mock visualizations.
    - *Goal*: Implement `Salary` model and aggregation logic based on job posts/user data.
- [ ] **Learning/Academy** (`/learning`)
    - *Current*: Static "Restricted Access" / Upsell page.
    - *Goal*: Create `Course`, `Module`, `Lesson` models and a real video player/progress tracker.
- [ ] **Company Pages** (`/company/[slug]`)
    - *Current*: Uses `MOCK_COMPANY` and `MOCK_JOBS` constants.
    - *Goal*: Fetch real `Company` data, associated `Job`s, and `Employee` lists from DB.
- [ ] **Sidebar Badges** (`Sidebar.tsx`)
    - *Current*: "Credits" badge uses comments/mock logic.
    - *Goal*: Connect to real `User.credits` field.

## 2. MISSING CORE FEATURES
*Major functional blocks required to reach feature parity with LinkedIn.*

- [ ] **Groups**
    - *Description*: Communities for professionals sharing interests/industries.
    - *Requirements*: `Group` model, membership management, group feeds, admin roles.
- [ ] **Events**
    - *Description*: Professional event discovery and RSVP.
    - *Requirements*: `Event` model, attendees, calendar integration, "Online" vs "In-person" types.
- [ ] **Newsletters / Articles**
    - *Description*: Long-form content publishing.
    - *Requirements*: Rich text editor (more advanced than posts), subscription model, notification system for new issues.
- [ ] **Services Marketplace**
    - *Description*: "Service Page" for freelancers/agencies.
    - *Requirements*: Service listings, request for quotes, ratings/reviews.

## 3. ENHANCEMENTS & REFINEMENTS
- [ ] **Advanced Search**: "Sales Navigator" style filters (Company size, revenue, strict location radius).
- [ ] **Settings & Privacy**: Detailed controls for visibility, data export, and 2FA.
- [ ] **Mobile Responsiveness**: Audit and fix complex grids on mobile (e.g., Analytics charts).
- [ ] **Accessibility (A11y)**: Ensure ARIA labels, keyboard navigation, and screen reader support compliance (WCAG 2.1).
- [ ] **Internationalization (i18n)**: Support for multiple languages and locale-based formatting.
- [ ] **Real-time Infrastructure**: Replace current polling mechanisms with WebSockets (Socket.io/Pusher) for instant chat and notifications.
- [ ] **Performance Optimization**: Implement aggressive image caching, code splitting, and reduce bundle size.
- [ ] **Testing Suite**: Establish comprehensive Unit (Jest) and End-to-End (Playwright/Cypress) testing coverage.
- [ ] **SEO Strategy**: dynamic sitemap generation, canonical tags, and Open Graph metadata for social sharing.
- [ ] **PWA Support**: Offline capabilities and "Install App" functionality for mobile users.
- [ ] **Observability & Logging**: Integrate centralized error tracking (Sentry) and performance monitoring (PostHog/LogRocket).
- [ ] **Design System (Storybook)**: Document and isolate UI components to ensure visual consistency and speed up development.
- [ ] **Security Hardening**: Implement rate limiting, strict Content Security Policy (CSP), and advanced input sanitization.
- [ ] **Content Moderation AI**: Automated text and image analysis to flag toxic content or spam.
- [ ] **GDPR/CCPA Compliance**: user-facing tools for "Download My Data" and "Right to be Forgotten".
- [ ] **CI/CD Pipelines**: Automated build, test, and deployment workflows via GitHub Actions.
- [ ] **API Documentation**: Auto-generated Swagger/OpenAPI documentation for external integrations.
