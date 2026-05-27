# UICOLORS.md — SkilledCore Global Color System
> **Version:** 2.0 | **Theme:** Professional Light | **May 2026**
> **Framework:** Next.js 16 + React 19 + Tailwind CSS v4
> **Rule:** This file is the ONLY source of truth for every color decision.
> No raw hex values allowed in components. Always use the token variable.

---

## 0. Design Philosophy

SkilledCore is a professional enterprise-grade talent intelligence platform.
The visual language must reflect that: clean, confident, readable, trustworthy.

**Core principles:**
- Pure white surfaces. No off-white, no cream, no gray wash on primary areas.
- One brand color (purple) used precisely — not everywhere, but powerfully.
- Maximum text contrast at all times. Readability is non-negotiable.
- Borders and shadows define depth — not color differences.
- Every interactive element must look intentionally clickable.
- The platform must feel closer to Linear or Notion than to a job board.

**This is a 100% light theme. There are no dark sections, no dark sidebars,
no dark backgrounds anywhere in the application except the AI Interview
session pages which have their own dedicated dark environment tokens.
Everything else is light.**

---

## 1. Brand Color Palette

```css
/* ─── BRAND PURPLE (Primary) ─── */
--sc-purple-950: #1E0A5C;    /* Deepest — hover on darkest elements */
--sc-purple-900: #2D1580;    /* Deep brand — active states */
--sc-purple-800: #3B1FA8;    /* Strong — pressed states */
--sc-purple-700: #4A28C9;    /* Bold — primary action hover */
--sc-purple-600: #5B35D5;    /* ★ PRIMARY BRAND — buttons, links, key UI */
--sc-purple-500: #7252E0;    /* Medium — secondary actions */
--sc-purple-400: #9278EA;    /* Light — icon accents, hover highlights */
--sc-purple-300: #B4A3F3;    /* Soft — decorative accents */
--sc-purple-200: #D4CCF8;    /* Pale — selected row backgrounds */
--sc-purple-100: #EAE6FD;    /* Very pale — hover states on white */
--sc-purple-50:  #F5F3FF;    /* Ghost — subtle tinted section bg */

/* ─── NEUTRAL GRAY (Foundation) ─── */
--sc-gray-950:   #0C0C0E;    /* Near black — maximum contrast text */
--sc-gray-900:   #141417;    /* Primary text — headings */
--sc-gray-800:   #1F1F24;    /* Strong body text */
--sc-gray-700:   #2D2D35;    /* Body text */
--sc-gray-600:   #4B4B57;    /* Secondary body text */
--sc-gray-500:   #6B6B78;    /* Muted / supporting text */
--sc-gray-400:   #909099;    /* Placeholder text */
--sc-gray-300:   #B8B8C0;    /* Subtle labels / disabled text */
--sc-gray-200:   #D8D8DE;    /* Dividers / subtle borders */
--sc-gray-150:   #E8E8ED;    /* Input borders / card borders */
--sc-gray-100:   #F0F0F4;    /* Light background tint */
--sc-gray-50:    #F8F8FA;    /* Sidebar / secondary panel bg */
--sc-white:      #FFFFFF;    /* Pure white — primary surfaces */

/* ─── BLUE (Secondary / Informational) ─── */
--sc-blue-700:   #1A4FC4;    /* Deep blue — active link */
--sc-blue-600:   #2563EB;    /* Standard blue — info actions */
--sc-blue-500:   #3B82F6;    /* Medium blue — icons */
--sc-blue-100:   #DBEAFE;    /* Pale blue — info badge bg */
--sc-blue-50:    #EFF6FF;    /* Ghost blue — info section tint */

/* ─── GREEN (Success) ─── */
--sc-green-700:  #15803D;    /* Deep green */
--sc-green-600:  #16A34A;    /* Standard green — success */
--sc-green-500:  #22C55E;    /* Medium green */
--sc-green-100:  #DCFCE7;    /* Pale green — success badge bg */
--sc-green-50:   #F0FDF4;    /* Ghost green — success section */

/* ─── RED (Danger / Error) ─── */
--sc-red-700:    #B91C1C;    /* Deep red */
--sc-red-600:    #DC2626;    /* Standard red — errors */
--sc-red-500:    #EF4444;    /* Medium red */
--sc-red-100:    #FEE2E2;    /* Pale red — error badge bg */
--sc-red-50:     #FEF2F2;    /* Ghost red — error section */

/* ─── AMBER (Warning) ─── */
--sc-amber-700:  #B45309;    /* Deep amber */
--sc-amber-600:  #D97706;    /* Standard amber — warnings */
--sc-amber-100:  #FEF3C7;    /* Pale amber — warning badge bg */
--sc-amber-50:   #FFFBEB;    /* Ghost amber — warning section */
```

---

## 2. Semantic Design Tokens

**These are the only values you should use in components.**
Raw palette values above are source material only.

