# UIDESIGN.md — SkilledCore Global Design System
> **Version:** 2.0 | **Theme:** Professional Light | **June 2026**
> **Framework:** Next.js + React + Tailwind CSS v4
> **Companion file:** UICOLORS.md v2.0 (colors only — this file handles everything else)
>
> **Rule:** This file is the single source of truth for layout, spacing,
> typography, sidebar behavior, component structure, and design patterns
> across every page of SkilledCore. No page may deviate from these
> patterns without explicit justification documented here.

---

## 0. Design Philosophy

SkilledCore is a professional enterprise talent intelligence platform.
The design language must be structured, dense, and confident.
Not playful. Not minimal to the point of emptiness. Not overdesigned.

**Reference products for visual language:**
- Linear — structure, sidebar density, information hierarchy
- Notion — content hierarchy, card patterns, clean panels
- LinkedIn — three-column layout, feed patterns, profile structure
- Stripe Dashboard — table design, data density, action patterns

**Core principles:**
1. Every authenticated page has the same shell: sidebar + topbar. No exceptions
   except full-screen modes (interview session, auth pages, onboarding wizard).
2. Content breathes but is never empty. Whitespace is intentional, not accidental.
3. The sidebar is always present on authenticated pages. On content-heavy pages
   it folds to a 64px icon rail — it never fully disappears.
4. Components are consistent. A card on the feed looks like a card on the profile.
5. Typography creates hierarchy. Size and weight do the work — not color alone.
6. Borders and shadows define structure — not background color differences alone.
7. The Ctrl+K global search is always accessible from the topbar on every
   authenticated page without exception.

---

## 1. The Application Shell (Universal Authenticated Layout)

Every authenticated page in SkilledCore uses the same shell structure.
This is non-negotiable.

### 1.1 Shell Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR (full width, fixed top, height: 56px / h-14)        │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│   SIDEBAR       │        MAIN CONTENT AREA                  │
│                 │                                           │
│  Expanded:      │   Width = 100vw − sidebar width           │
│  w-60 (240px)   │   Padding top: 56px (below fixed topbar)  │
│                 │                                           │
│  Collapsed:     │   Width = 100vw − 64px                    │
│  w-16 (64px)    │                                           │
│  icon-only rail │                                           │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### 1.2 Topbar Specifications

```
Position:          fixed top-0 left-0 right-0 z-50
Height:            h-14 (56px) — exactly this, never taller, never shorter
Background:        var(--bg-topbar) = #FFFFFF
Border bottom:     1px solid var(--border-topbar) = #E8E8ED
Shadow:            var(--shadow-xs)
Horizontal padding: px-4

Left section:
  - SkilledCore logo mark + wordmark
  - Always visible even when sidebar is collapsed
  - Clicking logo navigates to /feed

Center section:
  - Global search bar — ALWAYS VISIBLE on every authenticated page
  - Width: max-w-md (448px), centered in topbar
  - Placeholder: "Search candidates, jobs, skills..." + Ctrl+K badge
  - Clicking anywhere on the bar or pressing Ctrl+K opens command palette overlay
  - Background: var(--sc-gray-100)
  - Border: 1px solid var(--border-input)
  - Border-radius: rounded-lg
  - Search icon: left side (pl-9)
  - Ctrl+K badge: right side (pr-3), text-xs, bg-sc-gray-200, rounded

Right section (left to right):
  - Credits counter — icon + number, links to /credits
  - Notifications bell — icon + unread dot badge
  - Add Credits button — secondary/ghost style
  - User avatar — 32px circle, opens dropdown on click
    Dropdown items: View Profile | Settings | Sign Out
```

### 1.3 Sidebar Specifications

**The sidebar has exactly two states: EXPANDED and COLLAPSED.**
**It never fully disappears on any authenticated app page.**
**The only exception is /interview/[id] which is full-screen dark mode.**

```
EXPANDED STATE:
  Width:             w-60 (240px)
  Position:          fixed left-0 top-14 bottom-0 z-40
  Background:        var(--bg-sidebar) = #F8F8FA
  Right border:      1px solid var(--border-sidebar) = #E8E8ED
  Overflow:          overflow-y-auto, scrollbar hidden
  Padding:           px-3 py-4

COLLAPSED STATE (icon rail):
  Width:             w-16 (64px)
  Position:          same as expanded
  Background:        same as expanded
  Right border:      same as expanded
  Content:           Icons only — no text labels
  Tooltip:           Show nav item label on icon hover (tooltip right side)

TOGGLE MECHANISM:
  Button:            Small chevron button at bottom of sidebar
  Chevron direction: → when expanded (click to collapse)
                     ← when collapsed (click to expand)
  State persistence: localStorage key 'sc-sidebar-collapsed' (boolean)
  Transition:        transition-all duration-200 ease-in-out on width
  Main content area: Also transitions its left margin/padding to match

AUTO-COLLAPSE LOGIC:
  Certain pages auto-collapse the sidebar on first load.
  The user can still expand it manually at any time.
  See Section 1.5 for the complete per-page auto-collapse table.
```

### 1.4 Sidebar Navigation Structure

```
─────────────────────────────────────────
TOP SECTION — Primary Navigation
─────────────────────────────────────────
  Home (Feed)        →  /feed
  Network            →  /network
  Find Talent        →  /hire
  Jobs               →  /jobs
  AI Interview       →  /interview
  Salary Insights    →  /salary      [ULTRA badge if locked]
  Learning           →  /learning    [ULTRA badge if locked]
  Messages           →  /messages    [unread count badge if any]

─────────────────────────────────────────
BOTTOM SECTION — Secondary Navigation
─────────────────────────────────────────
  Analytics          →  /analytics
  Credits            →  /credits
  Admin Console      →  /admin       [visible only to ADMIN role]

─────────────────────────────────────────
FOOTER — User identity area
─────────────────────────────────────────
  [Avatar 32px]  Full Name
                 @handle · [ULTRA/PRO/BASIC badge]
                 [Settings icon → /settings]
─────────────────────────────────────────

NAV ITEM ANATOMY — Expanded state:
  Height:          h-10 (40px)
  Padding:         px-3
  Border-radius:   rounded-lg
  Icon + label gap: gap-3
  Icon size:       w-5 h-5 (20px)
  Label font:      text-sm font-medium

  ACTIVE state:
    Background:    var(--bg-sidebar-active) = #EAE6FD
    Text:          var(--text-sidebar-active) = #4A28C9
    Left accent:   border-left: 3px solid var(--sc-purple-600)
    Icon:          var(--icon-sidebar-active) = #5B35D5

  INACTIVE state:
    Text:          var(--text-sidebar-inactive) = #4B4B57
    Icon:          var(--icon-sidebar-inactive) = #6B6B78

  HOVER state:
    Background:    var(--bg-sidebar-hover) = #F0EEF9
    Text:          var(--text-sidebar-hover) = #1F1F24

NAV ITEM ANATOMY — Collapsed state (icon only):
  Width:           w-16 (64px), icon centered
  Icon size:       w-5 h-5 (20px)
  Active:          icon in var(--icon-sidebar-active) + bg-sidebar-active
  No text visible in collapsed state
```

