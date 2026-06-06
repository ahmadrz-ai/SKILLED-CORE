# SkilledCore — Brand & Design System

> **Single source of truth.** This file replaces `UICOLORS.md` and `UIDESIGN.md`.
> Every color, spacing, radius, and component in the product MUST conform to this
> document. Tokens here map 1:1 to the CSS variables in `src/app/globals.css`.
> Theme: **minimalist, light-only**. Primary brand color extracted from `public/logo.png`.

---

## 0. Design principles

1. **Minimal, not empty.** Generous whitespace, one accent color, restrained type. Every
   element earns its place. If it doesn't aid the user's task, it's removed (after review).
2. **One brand color.** A single purple drives all primary actions across the entire app.
   No competing indigo/cyan/blue accents.
3. **Professional, muted palette.** Colors are Linear/Radix-grade — desaturated, confident,
   never neon or "AI-bright." Status colors are calm, not alarming.
4. **Readability is non-negotiable.** Text always meets WCAG AA (4.5:1 body, 3:1 large).
   Never white-on-white, never dark-on-dark/blue. Buttons always pass contrast.
5. **Consistency over cleverness.** The same component looks and behaves the same everywhere.
6. **Light theme only.** No dark-mode duplication in product surfaces (admin console may keep
   its own `.admin-dark` scope). Legacy hardcoded `zinc-950`/`slate-900`/`text-white` blocks
   are migrated to tokens.

---

## 1. Logo & brand foundation

- **Mark:** 3D hexagonal "S" with a purple gradient (light highlight → deep indigo shadow).
- **Asset:** `public/logo.png`. Always render on white or very light (`--sc-purple-50`) surfaces.
  Maintain clear space ≥ 25% of the mark's height on all sides. Never recolor or add effects.
- **Extracted palette (from logo pixels):** highlight `#C0A0F0`, core `#7040D0`, mid `#402080`,
  shadow `#201050`/`#100030`. These anchor the brand purple ramp below.

---

## 2. Color system