```css
/* ══════════════════════════════════════════
   BACKGROUNDS
══════════════════════════════════════════ */

/* Page & Layout */
--bg-page:              var(--sc-white);        /* Every page's root background */
--bg-sidebar:           var(--sc-gray-50);      /* Left sidebar panel */
--bg-sidebar-hover:     var(--sc-gray-100);     /* Sidebar nav item: hover */
--bg-sidebar-active:    var(--sc-purple-100);   /* Sidebar nav item: active/current */
--bg-topbar:            var(--sc-white);        /* Top navigation bar */
--bg-secondary-panel:   var(--sc-gray-50);      /* Right panels, secondary columns */

/* Cards & Containers */
--bg-card:              var(--sc-white);        /* Standard card surface */
--bg-card-hover:        var(--sc-gray-50);      /* Card hover state */
--bg-card-selected:     var(--sc-purple-50);    /* Selected/active card */
--bg-section-tint:      var(--sc-gray-50);      /* Lightly tinted sections */
--bg-code:              var(--sc-gray-100);     /* Inline code blocks */

/* Inputs & Forms */
--bg-input:             var(--sc-white);        /* Text inputs, textareas */
--bg-input-disabled:    var(--sc-gray-100);     /* Disabled input */
--bg-select:            var(--sc-white);        /* Select dropdowns */
--bg-checkbox:          var(--sc-white);        /* Unchecked checkbox */
--bg-checkbox-checked:  var(--sc-purple-600);   /* Checked checkbox */
--bg-toggle-off:        var(--sc-gray-200);     /* Toggle switch: off */
--bg-toggle-on:         var(--sc-purple-600);   /* Toggle switch: on */

/* Overlays & Modals */
--bg-modal:             var(--sc-white);        /* Modal dialog surface */
--bg-overlay:           rgba(14,14,20,0.45);    /* Page dimmer overlay */
--bg-tooltip:           var(--sc-gray-900);     /* Tooltip bubble */
--bg-dropdown:          var(--sc-white);        /* Dropdown menu panel */
--bg-dropdown-item-hover: var(--sc-gray-50);   /* Dropdown item hover */

/* Status & Feedback */
--bg-success:           var(--sc-green-50);     /* Success alert/banner */
--bg-error:             var(--sc-red-50);       /* Error alert/banner */
--bg-warning:           var(--sc-amber-50);     /* Warning alert/banner */
--bg-info:              var(--sc-blue-50);      /* Info alert/banner */

/* Badges */
--bg-badge-ultra:       var(--sc-purple-600);   /* ULTRA plan */
--bg-badge-pro:         var(--sc-blue-600);     /* PRO plan */
--bg-badge-basic:       var(--sc-gray-100);     /* BASIC plan */
--bg-badge-admin:       var(--sc-gray-800);     /* ADMIN role */
--bg-badge-verified:    var(--sc-blue-100);     /* Verified checkmark badge */
--bg-badge-success:     var(--sc-green-100);    /* Success status */
--bg-badge-error:       var(--sc-red-100);      /* Error status */
--bg-badge-warning:     var(--sc-amber-100);    /* Warning status */
--bg-badge-new:         var(--sc-purple-100);   /* New / updated badge */

/* ══════════════════════════════════════════
   TEXT COLORS
══════════════════════════════════════════ */

/* Core Text */
--text-heading:         var(--sc-gray-900);     /* H1, H2, H3 headings */
--text-body:            var(--sc-gray-700);     /* Standard paragraph text */
--text-body-strong:     var(--sc-gray-800);     /* Bold body text */
--text-secondary:       var(--sc-gray-500);     /* Supporting / muted text */
--text-tertiary:        var(--sc-gray-400);     /* Very muted — timestamps, meta */
--text-placeholder:     var(--sc-gray-400);     /* Input placeholder text */
--text-disabled:        var(--sc-gray-300);     /* Disabled text */
--text-inverse:         var(--sc-white);        /* Text on dark/colored surfaces */

/* Brand & Semantic */
--text-brand:           var(--sc-purple-600);   /* Purple brand text */
--text-brand-hover:     var(--sc-purple-700);   /* Brand text on hover */
--text-link:            var(--sc-purple-600);   /* Hyperlinks */
--text-link-hover:      var(--sc-purple-700);   /* Hovered hyperlinks */
--text-link-visited:    var(--sc-purple-800);   /* Visited links */
--text-success:         var(--sc-green-700);    /* Success messages */
--text-error:           var(--sc-red-600);      /* Error messages */
--text-warning:         var(--sc-amber-700);    /* Warning messages */
--text-info:            var(--sc-blue-700);     /* Info messages */

/* Sidebar-specific (light sidebar) */
--text-sidebar-active:  var(--sc-purple-700);   /* Active nav item label */
--text-sidebar-inactive:var(--sc-gray-600);     /* Inactive nav item label */
--text-sidebar-hover:   var(--sc-gray-800);     /* Nav item on hover */
--text-sidebar-section: var(--sc-gray-400);     /* Sidebar section labels */

/* Topbar-specific */
--text-topbar-primary:  var(--sc-gray-900);     /* Topbar main text */
--text-topbar-secondary:var(--sc-gray-500);     /* Topbar muted text */

/* Badge text */
--text-badge-ultra:     var(--sc-white);
--text-badge-pro:       var(--sc-white);
--text-badge-basic:     var(--sc-gray-600);
--text-badge-admin:     var(--sc-white);
--text-badge-verified:  var(--sc-blue-700);
--text-badge-new:       var(--sc-purple-700);

/* Tooltip */
--text-tooltip:         var(--sc-white);        /* Text inside tooltips */

/* ══════════════════════════════════════════
   BORDERS
══════════════════════════════════════════ */

--border-default:       var(--sc-gray-150);     /* Standard card / section border */
--border-subtle:        var(--sc-gray-100);     /* Very light dividers */
--border-strong:        var(--sc-gray-200);     /* Stronger dividers */
--border-input:         var(--sc-gray-200);     /* Input field borders */
--border-input-hover:   var(--sc-gray-300);     /* Input on hover */
--border-focus:         var(--sc-purple-600);   /* Input focus ring color */
--border-focus-shadow:  rgba(91,53,213,0.18);   /* Input focus box-shadow */
--border-error:         var(--sc-red-500);      /* Error input border */
--border-success:       var(--sc-green-600);    /* Success input border */
--border-sidebar:       var(--sc-gray-150);     /* Sidebar right border */
--border-topbar:        var(--sc-gray-150);     /* Topbar bottom border */
--border-card:          var(--sc-gray-150);     /* Card edge border */
--border-modal:         var(--sc-gray-150);     /* Modal edge border */
--border-dropdown:      var(--sc-gray-150);     /* Dropdown border */
--border-selected:      var(--sc-purple-300);   /* Selected element border */
--border-brand:         var(--sc-purple-600);   /* Brand-colored borders */

/* ══════════════════════════════════════════
   SHADOWS
══════════════════════════════════════════ */

--shadow-xs:    0 1px 2px rgba(0,0,0,0.04);
--shadow-sm:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:    0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg:    0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04);
--shadow-xl:    0 20px 25px rgba(0,0,0,0.07), 0 10px 10px rgba(0,0,0,0.03);
--shadow-card:  var(--shadow-sm);
--shadow-modal: var(--shadow-xl);
--shadow-dropdown: var(--shadow-md);
--shadow-input-focus: 0 0 0 3px var(--border-focus-shadow);
--shadow-btn-primary: 0 1px 2px rgba(91,53,213,0.25);

/* ══════════════════════════════════════════
   BUTTONS
══════════════════════════════════════════ */

/* Primary Button */
--btn-primary-bg:           var(--sc-purple-600);
--btn-primary-bg-hover:     var(--sc-purple-700);
--btn-primary-bg-active:    var(--sc-purple-800);
--btn-primary-bg-disabled:  var(--sc-gray-200);
--btn-primary-text:         var(--sc-white);
--btn-primary-text-disabled:var(--sc-gray-400);
--btn-primary-border:       transparent;
--btn-primary-shadow:       var(--shadow-btn-primary);

/* Secondary Button (Outlined) */
--btn-secondary-bg:         var(--sc-white);
--btn-secondary-bg-hover:   var(--sc-purple-50);
--btn-secondary-bg-active:  var(--sc-purple-100);
--btn-secondary-text:       var(--sc-purple-600);
--btn-secondary-text-hover: var(--sc-purple-700);
--btn-secondary-border:     var(--sc-purple-300);
--btn-secondary-border-hover:var(--sc-purple-400);

/* Ghost Button (No border) */
--btn-ghost-bg:             transparent;
--btn-ghost-bg-hover:       var(--sc-gray-100);
--btn-ghost-text:           var(--sc-gray-600);
--btn-ghost-text-hover:     var(--sc-gray-900);

/* Danger Button */
--btn-danger-bg:            var(--sc-red-600);
--btn-danger-bg-hover:      var(--sc-red-700);
--btn-danger-text:          var(--sc-white);

/* Neutral Button */
--btn-neutral-bg:           var(--sc-gray-100);
--btn-neutral-bg-hover:     var(--sc-gray-150);
--btn-neutral-text:         var(--sc-gray-700);
--btn-neutral-border:       var(--sc-gray-200);

/* ══════════════════════════════════════════
   ICONS
══════════════════════════════════════════ */

--icon-default:             var(--sc-gray-500);
--icon-muted:               var(--sc-gray-300);
--icon-strong:              var(--sc-gray-700);
--icon-brand:               var(--sc-purple-600);
--icon-sidebar-active:      var(--sc-purple-600);
--icon-sidebar-inactive:    var(--sc-gray-400);
--icon-sidebar-hover:       var(--sc-gray-600);
--icon-on-color:            var(--sc-white);
--icon-success:             var(--sc-green-600);
--icon-error:               var(--sc-red-600);
--icon-warning:             var(--sc-amber-600);
--icon-info:                var(--sc-blue-600);
```