### 1.5 Sidebar Collapse Rules Per Page

```
AUTO-COLLAPSED ON LOAD (starts as 64px icon rail):
  /messages           Chat needs maximum horizontal width for two panels
  /analytics          Wide data tables and chart grids
  /admin/*            Admin tables need full width
  /hire/search        Candidate grid needs horizontal room
  /jobs/create        Rich form editor and preview need width
  /search             Wide search result grids
  /interview/[id]     Full-screen dark session — sidebar HIDDEN ENTIRELY

EXPANDED ON LOAD (starts at 240px):
  /feed               Three-column layout — sidebar is part of the design
  /network            Standard content width, sidebar provides context
  /jobs               Standard listing page
  /jobs/[id]          Single job detail
  /profile/[username] Profile page
  /settings           Settings panels need consistent navigation visible
  /credits            Billing page
  /salary             Salary insights
  /learning           Course listings
  /hire               Recruiter dashboard
  /interview          Interview lobby (not the session itself)
  /analytics          (see above: auto-collapsed)

SIDEBAR HIDDEN ENTIRELY — No sidebar, no icon rail:
  /login              Full-center auth layout
  /register           Full-center auth layout
  /forgot-password    Full-center auth layout
  /reset-password     Full-center auth layout
  /onboarding         Wizard, distraction-free flow
  /interview/[id]     Full-screen dark assessment environment
  / (landing page)    Marketing page — has its own navigation
  /about              Dead page — simple nav header only
  /help               Dead page — simple nav header only
  /terms              Dead page — simple nav header only
  /accessibility      Dead page — simple nav header only
  /legal/*            Dead pages — simple nav header only
```

---

## 2. Layout Grid System

### 2.1 The Four Layout Patterns

Every page in SkilledCore maps to exactly one layout pattern.

```
───────────────────────────────────────────────────────────────
PATTERN A — Three Column (Feed layout)
Used on: /feed
───────────────────────────────────────────────────────────────
┌──────────────┬──────────────────────────┬──────────────────┐
│  Left panel  │     Center feed          │  Right panel     │
│  w-64 fixed  │     flex-1               │  w-80 fixed      │
│  256px       │     auto width           │  320px           │
└──────────────┴──────────────────────────┴──────────────────┘
Max content width: 1200px centered
Column gap:        gap-6 (24px)
Outer padding:     px-6 py-6

───────────────────────────────────────────────────────────────
PATTERN B — Two Column (Dashboard / Filter layout)
Used on: /jobs, /hire, /network, /salary, /learning, /settings
───────────────────────────────────────────────────────────────
┌──────────────────┬──────────────────────────────────────────┐
│  Filter / Nav    │     Main content                         │
│  w-72 (288px)    │     flex-1                               │
└──────────────────┴──────────────────────────────────────────┘
Max content width: 1200px centered
Column gap:        gap-6 (24px)
Outer padding:     px-6 py-6

───────────────────────────────────────────────────────────────
PATTERN C — Single Column Centered (Profile / Form layout)
Used on: /profile, /credits, /jobs/[id], /jobs/create,
         /interview (lobby), auth pages
───────────────────────────────────────────────────────────────
┌───────────────────────────────────────────────────────────┐
│                  Main content                             │
│                  max-w-3xl (768px) or max-w-2xl (672px)   │
│                  mx-auto                                  │
└───────────────────────────────────────────────────────────┘
Outer padding: px-6 py-6

───────────────────────────────────────────────────────────────
PATTERN D — Full Width (Admin / Data / Chat layout)
Used on: /admin/*, /messages, /hire/search, /analytics, /search
───────────────────────────────────────────────────────────────
┌───────────────────────────────────────────────────────────┐
│              Full width content                           │
│              w-full — no max-width cap                    │
└───────────────────────────────────────────────────────────┘
Internal padding: px-6 py-6
```

### 2.2 Spacing Scale — Use Only These Values

```
4px   → p-1   Tight internal (badge padding, icon gap)
8px   → p-2   Small (button padding sm, tag padding, row gap tight)
12px  → p-3   Medium-small (nav item padding, input padding, tight card)
16px  → p-4   Standard (compact card padding, list item padding)
20px  → p-5   Medium (form group spacing)
24px  → p-6   Standard column gap, card padding, section padding
32px  → p-8   Large (modal padding, form section, settings card padding)
40px  → p-10  Section separator
48px  → p-12  Page-level vertical top padding
64px  → p-16  Hero sections, large visual separators
```

### 2.3 Border Radius Scale

```
4px   → rounded-sm    Tags, small badges, code blocks
6px   → rounded-md    Buttons, inputs, compact elements
8px   → rounded-lg    Standard cards, dropdowns, tooltips, modals header
12px  → rounded-xl    Large cards, modals, panels, main containers
16px  → rounded-2xl   Feature hero cards, prominent panels
50%   → rounded-full  Avatars, notification dots, pill tags
```

---

## 3. Typography System

### 3.1 Font Stack

```css
/* Primary — all UI text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, sans-serif;

/* Monospace — code blocks, scores, technical IDs */
font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
             ui-monospace, monospace;
```

### 3.2 Complete Type Scale