### 2.1 Brand purple ramp (primary)
Maps to `--sc-purple-*` in `globals.css`. **`--sc-purple-600` (#5B35D5) is THE brand color.**

| Token | Hex | Primary use |
|-------|-----|-------------|
| `--sc-purple-950` | `#1E0A5C` | Deepest brand shadow, rare text-on-tint |
| `--sc-purple-900` | `#2D1580` | Headlines on tint, dark brand fills |
| `--sc-purple-800` | `#3B1FA8` | Button **active/pressed** |
| `--sc-purple-700` | `#4A28C9` | Button **hover** |
| `--sc-purple-600` | `#5B35D5` | **Primary** — buttons, links, active states, focus ring |
| `--sc-purple-500` | `#7252E0` | Gradjuated accents, charts |
| `--sc-purple-400` | `#9278EA` | Subtle accents, icons on tint |
| `--sc-purple-300` | `#B4A3F3` | Borders on brand surfaces |
| `--sc-purple-200` | `#D4CCF8` | Hover tint, selected ring |
| `--sc-purple-100` | `#EAE6FD` | Selected/active background tint |
| `--sc-purple-50`  | `#F5F3FF` | Lightest brand wash (hover bg, banners) |

**Rule:** the primary action color is identical app-wide — `--sc-purple-600`, hover `-700`,
active `-800`, on-primary text `#FFFFFF`. No screen invents its own primary.

### 2.2 Neutrals
Maps to `--sc-gray-*`. Page background is pure white.

| Token | Hex | Use |
|-------|-----|-----|
| `--sc-gray-950` | `#0C0C0E` | — (reserve) |
| `--sc-gray-900` | `#141417` | **Headings** (`--text-heading`) |
| `--sc-gray-700` | `#2D2D35` | **Body text** (`--text-body`) |
| `--sc-gray-600` | `#4B4B57` | Body strong / icons |
| `--sc-gray-500` | `#6B6B78` | **Secondary text** |
| `--sc-gray-400` | `#909099` | Tertiary / placeholder |
| `--sc-gray-300` | `#B8B8C0` | Disabled text, strong borders |
| `--sc-gray-200` | `#D8D8DE` | Input borders |
| `--sc-gray-150` | `#E8E8ED` | **Default borders / dividers** |
| `--sc-gray-100` | `#F0F0F4` | Subtle fills, card hover |
| `--sc-gray-50`  | `#F8F8FA` | Section backgrounds, sidebar |
| `--sc-white`    | `#FFFFFF` | Page, cards, modals |

### 2.3 Status colors (minimal, professional)
Calm, desaturated. Each has a solid + a light tint for backgrounds.

| Role | Solid | Tint | Use |
|------|-------|------|-----|
| **Danger / destructive** | `#E5484D` | `#FFF0F0` | Delete, errors, danger zones. Use sparingly. |
| **Success** | `#30A46C` | `#ECFDF3` | Confirmations, verified badges, positive deltas |
| **Warning** | `#E5933A` | `#FFF7ED` | Cautions, pending, expiring |
| **Info** | `--sc-purple-600` / `#5B35D5` | `#F5F3FF` | Informational — **uses brand purple, not blue** |

> **Deprecated (remove on sight):** the `@theme` indigo `--color-primary: #6366F1`, cyan
> `--color-accent: #06B6D4`, and blue `--color-info: #3B82F6`. These compete with the brand
> and must be replaced by the purple/status tokens above. No raw blue in product UI (avoids
> the dark-text-on-blue readability bug and keeps brand focus).

### 2.4 Semantic tokens (use these, not raw hex)
Components reference semantic CSS variables, never raw `#hex`:
`--bg-page`, `--bg-card`, `--bg-sidebar`, `--bg-topbar`, `--bg-modal`, `--bg-overlay`,
`--text-heading`, `--text-body`, `--text-secondary`, `--text-tertiary`, `--text-inverse`,
`--text-brand`, `--text-link`, `--border-default`, `--border-subtle`, `--border-strong`,
`--border-input`, `--border-focus`, `--btn-primary-bg/-text`, etc. (all defined in `:root`).

### 2.5 Readability rules (hard requirements)
- **Never** `text-white` on a white/light background. **Never** dark text on dark/blue/brand fills.
- On-primary (purple) surfaces → text `#FFFFFF`. On light surfaces → text `--text-heading`/`--text-body`.
- Body text min 4.5:1; large/heading min 3:1; disabled may relax but must remain legible.
- Buttons: every variant must pass contrast in default + hover + active + disabled.
- Placeholder text uses `--text-placeholder` (never lighter than `--sc-gray-400`).

---

## 3. Typography
- **Sans:** Inter (`--font-sans`). **Mono:** JetBrains Mono (`--font-mono`, code/scores only).
- Scale (rem / px @16): Display 2.5/40 · H1 2/32 · H2 1.5/24 · H3 1.25/20 · H4 1.125/18 ·
  Body 1/16 · Small 0.875/14 · Caption 0.75/12.
- Weights: 400 body, 500 medium (labels), 600 semibold (headings/buttons), 700 bold (display only).
- Line height: 1.2 headings, 1.5 body. Letter-spacing: −0.01em on H1/Display, normal elsewhere.
- One H1 per page. Never use color alone to convey meaning.

---

## 4. Spacing, radius, elevation

- **Spacing scale (px):** 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Use multiples of 4. Card
  padding 16–24; page gutters 24–32; section gaps 32–48.
- **Radius:** inputs/buttons `8px`; cards `12px`; modals `16px`; pills/badges `9999px`;
  avatars circular. Be consistent — no mixed radii in one component.
- **Borders:** 1px `--border-default` (`#E8E8ED`) default; `--border-strong` for emphasis;
  focus uses `--border-focus` (purple) + focus shadow.
- **Elevation (shadows, subtle):** `--shadow-card`, `--shadow-card-hover`, `--shadow-dropdown`,
  `--shadow-modal`. Light theme = soft, low-opacity shadows. Avoid heavy drop shadows.

---

## 5. Motion
- Use the predefined animations: `fadeIn` 0.2s, `slideUp/Down` 0.25s, `scaleIn` 0.15s.
- Easing `ease-out` for enters. Durations 150–250ms. Respect `prefers-reduced-motion`.
- No infinite glow/neon effects in product (legacy `glow` keyframe is v1-dark only).

---

## 6. Component specifications

### 6.1 Buttons (`src/components/ui/button.tsx`)
One primary color across the app. Variants:
- **Primary:** bg `--sc-purple-600`, text `#FFFFFF`, hover `-700`, active `-800`, radius 8px,
  height 40 (md) / 36 (sm) / 44 (lg), font-weight 600, focus ring `--border-focus`.
- **Secondary:** bg `--sc-gray-100`, text `--text-heading`, hover `--sc-gray-150`.
- **Outline:** bg `--bg-page`, border `--border-default`, text `--text-heading`, hover bg
  `--sc-purple-50` + text `--sc-purple-800`.
- **Ghost:** transparent, text `--text-body`, hover bg `--sc-gray-100`.
- **Destructive:** bg `#E5484D`, text `#FFFFFF`, hover darken ~8%. Confirm-dialog required for
  irreversible actions.
- **Disabled:** 50% opacity, `cursor-not-allowed`, no hover.
- **Loading:** spinner + disabled; keep label or show concise progress text.
- Icon buttons: 36–40px square, centered icon, accessible `aria-label`.

### 6.2 Inputs & form fields
- bg `--bg-input`, border `--border-input`, radius 8px, padding 10×12, text `--text-body`.
- Hover `--border-input-hover`; focus `--border-focus` + `--shadow-input-focus`; error border
  `#E5484D` + helper text in danger. Labels 14px medium `--text-heading`; helper 12px secondary.

### 6.3 Borders, dividers, inlines, outlines
- Dividers: 1px `--border-default`, full-bleed within container.
- Inline emphasis: brand text via `--text-brand`; inline code uses mono + `--sc-gray-100` bg.
- Outlines (focus): always visible, purple, never removed for mouse users without replacement.

### 6.4 Blocks / sections / containers
- Max content width 1200–1280px; centered with 24–32px gutters.
- Section background alternates `--bg-page` / `--sc-gray-50` for rhythm; never more than 2 levels.

### 6.5 Cards (generic / post / profile / job)
- **Base card:** bg `--bg-card`, border `--border-card`, radius 12px, `--shadow-card`, padding
  16–24, hover `--shadow-card-hover` + bg `--bg-card-hover`.
- **Post card (feed):** avatar 40px + name (`--text-heading` 600) + handle/time (`--text-secondary`);
  body 16px `--text-body`; actions row (like/comment/share) ghost icon buttons; selected ring
  `--border-selected`.
- **Profile card:** avatar 56–64px, name + headline, location, Connect/Follow primary button,
  premium badge (purple pill) when ULTRA/PRO.
- **Job card:** title (`--text-heading` 600), company + location (secondary), tags as gray pills,
  primary "View"/"Apply" button.

### 6.6 Sidebar (`src/components/layout/Sidebar.tsx`)
- bg `--bg-sidebar` (`--sc-gray-50`), border-right `--border-sidebar`. Items: icon + label,
  radius 8px, hover `--bg-sidebar-hover`, active `--bg-sidebar-active` + `--text-brand` icon.
- **Notification badges:** pill `9999px`, bg `#E5484D` (danger) for unread counts, text white,
  min 16px, font 9–10px bold; sits at the right of the relevant item; shows on Network, Messages,
  Notifications, and any item with pending events. 99+ caps at "99+".

### 6.7 Topbar
- bg `--bg-topbar`, border-bottom `--border-topbar`, height 56–64px. Holds search, notification
  bell (with live badge), and avatar menu. Sticky.

### 6.8 Badges & pills
- Status pills use the status tints (success/warning/danger/info-purple) with the matching solid
  text. Premium = purple pill `--sc-purple-100` bg + `--sc-purple-800` text + small icon.

### 6.9 Toasts & notifications (sonner)
- Position top-right (desktop) / top-center (mobile). bg `--bg-card`, border `--border-default`,
  `--shadow-dropdown`, radius 12px. Variants: success (green icon), error (danger icon), info
  (purple icon), warning (amber). Auto-dismiss 4s; errors stay until dismissed. Concise copy.

### 6.10 Popups / modals / dropdowns / popovers
- **Modal:** centered, max-width by purpose (sm 420 / md 560 / lg 720), bg `--bg-modal`, radius
  16px, `--shadow-modal`; overlay `--bg-overlay` (dark, ~50% — readable). Title H3, close button
  top-right, primary action bottom-right, cancel as ghost.
- **Dropdown/popover:** bg `--bg-card`, border `--border-default`, `--shadow-dropdown`, radius 8–12px,
  item hover `--sc-gray-100`. `scaleIn`/`slideDown` animation.

### 6.11 Headers (page headers)
- H1/H2 `--text-heading` + optional secondary description; right-aligned primary action.
  Consistent top padding; breadcrumb (if any) in `--text-secondary`.

### 6.12 Footers
- bg `--sc-gray-50`, border-top `--border-default`, muted `--text-secondary` links, logo,
  legal links, social icons. Generous vertical padding.

### 6.13 Empty / coming-soon states
- Centered icon (muted purple), heading, one-line explanation, optional primary CTA. Used for
  Network's Events/Groups/Newsletters until built — must look intentional, never broken.

### 6.14 Full pages
- Consistent shell: sidebar + topbar + content. Content max-width centered, 24–32px gutters,
  section rhythm per §6.4. Loading = skeletons (shimmer), not spinners-on-blank where possible.

---

## 7. Iconography
- `lucide-react` (primary) consistent stroke 1.5–2px, size 16/20/24. `react-icons` only for brand
  logos (GitHub, LinkedIn, etc.). Icons inherit text color; never multicolor in product chrome.

---

## 8. Accessibility
- WCAG AA minimum. Visible focus everywhere. All interactive elements keyboard-reachable.
- `aria-label` on icon-only controls. Form errors announced. Color never the sole signal.
- Hit targets ≥ 40×40px on touch.

---

## 9. Danger zones
- Destructive actions: danger color + explicit confirm modal restating consequences. Place away
  from primary actions. Never auto-focus a destructive button.

---

## 10. Governance & implementation
- **Tokens live in `src/app/globals.css`** (`@theme` + `:root`). This doc documents them; when a
  value changes, update both.
- **Migration debt (Round 2):** (a) delete/replace the deprecated `@theme` indigo/cyan/blue
  brand tokens; (b) replace hardcoded `zinc-950`/`slate-900`/`text-white` blocks
  (feed composer, notification panel, profile overlays) with semantic tokens; (c) unify all
  primary buttons to `--sc-purple-600`.
- **Rule of thumb for contributors:** if you're about to type a raw hex or a Tailwind color like
  `blue-500`/`indigo-600` in product UI, stop — use a semantic token instead.