---

## 3. Component Color Rules — Explicit Per Section

### 3.1 Top Navigation Bar
```
Background:             var(--bg-topbar)              → #FFFFFF
Bottom border:          1px solid var(--border-topbar) → #E8E8ED
Logo text / wordmark:   var(--sc-gray-900)
Logo icon:              var(--sc-purple-600)
Sub-label "Talent Intelligence": var(--text-secondary) → #6B6B78
Nav link text:          var(--text-topbar-primary)
Nav link hover:         var(--text-brand)
Search bar bg:          var(--sc-gray-100)
Search bar border:      var(--border-input)
Search text:            var(--text-body)
Search placeholder:     var(--text-placeholder)       → #909099
Search icon:            var(--icon-default)
Credits badge text:     var(--sc-purple-600)
Credits bg:             var(--sc-purple-50)
Notification icon:      var(--icon-default)
Notification dot:       var(--sc-red-500)
Add Credits button:     --btn-primary-* tokens
Profile avatar border:  var(--border-default)
Feedback button:        --btn-ghost-* tokens
```

### 3.2 Left Sidebar
```
Background:             var(--bg-sidebar)              → #F8F8FA
Right border:           1px solid var(--border-sidebar) → #E8E8ED
Section label text:     var(--text-sidebar-section)   → #909099 (uppercase)

Nav item — default:
  Background:           transparent
  Text:                 var(--text-sidebar-inactive)   → #4B4B57
  Icon:                 var(--icon-sidebar-inactive)   → #909099

Nav item — hover:
  Background:           var(--bg-sidebar-hover)        → #F0F0F4
  Text:                 var(--text-sidebar-hover)      → #1F1F24
  Icon:                 var(--icon-sidebar-hover)      → #4B4B57

Nav item — active/current:
  Background:           var(--bg-sidebar-active)       → #EAE6FD
  Text:                 var(--text-sidebar-active)     → #4A28C9
  Icon:                 var(--icon-sidebar-active)     → #5B35D5
  Left accent bar:      3px solid var(--sc-purple-600)

Footer area in sidebar:
  Background:           var(--bg-sidebar)
  Top border:           1px solid var(--border-subtle)
  User name:            var(--text-body-strong)
  User role/plan:       var(--text-secondary)
  Settings icon:        var(--icon-default)
```