```
DISPLAY (landing page heroes only):
  Size:    text-5xl / 48px
  Weight:  font-bold (700)
  Leading: leading-tight (1.1)
  Tracking: tracking-tight (-0.02em)
  Color:   var(--text-heading)

H1 — Page titles:
  Size:    text-2xl / 24px
  Weight:  font-bold (700)
  Leading: leading-snug (1.25)
  Tracking: -0.01em
  Color:   var(--text-heading) = #141417

H2 — Section headings:
  Size:    text-xl / 20px
  Weight:  font-semibold (600)
  Leading: leading-snug (1.3)
  Tracking: -0.01em
  Color:   var(--text-heading)

H3 — Card headings, subsection titles:
  Size:    text-lg / 18px
  Weight:  font-semibold (600)
  Leading: leading-normal (1.4)
  Color:   var(--text-heading)

H4 — Panel labels, small headings:
  Size:    text-base / 16px
  Weight:  font-semibold (600)
  Leading: leading-normal (1.5)
  Color:   var(--text-heading)

BODY LARGE — Primary content, descriptions:
  Size:    text-base / 16px
  Weight:  font-normal (400)
  Leading: leading-relaxed (1.6)
  Color:   var(--text-body) = #2D2D35

BODY — Standard interface text:
  Size:    text-sm / 14px
  Weight:  font-normal (400)
  Leading: leading-normal (1.5)
  Color:   var(--text-body)

BODY SMALL — Supporting, metadata:
  Size:    text-xs / 12px
  Weight:  font-normal (400)
  Leading: leading-normal (1.5)
  Color:   var(--text-secondary) = #6B6B78

LABEL — Form labels, table headers, field names:
  Size:    text-sm / 14px
  Weight:  font-medium (500)
  Leading: leading-normal (1.4)
  Color:   var(--text-body-strong) = #1F1F24

CAPTION — Timestamps, metadata, fine print:
  Size:    text-xs / 12px
  Weight:  font-normal (400)
  Leading: leading-normal (1.4)
  Color:   var(--text-tertiary) = #909099

OVERLINE — Category labels above sections:
  Size:    11px (text-[11px])
  Weight:  font-semibold (600)
  Tracking: tracking-widest (0.08em)
  Transform: UPPERCASE
  Color:   var(--text-secondary)

CODE — Technical text, scores, IDs:
  Size:    text-sm / 13px
  Family:  font-mono
  Color:   var(--text-body)
  Background: var(--bg-code) = var(--sc-gray-100)
  Padding: 2px 6px
  Radius:  rounded-sm
```

---

## 4. Component Design Patterns

### 4.1 Standard Card

All cards across the system share this base specification.
No custom card styles are permitted.

```
BASE CARD:
  Background:     var(--bg-card) = #FFFFFF
  Border:         1px solid var(--border-card) = #E8E8ED
  Border-radius:  rounded-xl (12px)
  Shadow:         var(--shadow-card) = 0 1px 3px rgba(0,0,0,0.06),
                                       0 1px 2px rgba(0,0,0,0.04)
  Padding:        p-6 (24px) standard
                  p-4 (16px) compact
                  p-0 (0px) when card uses internal section padding

INTERACTIVE CARD (hover):
  Cursor:         pointer
  Hover shadow:   var(--shadow-md)
  Hover bg:       var(--bg-card-hover) = #FAFAFA
  Transition:     transition-all duration-150

SELECTED CARD:
  Background:     var(--bg-card-selected) = #F5F3FF
  Border:         1px solid var(--border-selected) = #B4A3F3

CARD HEADER SECTION (when card has a distinct header):
  Background:     var(--bg-secondary-panel) = #F8F8FA
  Border-bottom:  1px solid var(--border-subtle) = #F0F0F4
  Padding:        px-6 py-4
  Border-radius:  rounded-t-xl (top corners only)
  Title style:    H4

CARD FOOTER SECTION:
  Border-top:     1px solid var(--border-subtle)
  Padding:        px-6 py-4
  Layout:         flex items-center justify-end gap-3

CARD VISUAL ANATOMY:
  ┌──────────────────────────────────────────┐ ← border-card + rounded-xl
  │  HEADER (optional)                       │ ← bg-secondary-panel, border-b
  │  Title text             [Action button]  │
  ├──────────────────────────────────────────┤
  │  BODY                                    │ ← bg-card, p-6
  │  Content                                 │
  ├──────────────────────────────────────────┤
  │  FOOTER (optional)                       │ ← border-t, px-6 py-4
  │  Cancel           Confirm                │
  └──────────────────────────────────────────┘
```

### 4.2 Feed Post Card

```
Container:
  Same base card, padding p-4, margin-bottom mb-3

HEADER ROW — flex items-start gap-3:
  Avatar:         w-10 h-10 (40px) rounded-full
  Name:           text-sm font-semibold text-text-heading
  Handle / role:  text-xs text-text-secondary mt-0.5
  Timestamp:      text-xs text-text-tertiary ml-auto flex-shrink-0
  More options:   Ghost icon button (···) ml-2 w-8 h-8

BODY:
  Text:           text-sm text-text-body leading-relaxed
  Max lines:      3, with "...see more" expand link
  Expand link:    text-sc-purple-600 hover:underline text-sm
  Image (if any): rounded-lg mt-3 max-h-80 w-full object-cover

POST TAGS ROW — THIS IS A CRITICAL COMPONENT:
  Container:      flex flex-wrap gap-2 mt-3
  ─────────────────────────────────────────
  BRANDED TAG (topic, skill, technology):
    background:   var(--sc-purple-50)   ← NEVER white
    color:        var(--sc-purple-700)  ← NEVER white, NEVER transparent
    border:       1px solid var(--sc-purple-200)
    Tailwind:     bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200
    Size:         text-xs font-medium px-2 py-1 rounded-md

  NEUTRAL TAG (location, type, category):
    background:   var(--sc-gray-100)   ← NEVER white
    color:        var(--text-body)     ← NEVER white, NEVER transparent
    border:       1px solid var(--border-default)
    Tailwind:     bg-sc-gray-100 text-text-body border border-border-default
    Size:         text-xs font-medium px-2 py-1 rounded-md

  RULE: Tags MUST have a visible background color AND a visible border.
        White text on white is a critical accessibility failure.
        Tags with no background on a white card are invisible.
  ─────────────────────────────────────────

ACTION ROW — flex items-center gap-4 mt-3 pt-3 border-t border-border-subtle:
  Reaction:       Ghost icon + count, text-text-secondary
  Comment:        Ghost icon + count, text-text-secondary
  Share:          Ghost icon, text-text-secondary
  Hover all:      text-sc-purple-600 + icon color sc-purple-600
```

