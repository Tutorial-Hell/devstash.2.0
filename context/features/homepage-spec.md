# App Homepage

## Status: Completed — 2026-04-18

## Overview

Convert the static prototype at `prototypes/homepage/` into the real Next.js app homepage at `src/app/page.tsx`. Use Tailwind + ShadCN throughout. Match the prototype's visual design and section structure.

## Requirements

### Routing

| Button / Link       | Destination            |
| ------------------- | ---------------------- |
| Sign In             | `/sign-in`             |
| Get Started / Free  | `/register`            |
| Features anchor     | `#features` (same page)|
| Pricing anchor      | `#pricing` (same page) |
| Footer product links | anchor or `#` for now |
| Footer company/legal | `#` for now           |

### Sections (top to bottom)

1. **Navbar** — fixed, frosted glass on scroll, mobile hamburger with overlay
2. **Hero** — headline + CTAs on the left, chaos canvas + arrow + dashboard mockup on the right
3. **Features** — 6-card grid
4. **AI Section** — 2-column: checklist left, code mockup right
5. **Pricing** — Free / Pro cards with monthly/yearly toggle
6. **CTA** — single centered call-to-action
7. **Footer** — logo, link columns, copyright year

## Component Breakdown

### Server Components (default)

- `src/app/page.tsx` — root page, imports all section components
- `src/components/marketing/hero-section.tsx` — static text + layout shell; canvas and arrow are client islands
- `src/components/marketing/features-section.tsx` — static 6-card grid
- `src/components/marketing/ai-section.tsx` — static two-column layout with code mockup
- `src/components/marketing/cta-section.tsx` — static centered CTA
- `src/components/marketing/footer.tsx` — static footer with dynamic year via `new Date().getFullYear()`

### Client Components (`"use client"`)

- `src/components/marketing/navbar.tsx` — scroll opacity + mobile menu state
- `src/components/marketing/chaos-canvas.tsx` — `requestAnimationFrame` animation, mouse repulsion
- `src/components/marketing/pricing-section.tsx` — billing toggle state (monthly/yearly)

## Styling

- Dark theme matching prototype: page bg `#0a0a0f`, features section bg `#0f0f1a`
- Use Tailwind utilities wherever possible; inline styles only for dynamic CSS custom properties (accent colors per item type)
- Item type accent colors as Tailwind arbitrary values: snippet `[#3b82f6]`, prompt `[#f59e0b]`, command `[#06b6d4]`, note `[#22c55e]`, file `[#64748b]`, image `[#ec4899]`, link `[#6366f1]`
- Hero gradient headline: CSS `bg-clip-text` with `bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]`
- Use ShadCN `Button` for all CTAs (variant `default` for primary, `ghost` for secondary, `outline` for outline style)
- Scroll fade-in: use `IntersectionObserver` in a `useFadeIn` hook or a reusable `FadeIn` client wrapper component — gate initial hidden state on a `js-ready` body class to keep no-JS safe

## Navbar

- Fixed position, `z-50`, transparent by default
- On scroll > 20px: `bg-background/95 backdrop-blur border-b`
- Mobile hamburger: slides in a menu panel from the top; overlay behind it closes on click
- Logo: ⚡ DevStash — links to `/`

## Chaos Canvas (`chaos-canvas.tsx`)

Port the canvas animation from `prototypes/homepage/script.js` directly into a React component using `useRef` + `useEffect`. Key behavior:
- 8 emoji icons float, bounce off walls, subtle rotation + scale pulse
- Mouse repulsion: radius 80, force 0.6, speed cap 3, friction 0.98
- `ResizeObserver` to handle container size changes
- Canvas height: 220px, width fills container minus 32px padding

## Dashboard Mockup

Static JSX in `hero-section.tsx`. Render the sidebar nav items and 6 item cards with colored top borders and type chips using Tailwind. No interactivity needed.

## Pricing Section

- Monthly default; yearly toggle shows `$6` and "billed $72/year" note
- Use a `useState` boolean for `isYearly`
- ShadCN doesn't have a toggle switch built-in — use a plain `<input type="checkbox">` with Tailwind styling (matching prototype) or ShadCN `Switch`

## Notes

- All marketing components live under `src/components/marketing/` — do not mix with dashboard components
- `page.tsx` at the root is already a server component — keep it that way; only import client components where needed
- No auth checks on this page — it is fully public
- Footer year must be dynamic (not hardcoded)
- Keep components focused: one section per file