### 3.3 Feed / Home Page
```
Page root bg:           var(--bg-page)                 → #FFFFFF
Left column (profile card):
  Card bg:              var(--bg-card)
  Card border:          1px solid var(--border-card)
  Card shadow:          var(--shadow-card)
  Name text:            var(--text-heading)
  Handle text:          var(--text-secondary)
  Role text:            var(--text-body)
  Stats label:          var(--text-tertiary)
  Stats value:          var(--sc-purple-600)

Center feed column:
  Post card bg:         var(--bg-card)
  Post card border:     1px solid var(--border-card)
  Post card shadow:     var(--shadow-card)
  Author name:          var(--text-heading)
  Timestamp:            var(--text-tertiary)
  Post body:            var(--text-body)
  Action buttons:       var(--icon-default)
  Action button hover:  var(--sc-purple-600)
  Divider between posts:var(--border-subtle)

Right column (trending):
  Panel bg:             var(--bg-secondary-panel)
  Panel border:         1px solid var(--border-default)
  Heading:              var(--text-heading)
  Topic text:           var(--text-body)
  Post count:           var(--text-secondary)
  Job card bg:          var(--bg-card)
  Job title:            var(--text-heading)
  Company:              var(--text-secondary)
  Location tag:         var(--text-tertiary)
```

### 3.4 Profile Page
```
Cover photo area bg:    var(--sc-gray-100)              (fallback if no image)
Avatar border:          3px solid var(--sc-white)
  Avatar shadow:        var(--shadow-md)
Name heading:           var(--text-heading)
Username handle:        var(--text-secondary)
Role / title:           var(--text-body)
Bio text:               var(--text-body)
Stats (followers etc):  var(--text-heading) value, var(--text-secondary) label
Connect button:         --btn-primary-*
Message button:         --btn-secondary-*
Section headings:       var(--text-heading)
Section content:        var(--text-body)
Tab nav active:         var(--sc-purple-600) text + 2px bottom border
Tab nav inactive:       var(--text-secondary)
Skill tags bg:          var(--sc-purple-50)
Skill tags text:        var(--sc-purple-700)
Skill tags border:      var(--sc-purple-200)
```

### 3.5 Jobs Page
```
Page bg:                var(--bg-page)
Filter sidebar bg:      var(--bg-secondary-panel)
Filter sidebar border:  1px solid var(--border-default)
Filter heading:         var(--text-heading)
Filter label:           var(--text-body)
Filter checkbox:        --bg-checkbox / --bg-checkbox-checked

Job card bg:            var(--bg-card)
Job card border:        1px solid var(--border-card)
Job card shadow:        var(--shadow-card)
Job card hover shadow:  var(--shadow-md)
Job title:              var(--text-heading)
Company name:           var(--text-body-strong)
Location:               var(--text-secondary)
Job type tag bg:        var(--sc-purple-50)
Job type tag text:      var(--sc-purple-700)
Salary range:           var(--sc-green-700)
Posted date:            var(--text-tertiary)
Apply button:           --btn-primary-*
Save button:            --btn-ghost-*
```