### 4.3 Buttons

```
PRIMARY BUTTON:
  Background:     var(--btn-primary-bg) = var(--sc-purple-600)
  Text:           var(--btn-primary-text) = #FFFFFF
  Height:         h-9 (36px) default
                  h-8 (32px) small
                  h-10 (40px) large
  Padding:        px-4 default | px-3 small | px-5 large
  Border-radius:  rounded-lg (8px)
  Font:           text-sm font-medium
  Hover:          var(--btn-primary-bg-hover) = sc-purple-700
  Disabled:       opacity-50 cursor-not-allowed
  Loading:        white spinner w-4 h-4 replacing icon or beside label

SECONDARY BUTTON (outlined):
  Background:     var(--btn-secondary-bg) = transparent
  Text:           var(--btn-secondary-text) = var(--sc-purple-600)
  Border:         1px solid var(--btn-secondary-border) = var(--sc-purple-300)
  Hover:          var(--btn-secondary-bg-hover) = var(--sc-purple-50)
  Same height/padding as primary

GHOST BUTTON:
  Background:     transparent
  Text:           var(--btn-ghost-text) = var(--text-body)
  No border
  Hover:          var(--btn-ghost-bg-hover) = var(--sc-gray-100)
  Used for: toolbar actions, icon actions, table row actions

DANGER BUTTON:
  Background:     var(--btn-danger-bg) = var(--sc-red-600)
  Text:           #FFFFFF
  Use only in: danger zones, destructive confirmation dialogs

ICON BUTTON:
  Size:           w-8 h-8 (32px) compact | w-9 h-9 (36px) default
  Border-radius:  rounded-lg
  Background:     transparent
  Hover:          var(--sc-gray-100)
  Icon:           w-4 h-4 (16px) | w-5 h-5 (20px)

BUTTON + ICON combination:
  Gap:            gap-2 between icon and label
  Icon size:      w-4 h-4 (16px) always
```

### 4.4 Form Inputs

```
TEXT INPUT:
  Height:         h-9 (36px) standard | h-10 (40px) large
  Padding:        px-3 py-2
  Background:     var(--bg-input) = #FFFFFF
  Border:         1px solid var(--border-input) = #D8D8DE
  Border-radius:  rounded-lg (8px)
  Font:           text-sm text-text-body
  Placeholder:    var(--text-placeholder) = #909099
  Focus ring:     border-color var(--border-focus) + box-shadow var(--shadow-input-focus)
  Error state:    border-border-error + bg-sc-red-50
  Disabled:       bg-input-disabled + text-text-disabled + cursor-not-allowed

FORM FIELD ANATOMY:
  ┌──────────────────────────────────────┐
  │ Label text               [Required*] │ ← text-sm font-medium text-text-body-strong
  │                                      │   Required: text-sc-red-500 text-xs ml-1
  │ [________________ Input ___________] │ ← h-9, border-input, rounded-lg
  │                                      │
  │ Helper text or error message         │ ← text-xs text-text-secondary or text-error
  └──────────────────────────────────────┘
  Label → input gap:  gap-1.5 (6px)
  Input → helper gap: mt-1.5 (6px)

SELECT / DROPDOWN input:
  Same as text input
  Padding-right:  pr-10 (space for arrow icon)
  Arrow icon:     absolute right-3, w-4 h-4, text-icon-default

TEXTAREA:
  Same as text input
  Min-height:     min-h-[80px]
  Resize:         resize-y only

SEARCH INPUT (topbar):
  Height:         h-9
  Padding:        pl-9 pr-12 (icon left, ctrl+k badge right)
  Background:     var(--sc-gray-100)
  Border:         1px solid var(--border-input)
  Search icon:    absolute left-3, w-4 h-4, text-icon-default
  Ctrl+K badge:   absolute right-3, text-xs bg-sc-gray-200 px-1.5 py-0.5 rounded

GLOBAL CSS RULE FOR PLACEHOLDERS (must be in globals.css):
  ::placeholder { color: var(--text-placeholder); opacity: 1; }

GLOBAL CSS RULE FOR FOCUS STATES (must be in globals.css):
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: var(--shadow-input-focus);
  }
```

### 4.5 Badges and Tags

```
PLAN BADGES:
  Size:           h-5 (20px), px-2 py-0.5, rounded-full
  Font:           text-xs font-semibold tracking-wide UPPERCASE
  ULTRA:          bg-sc-purple-600 text-white
  PRO:            bg-sc-blue-600 text-white
  BASIC:          bg-sc-gray-100 text-text-body border border-border-default

ROLE BADGES:
  ADMIN:          bg-sc-gray-800 text-white rounded-md px-2 py-0.5 text-xs
  VERIFIED:       bg-sc-blue-100 text-sc-blue-700 border border-sc-blue-200 rounded-md

STATUS BADGES:
  Success:        bg-sc-green-100 text-sc-green-700 border border-sc-green-200
  Error:          bg-sc-red-100 text-sc-red-700 border border-sc-red-200
  Warning:        bg-sc-amber-100 text-sc-amber-700 border border-sc-amber-200
  Info:           bg-sc-blue-100 text-sc-blue-700 border border-sc-blue-200
  New / Feature:  bg-sc-purple-100 text-sc-purple-700 border border-sc-purple-200
  All:            px-2 py-0.5 rounded-md text-xs font-medium

POST / CONTENT TAGS (see Section 4.2 for full spec):
  Branded:        bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200
  Neutral:        bg-sc-gray-100 text-text-body border border-border-default
  Both:           px-2 py-1 rounded-md text-xs font-medium

SKILL CHIPS (profile, candidate cards, job requirements):
  Background:     bg-sc-purple-50
  Text:           text-sc-purple-700
  Border:         border border-sc-purple-200
  Size:           text-xs font-medium px-2.5 py-1 rounded-md

RULE: Every badge, tag, chip, and label MUST have:
  - A visible background color (not white unless it has a visible border)
  - A text color that contrasts ≥ 4.5:1 against its background
  - A border when the background is very light
```

### 4.6 Data Tables

