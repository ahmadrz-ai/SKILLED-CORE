# SkilledCore — V1 Dark Design Archive

This directory contains the **original dark cyberpunk/premium dark design** for the SkilledCore landing page.

It was archived (hibernated) on 2026-05-03 when the platform was redesigned to the **Modern SaaS** aesthetic.

## How to Restore the Old Design

**Step 1:** In `src/app/page.tsx`, change the import:
```tsx
// FROM:
import LandingContent from "@/components/landing-v2/LandingContent";

// TO:
import LandingContent from "@/components/landing-v1-dark/LandingContent";
```

**Step 2:** In `src/app/layout.tsx`, restore the dark class and ParticleBackground:
```tsx
// Add dark class back to html:
<html lang="en" className="dark" suppressHydrationWarning>

// Add back ParticleBackground import:
import { ParticleBackground } from "@/components/landing-v1-dark/ParticleBackground";

// Add in body before SessionWrapper:
<ParticleBackground />

// Update themeColor in viewport export:
themeColor: "#09090b"
```

**Step 3:** In `src/app/globals.css`, the old dark variables are saved in:
`src/app/globals-v1-dark.css` — replace globals.css content with that file.

**Step 4:** In `src/app/(app)/layout.tsx`, revert the main div class back to dark.

## Design Tokens (Old Dark Design)
- Background: `#09090b` (obsidian)
- Primary: `#7c3aed` (violet)
- Secondary: `#14b8a6` (teal-data)
- Font heading: Cinzel (serif)
- Glass panels: `rgba(24,24,27,0.6)` with backdrop-blur
- Effects: 3D particle background, framer-motion scroll parallax, orbiting particles