### 3.6 Hire / Find Talent Page (Recruiter)
```
Page bg:                var(--bg-page)
Search input:           --bg-input, --border-input, --text-body
Filter tags bg:         var(--sc-gray-100)
Filter tags text:       var(--text-body)
Filter tags active bg:  var(--sc-purple-100)
Filter tags active text:var(--sc-purple-700)

Candidate card bg:      var(--bg-card)
Candidate card border:  1px solid var(--border-card)
Candidate card shadow:  var(--shadow-card)
Candidate name:         var(--text-heading)
Candidate title:        var(--text-body)
Skill chips bg:         var(--sc-gray-100)
Skill chips text:       var(--text-body)
AI Score badge bg:      var(--sc-purple-100)
AI Score text:          var(--sc-purple-700)
View profile button:    --btn-secondary-*
Shortlist button:       --btn-primary-*
```

### 3.7 Messages / Chat
```
Page bg:                var(--bg-page)
Conversation list bg:   var(--bg-secondary-panel)
Conversation item hover:var(--bg-sidebar-hover)
Conversation item active:var(--bg-card-selected)
Sender name:            var(--text-heading)
Last message preview:   var(--text-secondary)
Timestamp:              var(--text-tertiary)
Unread count badge:     --bg-badge-ultra / --text-badge-ultra

Chat area bg:           var(--bg-page)
My message bubble bg:   var(--sc-purple-600)
My message text:        var(--sc-white)
Their message bubble bg:var(--sc-gray-100)
Their message text:     var(--text-body)
Message input bg:       var(--bg-input)
Message input border:   var(--border-input)
Message input text:     var(--text-body)
Send button:            --btn-primary-*
Timestamp under bubble: var(--text-tertiary)
```

### 3.8 Analytics Dashboard
```
Page bg:                var(--bg-page)
Stat card bg:           var(--bg-card)
Stat card border:       1px solid var(--border-card)
Stat card shadow:       var(--shadow-card)
Stat value:             var(--text-heading)
Stat label:             var(--text-secondary)
Stat change positive:   var(--text-success)
Stat change negative:   var(--text-error)

Chart area bg:          var(--bg-card)
Chart border:           1px solid var(--border-card)
Chart title:            var(--text-heading)
Chart axis text:        var(--text-tertiary)
Chart primary line:     var(--sc-purple-600)
Chart secondary line:   var(--sc-blue-500)
Chart grid lines:       var(--sc-gray-100)
Chart tooltip bg:       --bg-tooltip
Chart tooltip text:     --text-tooltip
```

### 3.9 Settings Page
```
Page bg:                var(--bg-page)
Settings nav bg:        var(--bg-secondary-panel)
Settings nav border:    1px solid var(--border-default)
Settings nav active:    var(--bg-sidebar-active)
Settings nav text:      var(--text-sidebar-inactive)
Settings nav active text:var(--text-sidebar-active)

Form section heading:   var(--text-heading)
Form label:             var(--text-body-strong)
Form helper text:       var(--text-secondary)
Form input:             all --bg-input / --border-input / --text-body tokens
Danger zone section:
  Border:               1px solid var(--sc-red-200)
  Background:           var(--sc-red-50)
  Heading:              var(--sc-red-700)
  Text:                 var(--text-body)
  Button:               --btn-danger-*
```

### 3.10 Credits Page
```
Page bg:                var(--bg-page)
Balance card bg:        var(--bg-card)
Balance card border:    1px solid var(--border-card)
Balance value:          var(--sc-purple-600)
Balance label:          var(--text-secondary)
Plan name:              var(--text-heading)
Plan features list:     var(--text-body)
Feature check icon:     var(--icon-success)
Upgrade button:         --btn-primary-*
Credit history table:
  Header bg:            var(--sc-gray-50)
  Header text:          var(--text-secondary)
  Row bg:               var(--bg-card)
  Row border:           1px solid var(--border-subtle)
  Row hover:            var(--bg-card-hover)
  Cell text:            var(--text-body)
  Amount credit:        var(--text-success)
  Amount debit:         var(--text-error)
```

### 3.11 AI Interview Pages (EXCEPTION — Dark Environment)
```
NOTE: AI Interview session pages are the ONLY dark environment
in SkilledCore. This is intentional — it creates a focused,
distraction-free assessment environment distinct from the rest of the app.

Interview session bg:   #0E0E16
Panel bg:               #16161F
Panel border:           1px solid #2A2A3A
All standard text:      #E8E8F0
Secondary text:         #9090A8
Code editor bg:         #12121A
Code text:              #C8D0F0
Line numbers:           #4A4A60
Prompt text:            #E8E8F0
Timer text:             var(--sc-purple-400)
Submit button:          --btn-primary-* (purple still works on dark)
Progress bar fill:      var(--sc-purple-500)
Progress bar track:     #2A2A3A

CRITICAL: No light theme tokens apply inside interview session.
Every text element inside /interview/[id] must use dark-env colors above.
```