```
TABLE WRAPPER:
  Background:     var(--bg-card)
  Border:         1px solid var(--border-card)
  Border-radius:  rounded-xl
  Shadow:         var(--shadow-card)
  Overflow:       overflow-hidden (clips inner border against rounded corners)

TABLE HEADER ROW:
  Background:     var(--bg-secondary-panel) = #F8F8FA
  Border-bottom:  1px solid var(--border-subtle)
  Cell padding:   px-4 py-3
  Text:           text-xs font-semibold text-text-secondary UPPERCASE
  Letter-spacing: tracking-wider (0.05em)

TABLE DATA ROW:
  Border-bottom:  1px solid var(--border-subtle)
  Last row:       No border-bottom
  Hover bg:       var(--bg-card-hover) = #FAFAFA
  Cell padding:   px-4 py-3

TABLE CELL TYPES:
  Primary data:   text-sm font-medium text-text-heading
  Secondary data: text-sm text-text-secondary
  Metadata:       text-xs text-text-tertiary
  Actions cell:   text-right, ghost icon buttons, visible only on row hover
  Number/score:   font-mono text-sm text-text-body
```

### 4.7 Modals and Dialogs

```
OVERLAY:
  Background:     var(--bg-overlay) = rgba(14,14,20,0.45)
  Backdrop:       backdrop-blur-sm

MODAL CONTAINER:
  Background:     var(--bg-modal) = #FFFFFF
  Border:         1px solid var(--border-modal) = #E8E8ED
  Border-radius:  rounded-xl (12px)
  Shadow:         var(--shadow-modal)
  Animation in:   scale-95 opacity-0 → scale-100 opacity-100, 200ms ease-out
  Sizes:
    sm:  max-w-sm (384px)
    md:  max-w-md (448px)  ← default
    lg:  max-w-lg (512px)
    xl:  max-w-xl (576px)
    2xl: max-w-2xl (672px) ← for form modals

MODAL HEADER:
  Padding:        px-6 py-4
  Border-bottom:  1px solid var(--border-subtle)
  Title:          H3 style
  Close button:   absolute top-4 right-4, ghost icon button w-8 h-8

MODAL BODY:
  Padding:        px-6 py-6

MODAL FOOTER:
  Padding:        px-6 py-4
  Border-top:     1px solid var(--border-subtle)
  Layout:         flex justify-end gap-3
  Button order:   Cancel (ghost/secondary) → Confirm/Submit (primary or danger)
```

### 4.8 Navigation: Sidebar Profile Card (Feed left column)

```
Width:            w-64 (256px)
Position:         sticky top-6

CARD SECTIONS:
  Cover strip:    h-16 bg-sc-gray-100 rounded-t-xl
  Avatar:         w-16 h-16 rounded-full, border-3 border-white shadow-md
                  positioned: -mt-8 ml-4 relative z-10
  Name:           text-sm font-bold text-text-heading px-4 pt-2
  Handle:         text-xs text-text-secondary px-4
  Role:           text-xs text-text-body px-4 mt-1

STATS SECTION:
  Border-top:     1px solid var(--border-subtle)
  Padding:        px-4 py-3
  Layout:         flex justify-between
  Stat value:     text-sm font-semibold text-sc-purple-600
  Stat label:     text-xs text-text-secondary

QUICK LINKS:
  Border-top:     1px solid var(--border-subtle)
  Items:          text-sm text-text-secondary hover:text-text-brand py-2 px-4
  Icons:          w-4 h-4 mr-2 text-icon-default
```

### 4.9 Feed Right Panel

```
Width:            w-80 (320px)
Position:         sticky top-6

Cards inside use standard card pattern.

SECTION HEADER:
  Font:           text-sm font-semibold text-text-heading
  Margin-bottom:  mb-3

ITEM ROW:
  Font:           text-sm text-text-body
  Hover:          text-text-brand hover:underline cursor-pointer
  Divider:        1px solid var(--border-subtle) between items
  Padding:        py-2

TRENDING TAGS inside right panel:
  Same branded tag spec as Section 4.2
  NEVER white on white
```

### 4.10 Empty States

```
Every page that can have no data MUST have an empty state component.

EMPTY STATE ANATOMY:
  Container:      flex flex-col items-center justify-center text-center
                  min-h-[192px] p-8
  Icon:           w-12 h-12 text-sc-gray-300 (NOT brand purple — keep it muted)
  Title:          text-base font-semibold text-text-heading mt-4
  Description:    text-sm text-text-secondary mt-2 max-w-xs
  CTA button:     primary or secondary mt-4 (when an action resolves the empty state)

EXAMPLES:
  No feed posts:      Newspaper icon + "Nothing in your feed yet"
  No jobs:            Briefcase icon + "No jobs match your filters"
  No connections:     Users icon + "Your network is empty"
  No messages:        Message circle icon + "No conversations yet"
  No search results:  Search icon + "No results for this query"
  No candidates:      User search icon + "No candidates match this search"
```

### 4.11 Loading States

```
SKELETON LOADING (page/section content):
  Use skeleton blocks, never full-page spinners
  Skeleton background:   var(--sc-gray-100)
  Skeleton animation:    animate-pulse
  Skeleton border-radius: match the element shape exactly

INLINE SPINNER (buttons, small panels):
  Color on white:   text-sc-purple-600
  Color on purple:  text-white
  Size in button:   w-4 h-4
  Size standalone:  w-6 h-6
```

### 4.12 Avatars

```
Sizes:
  xs:  w-6 h-6 (24px)   — comment threads, dense lists
  sm:  w-8 h-8 (32px)   — table rows, topbar user menu
  md:  w-10 h-10 (40px) — feed posts, message bubbles
  lg:  w-12 h-12 (48px) — profile/hire cards
  xl:  w-16 h-16 (64px) — profile page header
  2xl: w-20 h-20 (80px) — large profile hero (landing-facing)

All avatars:
  Shape:          rounded-full
  Object fit:     object-cover
  Fallback bg:    var(--sc-purple-100) with initials text-sc-purple-700
  Border (on light surface): ring-2 ring-white
  Border (large): ring-3 ring-white + shadow-md
```

### 4.13 Dropdowns and Menus