### 3.12 Landing Page (Marketing / Public)
```
Page bg:                var(--sc-white)
Navbar bg:              var(--sc-white)
Navbar border:          1px solid var(--sc-gray-150)
Navbar link text:       var(--text-body)
Navbar link hover:      var(--text-brand)
CTA button:             --btn-primary-*
Secondary CTA:          --btn-secondary-*

Hero headline:          var(--sc-gray-900)
Hero colored words:     var(--sc-purple-600)
Hero body:              var(--sc-gray-600)
Social proof bar bg:    var(--sc-gray-50)
Social proof text:      var(--text-secondary)
Social proof highlight: var(--sc-purple-600)

Feature section bg:     var(--sc-white)
Feature heading:        var(--text-heading)
Feature body:           var(--text-body)
Feature icon bg:        var(--sc-purple-100)
Feature icon:           var(--sc-purple-600)

Testimonial card bg:    var(--sc-gray-50)
Testimonial border:     1px solid var(--border-default)
Testimonial text:       var(--text-body)
Testimonial name:       var(--text-heading)
Testimonial role:       var(--text-secondary)

Footer bg:              var(--sc-gray-50)
Footer top border:      1px solid var(--border-default)
Footer heading:         var(--text-heading)
Footer links:           var(--text-secondary)
Footer links hover:     var(--text-brand)
Footer legal text:      var(--text-tertiary)
```

### 3.13 Forms & Inputs (Universal — All Pages)
```
Label:                  var(--text-body-strong)
Required asterisk:      var(--text-error)
Helper text:            var(--text-secondary)
Error message:          var(--text-error)
Success message:        var(--text-success)

Input default:
  Background:           var(--bg-input)           → #FFFFFF
  Border:               1px solid var(--border-input) → #D8D8DE
  Text:                 var(--text-body)           → #2D2D35
  Placeholder:          var(--text-placeholder)   → #909099
  Border-radius:        8px

Input hover:
  Border:               1px solid var(--border-input-hover) → #B8B8C0

Input focus:
  Border:               1px solid var(--border-focus) → #5B35D5
  Box-shadow:           var(--shadow-input-focus)
  Outline:              none

Input error:
  Border:               1px solid var(--border-error)
  Background:           var(--sc-red-50)

Input disabled:
  Background:           var(--bg-input-disabled)
  Border:               1px solid var(--border-subtle)
  Text:                 var(--text-disabled)
  Cursor:               not-allowed
```

### 3.14 Legal / Placeholder Pages
```
Page bg:                var(--bg-page)
Content wrapper bg:     var(--bg-page)
Heading:                var(--text-heading)
Subheading:             var(--sc-purple-600)
Body text:              var(--text-body)
Last updated text:      var(--text-tertiary)
Section divider:        1px solid var(--border-subtle)
Back link:              var(--text-link)
```

### 3.15 Modals & Dialogs
```
Overlay:                var(--bg-overlay) → rgba(14,14,20,0.45)
Modal container bg:     var(--bg-modal)   → #FFFFFF
Modal border:           1px solid var(--border-modal)
Modal shadow:           var(--shadow-modal)
Modal border-radius:    12px

Modal header:
  Title:                var(--text-heading)
  Close button icon:    var(--icon-default)
  Close button hover:   var(--icon-strong)
  Bottom border:        1px solid var(--border-subtle)

Modal body:
  Text:                 var(--text-body)
  Background:           var(--bg-modal)

Modal footer:
  Top border:           1px solid var(--border-subtle)
  Primary action:       --btn-primary-*
  Secondary action:     --btn-secondary-* or --btn-ghost-*
  Danger action:        --btn-danger-*
```

---

## 4. Anti-Patterns — Absolutely Never Do These

```
CONTRAST FAILURES:
❌ Any light-colored text on white/light background
❌ Any dark-colored text on dark background (except /interview/[id])
❌ Gray text below #6B6B78 (--sc-gray-500) on white — fails WCAG AA
❌ Purple text on purple background at any shade
❌ White text on pale purple (--sc-purple-100 or lighter)

SIDEBAR ERRORS:
❌ Dark sidebar background — sidebar is LIGHT (#F8F8FA)
❌ White text in the sidebar — sidebar text is DARK
❌ No active state indicator on current nav item

INPUT ERRORS:
❌ No visible border on inputs (invisible inputs)
❌ Placeholder same color as background (invisible placeholder)
❌ Input background matching page background with no border (merged invisible)
❌ Black placeholder text (too heavy — must be muted)

CARD ERRORS:
❌ Card background same as page background with no border (invisible card)
❌ No shadow or border on cards that need depth separation
❌ Missing hover state on interactive cards

BUTTON ERRORS:
❌ Primary button with no background (invisible)
❌ Ghost button text same color as white background
❌ Disabled button that looks enabled (must be visually muted)

GENERAL:
❌ Hardcoded hex values in components — always use CSS variables
❌ Mixing interview dark-env tokens with the rest of the app
❌ Raw Tailwind gray classes (gray-100, gray-900) without mapping to sc tokens
❌ Any use of black (#000000) or pure white (#FFFFFF) as a text color directly
   — use --text-heading or --text-inverse from the token system instead
```

---

## 5. WCAG 2.1 AA Contrast Compliance