```
DROPDOWN PANEL:
  Background:     var(--bg-dropdown) = #FFFFFF
  Border:         1px solid var(--border-dropdown) = #E8E8ED
  Border-radius:  rounded-xl (12px)
  Shadow:         var(--shadow-dropdown) = shadow-lg
  Min-width:      min-w-[180px]
  Padding:        py-1
  Animation:      opacity-0 translate-y-1 → opacity-100 translate-y-0, 150ms

DROPDOWN ITEM:
  Padding:        px-3 py-2
  Font:           text-sm text-text-body
  Hover bg:       var(--bg-dropdown-item-hover) = var(--sc-gray-50)
  Danger item:    text-sc-red-600 hover:bg-sc-red-50
  Divider:        1px solid var(--border-subtle) my-1
  Icon (if any):  w-4 h-4 mr-2.5 text-icon-default
```

### 4.14 Tooltips

```
Background:     var(--bg-tooltip) = var(--sc-gray-900)
Text:           var(--text-tooltip) = #FFFFFF
Font:           text-xs
Padding:        px-2.5 py-1.5
Border-radius:  rounded-md
Shadow:         var(--shadow-sm)
Max-width:      max-w-[200px]
Animation:      opacity-0 → opacity-100, 100ms
```

### 4.15 Notification / Unread Dot Badge

```
Size:           w-4 h-4 (16px) — icon badge
                w-2 h-2 (8px)  — subtle presence dot
Background:     var(--sc-red-500) for alerts
                var(--sc-purple-500) for feature highlights
Shape:          rounded-full
Position:       absolute -top-1 -right-1 on icon containers
Text (count):   text-[10px] font-bold text-white, min-w-[16px] text-center
```

---

## 5. Page-by-Page Design Specifications

### 5.1 /feed — Home Feed

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN A (Three Column)
Max width:      1200px centered

Left column (w-64, fixed/sticky):
  - Profile mini-card (Section 4.8)
  - "My Items" link card

Center column (flex-1):
  - Create post card (text area + action bar)
  - Infinite feed of Post Cards (Section 4.2)
  - Load more / skeleton loading

Right column (w-80, fixed/sticky):
  - Trending Intelligence card (Section 4.9)
  - Recommended Jobs card
  - People to follow card
```

### 5.2 /network — Network Page

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN B (Two Column)

Left panel (w-72):
  - Filter tabs: All | Following | Followers | Pending requests
  - Each tab is a pill tab, active = bg-sc-purple-100 text-sc-purple-700

Right panel (flex-1):
  - Grid of connection cards: 2 cols on standard, 3 cols on wide
  - Connection card: standard card, avatar lg, name, role, mutual count,
    Connect/Following button, skill chips row
```

### 5.3 /jobs — Job Listings

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN B (Two Column)

Left panel (w-72):
  - Search input (local)
  - Filter sections: Job type, Location, Salary range, Experience level
  - Each filter: checkbox list or range slider
  - Clear filters link bottom

Right panel (flex-1):
  - Sort bar (Latest | Relevance | Salary)
  - Vertical list of job cards
  - Job card: standard compact card, company logo 40px, title H4,
    company name + location, salary range, job type badge, posted date,
    Save + Apply buttons
```

### 5.4 /jobs/[id] — Job Detail

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN C (max-w-3xl)

Content stack:
  - Breadcrumb: Jobs → Job Title
  - Header card: logo 60px, title H1, company, location, salary, type badges
    Action row: Apply button (primary) + Save (secondary)
  - About this role card
  - Requirements card: skill chips grid
  - Application card: sticky on desktop, inputs + primary CTA
```

### 5.5 /jobs/create — Post a Job

```
Shell:          Full topbar + sidebar (AUTO-COLLAPSED)
Layout:         PATTERN C (max-w-2xl)

Content:
  - Multi-step progress stepper (steps: Basics | Details | Requirements | Preview)
  - Each step in a standard card
  - Rich text editor for description (border-input, rounded-lg wrapper)
  - Workplace type matrix (grid of selectable cards)
  - Live preview panel (shown on final step)
  - Bottom nav: Back (ghost) + Continue / Post (primary)
```

### 5.6 /profile/[username] — Profile Page

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN C (max-w-3xl)

Content stack:
  - Cover photo area (h-40, bg-sc-gray-100 fallback)
  - Avatar xl (w-20 h-20), -mt-10, ring-4 ring-white
  - Name H1, handle, role, plan badge
  - Action row (if viewing other profile): Connect + Message + Follow
  - Bio card
  - AI Execution Score card (purple accent, score prominent)
  - Experience timeline card
  - Skills card (chip grid — branded tags)
  - Portfolio / projects card
  - Activity / posts card
```

### 5.7 /hire — Recruiter Dashboard

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN B (Two Column)

Left panel (w-72):
  - Active open roles list
  - Per role: title, count of applicants, status badge
  - "+ Post a Job" primary button at top

Right panel (flex-1):
  - Selected role pipeline view
  - Pipeline stages: Applied | Screened | Interview | Offer
  - Candidate mini-cards per stage (kanban or list view toggle)
```

### 5.8 /hire/search — AI Candidate Search

```
Shell:          Full topbar + sidebar (AUTO-COLLAPSED)
Layout:         PATTERN D (Full Width)

Content:
  - Search bar full width at top (large variant, h-12)
  - Filter chip row below: Skills | Location | Experience | Score
  - Results grid: 3 cols wide, 2 cols medium
  - Candidate card:
    - Avatar lg (w-12 h-12)
    - Name H4, current title
    - Skill chips (3 max, + N more)
    - AI execution score badge (sc-purple bg)
    - View Profile (secondary) + Shortlist (primary) buttons
```

### 5.9 /messages — Messaging

```
Shell:          Full topbar + sidebar (AUTO-COLLAPSED)
Layout:         PATTERN D (Full Width, split-panel chat)

Left panel (w-80, border-right):
  - Search conversations input
  - Conversation list items:
    - Avatar md + Name (font-medium) + Preview text + Timestamp
    - Unread: bg-sc-gray-50, name font-semibold, unread dot badge
    - Active: bg-bg-card-selected + border-l-2 border-sc-purple-600

Right panel (flex-1):
  - Chat header: avatar md + name + online status dot
  - Messages area: flex-1 overflow-y-auto, py-4 px-6
    - My messages:    bg-sc-purple-600 text-white
                      rounded-xl rounded-br-sm max-w-[70%] ml-auto
    - Their messages: bg-sc-gray-100 text-text-body
                      rounded-xl rounded-bl-sm max-w-[70%]
    - Timestamp:      text-[10px] text-text-tertiary mt-1
  - Input row (sticky bottom):
    - border-top border-subtle
    - Text input (flex-1) + Send button (primary icon button)
```

### 5.10 /interview — AI Interview Lobby

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN C (max-w-2xl)

Content:
  - Hero card: "Start AI Interview" heading, description paragraph
  - Role selector card (dropdown or card selection grid)
  - System check card: camera | microphone | permissions — status indicators
  - Start Interview button (primary, full-width, h-11)
```

### 5.11 /interview/[id] — Active Interview Session

```
Shell:          NONE — no topbar, no sidebar, no rail
Layout:         FULL SCREEN
Theme:          DARK ENVIRONMENT
Status:         EXEMPT from all light theme rules
                See UICOLORS.md Section 3.11 for dark env tokens
DO NOT APPLY any UIDESIGN.md layout rules to this page.
```

### 5.12 /analytics — Analytics Dashboard

```
Shell:          Full topbar + sidebar (AUTO-COLLAPSED)
Layout:         PATTERN D (Full Width)

Content:
  - Page title row: H1 + date range picker
  - Stats row: 4 metric cards in grid (see metric card spec below)
    Metric card: bg-bg-card, border, h-28, label text-xs uppercase,
                 value text-3xl font-bold text-sc-purple-600,
                 trend badge (green up / red down)
  - Charts row: 2 chart cards side by side (chart bg: white card)
    Chart primary color: var(--sc-purple-600)
    Chart grid lines:    var(--sc-gray-100)
    Chart axis text:     var(--text-secondary)
  - Activity table: full width standard table (Section 4.6)
```

### 5.13 /settings — Settings

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN B (Two Column)

Left panel (w-56):
  - Settings sub-nav: Account | Security | Notifications | Privacy | Danger Zone
  - Active item: bg-bg-sidebar-active text-text-sidebar-active rounded-lg
  - Same styling as main sidebar nav items

Right panel (flex-1, max-w-2xl):
  - Section H2 + description paragraph
  - Form card(s) using standard card + p-6
  - Danger Zone: card with left border-l-4 border-sc-red-500 + subtle red bg
  - Save changes button bottom-right of each section card
```

### 5.14 /credits — Credits & Billing

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN C (max-w-2xl)

Content:
  - Balance summary card: large credit balance in sc-purple-600, large font
  - Plan cards in grid (2 cols): current plan highlighted with
    border-2 border-sc-purple-600 + badge "Current Plan"
  - Credit history: standard table, Amount | Type | Date | Status
  - Payment method card
```

### 5.15 /salary — Salary Insights

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN B (Two Column)

Left panel (w-72):
  - Role filter (search + select)
  - Location filter
  - Experience level selector

Right panel (flex-1):
  - Salary range visualization (bar or range chart)
  - Percentile band cards
  - If locked (non-ULTRA): semi-transparent overlay over data
    with upgrade card centered (bg-white rounded-xl shadow-lg p-6)
```

### 5.16 /learning — Learning Academy

```
Shell:          Full topbar + sidebar (EXPANDED)
Layout:         PATTERN B (Two Column)

Left panel (w-72):
  - Category navigation list
  - My Progress section (enrolled courses, completion %)

Right panel (flex-1):
  - Featured course banner card (bg-sc-purple-600 text + image)
  - Course cards grid (2-3 cols)
  - Course card: thumbnail rounded-lg, title H4, duration + level badges,
    progress bar if enrolled (bg-sc-purple-600 fill)
```

### 5.17 /search — Global Search Results

```
Shell:          Full topbar + sidebar (AUTO-COLLAPSED)
Layout:         PATTERN D (Full Width)

Content:
  - Search bar (large, full-width, h-12) with current query
  - Result type tabs: All | People | Jobs | Companies | Posts
  - Tab active: text-sc-purple-600, border-b-2 border-sc-purple-600
  - Results in card format appropriate to type
```

### 5.18 /admin/* — Admin Console

```
Shell:          Full topbar + sidebar (AUTO-COLLAPSED)
Layout:         PATTERN D (Full Width)

All cards:      Standard light card pattern — NO dark surfaces
All tables:     Standard table pattern (Section 4.6)
Admin sub-nav:  Internal horizontal tab bar at page top
Tab active:     border-b-2 border-sc-purple-600 text-sc-purple-600
Background:     var(--bg-page) = white
RULE: Absolutely no dark theme or zinc/slate backgrounds in admin console.
```

### 5.19 Auth Pages (/login, /register, /forgot-password, /reset-password)

```
Shell:          NO topbar, NO sidebar, NO rail
Background:     var(--bg-page) = #FFFFFF
                Optional: bg-sc-gray-50 page with white card centered

Layout:
  - Logo centered top (not full topbar — just logo mark + wordmark)
  - Single card: max-w-md, standard card, p-8
  - Form inside card
  - Footer links below card (text-sm text-text-secondary links)

Register page role selector:
  - Two selectable cards side by side: CANDIDATE | RECRUITER
  - Selected: border-2 border-sc-purple-600 bg-sc-purple-50
  - Unselected: standard border, white bg
  - URL param ?role=candidate pre-selects CANDIDATE automatically
```

### 5.20 /onboarding — Onboarding Wizard

```
Shell:          Light topbar (logo only, no search, no nav)
                NO sidebar, NO rail
Background:     var(--bg-secondary-panel) = #F8F8FA

Layout:
  - Progress stepper top: numbered steps, active = sc-purple-600
  - Centered card: max-w-xl, standard card, p-8
  - Step content inside card
  - Back (ghost) + Continue (primary) buttons at card bottom
```

### 5.21 Dead / Legal Pages (/about, /help, /terms, /accessibility, /legal/*)

```
Shell:          Simple nav bar (logo only + "Back to Home" link)
                NO authenticated sidebar
Background:     var(--bg-page) = #FFFFFF

Layout:         PATTERN C (max-w-3xl mx-auto)
  - Page header: H1 title + last updated date (text-text-secondary)
  - Content sections in prose blocks
  - Section dividers: border-b border-border-subtle pb-6 mb-6
  - Body text: text-base text-text-body leading-relaxed
  - Back to home link at page bottom
```

---

## 6. Responsive Behavior