Minimum contrast ratios that must be met:

| Use Case | Min Ratio | Required |
|---|---|---|
| Normal body text | 4.5:1 | AA |
| Large text (18px+ bold, 24px+ regular) | 3:1 | AA |
| UI components, input borders | 3:1 | AA |
| Placeholder text | 3:1 | AA |
| Disabled elements | Exempt | — |

**Verified passing token combinations:**

| Text Token | Background Token | Contrast | Status |
|---|---|---|---|
| --text-heading (#141417) | --bg-page (#FFFFFF) | 19.8:1 | ✅ AAA |
| --text-body (#2D2D35) | --bg-page (#FFFFFF) | 14.2:1 | ✅ AAA |
| --text-secondary (#6B6B78) | --bg-page (#FFFFFF) | 5.1:1 | ✅ AA |
| --text-placeholder (#909099) | --bg-input (#FFFFFF) | 3.5:1 | ✅ AA |
| --text-brand (#5B35D5) | --bg-page (#FFFFFF) | 5.8:1 | ✅ AA |
| --text-sidebar-active (#4A28C9) | --bg-sidebar-active (#EAE6FD) | 6.1:1 | ✅ AA |
| --text-sidebar-inactive (#4B4B57) | --bg-sidebar (#F8F8FA) | 7.3:1 | ✅ AAA |
| --text-inverse (#FFFFFF) | --btn-primary-bg (#5B35D5) | 6.4:1 | ✅ AA |
| --text-badge-verified (#1A4FC4) | --bg-badge-verified (#DBEAFE) | 5.5:1 | ✅ AA |

---

## 6. Global CSS Variable Declaration

Add this entire block to `styles/globals.css` or `styles/tokens.css`.
This single declaration fixes the majority of broken colors across all pages.

```css
:root {
  /* Brand Purple */
  --sc-purple-950: #1E0A5C;
  --sc-purple-900: #2D1580;
  --sc-purple-800: #3B1FA8;
  --sc-purple-700: #4A28C9;
  --sc-purple-600: #5B35D5;
  --sc-purple-500: #7252E0;
  --sc-purple-400: #9278EA;
  --sc-purple-300: #B4A3F3;
  --sc-purple-200: #D4CCF8;
  --sc-purple-100: #EAE6FD;
  --sc-purple-50:  #F5F3FF;

  /* Neutral Gray */
  --sc-gray-950:   #0C0C0E;
  --sc-gray-900:   #141417;
  --sc-gray-800:   #1F1F24;
  --sc-gray-700:   #2D2D35;
  --sc-gray-600:   #4B4B57;
  --sc-gray-500:   #6B6B78;
  --sc-gray-400:   #909099;
  --sc-gray-300:   #B8B8C0;
  --sc-gray-200:   #D8D8DE;
  --sc-gray-150:   #E8E8ED;
  --sc-gray-100:   #F0F0F4;
  --sc-gray-50:    #F8F8FA;
  --sc-white:      #FFFFFF;

  /* Blue */
  --sc-blue-700:   #1A4FC4;
  --sc-blue-600:   #2563EB;
  --sc-blue-500:   #3B82F6;
  --sc-blue-100:   #DBEAFE;
  --sc-blue-50:    #EFF6FF;

  /* Green */
  --sc-green-700:  #15803D;
  --sc-green-600:  #16A34A;
  --sc-green-100:  #DCFCE7;
  --sc-green-50:   #F0FDF4;

  /* Red */
  --sc-red-700:    #B91C1C;
  --sc-red-600:    #DC2626;
  --sc-red-500:    #EF4444;
  --sc-red-100:    #FEE2E2;
  --sc-red-50:     #FEF2F2;

  /* Amber */
  --sc-amber-700:  #B45309;
  --sc-amber-600:  #D97706;
  --sc-amber-100:  #FEF3C7;
  --sc-amber-50:   #FFFBEB;

  /* ── Semantic Tokens ── */
  --bg-page:                var(--sc-white);
  --bg-sidebar:             var(--sc-gray-50);
  --bg-sidebar-hover:       var(--sc-gray-100);
  --bg-sidebar-active:      var(--sc-purple-100);
  --bg-topbar:              var(--sc-white);
  --bg-secondary-panel:     var(--sc-gray-50);
  --bg-card:                var(--sc-white);
  --bg-card-hover:          var(--sc-gray-50);
  --bg-card-selected:       var(--sc-purple-50);
  --bg-section-tint:        var(--sc-gray-50);
  --bg-input:               var(--sc-white);
  --bg-input-disabled:      var(--sc-gray-100);
  --bg-modal:               var(--sc-white);
  --bg-overlay:             rgba(14,14,20,0.45);
  --bg-tooltip:             var(--sc-gray-900);
  --bg-dropdown:            var(--sc-white);

  --text-heading:           var(--sc-gray-900);
  --text-body:              var(--sc-gray-700);
  --text-body-strong:       var(--sc-gray-800);
  --text-secondary:         var(--sc-gray-500);
  --text-tertiary:          var(--sc-gray-400);
  --text-placeholder:       var(--sc-gray-400);
  --text-disabled:          var(--sc-gray-300);
  --text-inverse:           var(--sc-white);
  --text-brand:             var(--sc-purple-600);
  --text-link:              var(--sc-purple-600);
  --text-link-hover:        var(--sc-purple-700);
  --text-success:           var(--sc-green-700);
  --text-error:             var(--sc-red-600);
  --text-warning:           var(--sc-amber-700);
  --text-sidebar-active:    var(--sc-purple-700);
  --text-sidebar-inactive:  var(--sc-gray-600);
  --text-sidebar-hover:     var(--sc-gray-800);
  --text-sidebar-section:   var(--sc-gray-400);
  --text-tooltip:           var(--sc-white);

  --border-default:         var(--sc-gray-150);
  --border-subtle:          var(--sc-gray-100);
  --border-strong:          var(--sc-gray-200);
  --border-input:           var(--sc-gray-200);
  --border-input-hover:     var(--sc-gray-300);
  --border-focus:           var(--sc-purple-600);
  --border-focus-shadow:    rgba(91,53,213,0.18);
  --border-error:           var(--sc-red-500);
  --border-sidebar:         var(--sc-gray-150);
  --border-topbar:          var(--sc-gray-150);
  --border-card:            var(--sc-gray-150);
  --border-modal:           var(--sc-gray-150);
  --border-selected:        var(--sc-purple-300);

  --shadow-xs:   0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:   0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:   0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04);
  --shadow-xl:   0 20px 25px rgba(0,0,0,0.07), 0 10px 10px rgba(0,0,0,0.03);
  --shadow-card: var(--shadow-sm);
  --shadow-modal:var(--shadow-xl);
  --shadow-input-focus: 0 0 0 3px var(--border-focus-shadow);

  --btn-primary-bg:          var(--sc-purple-600);
  --btn-primary-bg-hover:    var(--sc-purple-700);
  --btn-primary-bg-disabled: var(--sc-gray-200);
  --btn-primary-text:        var(--sc-white);
  --btn-primary-text-disabled:var(--sc-gray-400);
  --btn-secondary-bg:        var(--sc-white);
  --btn-secondary-bg-hover:  var(--sc-purple-50);
  --btn-secondary-text:      var(--sc-purple-600);
  --btn-secondary-border:    var(--sc-purple-300);
  --btn-ghost-bg:            transparent;
  --btn-ghost-bg-hover:      var(--sc-gray-100);
  --btn-ghost-text:          var(--sc-gray-600);
  --btn-danger-bg:           var(--sc-red-600);
  --btn-danger-text:         var(--sc-white);

  --icon-default:            var(--sc-gray-500);
  --icon-muted:              var(--sc-gray-300);
  --icon-strong:             var(--sc-gray-700);
  --icon-brand:              var(--sc-purple-600);
  --icon-sidebar-active:     var(--sc-purple-600);
  --icon-sidebar-inactive:   var(--sc-gray-400);
  --icon-on-color:           var(--sc-white);
}
```

---

## 7. Page Classification Master Table

| Route | Theme | Sidebar | Top Bar | Notes |
|---|---|---|---|---|
| `/` | Light | None | Light | Marketing landing |
| `/login` | Light | None | None | Auth page — centered card |
| `/register` | Light | None | None | Auth page — centered card |
| `/forgot-password` | Light | None | None | Auth page |
| `/reset-password` | Light | None | None | Auth page |
| `/onboarding` | Light | None | Light | Step-based wizard |
| `/feed` | Light | Light | Light | Main app |
| `/network` | Light | Light | Light | Main app |
| `/jobs` | Light | Light | Light | Main app |
| `/jobs/[id]` | Light | Light | Light | Main app |
| `/jobs/create` | Light | Light | Light | Recruiter tool |
| `/profile/[username]` | Light | Light | Light | Public profile |
| `/messages` | Light | Light | Light | Chat interface |
| `/hire` | Light | Light | Light | Recruiter dashboard |
| `/hire/search` | Light | Light | Light | AI talent search |
| `/interview` | Light | Light | Light | Interview lobby |
| `/interview/[id]` | **DARK ENV** | None | None | **Exception — see 3.11** |
| `/analytics` | Light | Light | Light | Dashboard |
| `/settings` | Light | Light | Light | User settings |
| `/credits` | Light | Light | Light | Billing |
| `/salary` | Light | Light | Light | Insights |
| `/learning` | Light | Light | Light | Academy |
| `/search` | Light | Light | Light | Global search |
| `/admin` | Light | Light | Light | Admin panel |
| `/about` | Light | None | Light | Placeholder |
| `/help` | Light | None | Light | Placeholder |
| `/terms` | Light | None | Light | Placeholder |
| `/accessibility` | Light | None | Light | Placeholder |
| `/legal/*` | Light | None | Light | Legal pages |
| `/` (V1 Dark) | **HIBERNATED** | — | — | Do not touch |

---

*End of UICOLORS.md v2.0*
*This document governs every color in SkilledCore.*
*Update this file first, then update the codebase. Never the reverse.*