```
MOBILE (< 768px):
  - Sidebar: Fully hidden, toggle via hamburger in topbar
             Opens as full-height overlay when triggered
  - Three-column → Single column stacked
  - Two-column → Single column stacked
  - Cards: Full width, padding p-4
  - Tables: Horizontal scroll wrapper, min-width on table

TABLET (768px – 1024px):
  - Sidebar: Auto-collapsed to 64px icon rail
  - Three-column: Drop left column, use two columns
  - Cards: Standard padding maintained

DESKTOP (> 1024px):
  - Full layout per page specification
  - Sidebar default per Section 1.5

WIDE (> 1280px):
  - Max-width caps enforce — content never stretches beyond specified widths
  - Generous outer padding: px-8 on outermost content wrapper
```

---

## 7. Animation and Transition Standards

```
MICRO-INTERACTIONS (hover, focus, active):
  Duration:   150ms
  Easing:     ease-in-out
  Properties: color, background-color, border-color, box-shadow, opacity

SIDEBAR EXPAND/COLLAPSE:
  Duration:   200ms
  Easing:     ease-in-out
  Properties: width (sidebar), margin-left/padding-left (content area)

MODAL ENTRANCE:
  Duration:   200ms
  From:       opacity-0 scale-95
  To:         opacity-100 scale-100
  Easing:     ease-out

DROPDOWN ENTRANCE:
  Duration:   150ms
  From:       opacity-0 translate-y-1
  To:         opacity-100 translate-y-0

SKELETON PULSE:
  Duration:   1.5s infinite ease-in-out
  Color:      var(--sc-gray-100)

PAGE TRANSITIONS:
  None — avoid full-page transitions (causes layout shift)

ALL ANIMATIONS must be wrapped in:
  @media (prefers-reduced-motion: no-preference) { ... }
  This ensures accessibility compliance for motion-sensitive users.
```

---

## 8. Anti-Patterns — Rules Never to Break

```
SHELL VIOLATIONS:
  ❌ Removing sidebar entirely on any authenticated page
  ❌ Removing topbar on any authenticated page
  ❌ Using a dark sidebar, dark topbar, or dark page background
     on any page except /interview/[id]
  ❌ Hiding the Ctrl+K search bar on any authenticated page
  ❌ Missing active state on current sidebar nav item
  ❌ Collapsed sidebar showing text labels (icon-only in collapsed)

TAG AND BADGE VIOLATIONS (most common failure):
  ❌ White text on white background (critical — invisible)
  ❌ Tags with no background color (merges into page — invisible)
  ❌ Tags with no border when background is very light
  ❌ Skill chips with no visible fill (see 4.5)
  ❌ Post tags without bg-sc-purple-50 or bg-sc-gray-100

TYPOGRAPHY VIOLATIONS:
  ❌ More than 3 font size levels within a single card
  ❌ text-align: center on body paragraphs (only for empty states/heroes)
  ❌ font-weight: bold (700) on body text (use font-medium: 500 for emphasis)
  ❌ UPPERCASE text anywhere except OVERLINE labels and table headers
  ❌ Missing line-height on multi-line body text

COMPONENT VIOLATIONS:
  ❌ Cards with no border AND no shadow (invisible cards on white backgrounds)
  ❌ Inputs with no visible border
  ❌ Inputs with no visible placeholder text (must use --text-placeholder)
  ❌ Inputs with no visible focus state
  ❌ Buttons with no visible hover state
  ❌ Modals without dimmed overlay
  ❌ Forms without labels above every input
  ❌ Pages with data states but no empty state component

LAYOUT VIOLATIONS:
  ❌ Content wider than the specified max-width for that layout pattern
  ❌ Elements touching container edges with zero padding
  ❌ Arbitrary pixel gap values not from the spacing scale (Section 2.2)
  ❌ Admin console using dark zinc/slate/gray-900 backgrounds
```

---

## 9. Page Classification Master Table

| Route | Shell | Sidebar Default | Layout | Notes |
|---|---|---|---|---|
| `/` | Landing nav | None | Full width | Marketing page |
| `/login` | None | None | Centered card | Auth |
| `/register` | None | None | Centered card | Auth — role selector |
| `/forgot-password` | None | None | Centered card | Auth |
| `/reset-password` | None | None | Centered card | Auth |
| `/onboarding` | Logo only | None | Centered wizard | Multi-step |
| `/feed` | Full shell | Expanded | Pattern A | 3-column |
| `/network` | Full shell | Expanded | Pattern B | |
| `/jobs` | Full shell | Expanded | Pattern B | |
| `/jobs/[id]` | Full shell | Expanded | Pattern C | |
| `/jobs/create` | Full shell | Auto-collapsed | Pattern C | Form heavy |
| `/profile/[username]` | Full shell | Expanded | Pattern C | |
| `/messages` | Full shell | Auto-collapsed | Pattern D | Split chat |
| `/hire` | Full shell | Expanded | Pattern B | |
| `/hire/search` | Full shell | Auto-collapsed | Pattern D | Grid heavy |
| `/interview` | Full shell | Expanded | Pattern C | Lobby only |
| `/interview/[id]` | None | Hidden | Full screen | Dark env — exempt |
| `/analytics` | Full shell | Auto-collapsed | Pattern D | Data heavy |
| `/settings` | Full shell | Expanded | Pattern B | |
| `/credits` | Full shell | Expanded | Pattern C | |
| `/salary` | Full shell | Expanded | Pattern B | |
| `/learning` | Full shell | Expanded | Pattern B | |
| `/search` | Full shell | Auto-collapsed | Pattern D | |
| `/admin/*` | Full shell | Auto-collapsed | Pattern D | Admin console |
| `/about` | Simple nav | None | Pattern C | Dead page |
| `/help` | Simple nav | None | Pattern C | Dead page |
| `/terms` | Simple nav | None | Pattern C | Dead page |
| `/accessibility` | Simple nav | None | Pattern C | Dead page |
| `/legal/*` | Simple nav | None | Pattern C | Dead pages |

---

*End of UIDESIGN.md v2.0*
*This file governs every layout, spacing, typography, sidebar, and component decision.*
*Update this file first before changing any structural element in the codebase.*
*Color decisions remain governed by UICOLORS.md v2.0.*
*Companion agent prompt: ANTIGRAVITY_DESIGN_AUDIT_PROMPT.md*
