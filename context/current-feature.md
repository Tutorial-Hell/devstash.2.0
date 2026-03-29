# Current Feature

## Dashboard Loading Skeletons

## Status
In Progress

## Goals

Add skeleton loading states to the dashboard using Next.js `loading.tsx` and ShadCN's Skeleton component so users see structured placeholders instead of a blank screen while server data fetches.

1. **Install ShadCN Skeleton** — run `npx shadcn@latest add skeleton` to add `src/components/ui/skeleton.tsx`
2. **Create `loading.tsx`** at `src/app/(dashboard)/dashboard/loading.tsx` — Next.js will automatically render this while `page.tsx` is streaming. It should mirror the dashboard layout with skeletons for:
   - 4 stats cards (icon placeholder + two lines of text)
   - Collections grid (6 cards with accent bar + title + meta lines)
   - Pinned items section (2–3 item row skeletons)
   - Recent items section (10 row skeletons with icon, title, tags, date)
3. ~~**Sidebar skeleton**~~ — Removed. Full sidebar streaming requires a context refactor to decouple `isOpen`/`mobileOpen` client state from the data-fetching path — deferred to the auth refactor phase.

## Notes

- ShadCN Skeleton is a simple `<div>` with a pulse animation — no logic changes, purely additive.
- `loading.tsx` is a Next.js App Router convention: it wraps the page in an automatic `<Suspense>` boundary. No changes needed to `page.tsx` itself.
- Match the skeleton dimensions closely to the real content to avoid layout shift when data loads.
- If any schema changes are required, run `npx prisma migrate dev --name <description>` locally and commit the generated migration file. For production, run `npx prisma migrate deploy`. Never use `prisma db push` in production.

## History

<!-- Keep this updated. Earliest to latest. -->

- **2026-03-20** — Initial Next.js 16 + Tailwind CSS v4 setup. Cleaned up default boilerplate, added CLAUDE.md and context files. Committed and pushed to origin.
- **2026-03-23** — Dashboard Phase 1: ShadCN initialized (Tailwind v4), Button/Input components added, dark mode enabled by default, dashboard route at /dashboard, layout with topbar (search + New Item button) and sidebar/main placeholders.
- **2026-03-24** — Dashboard Phase 2 completed: collapsible sidebar with item types (links to /items/TYPE), favorite and all-collections sections, user avatar area at bottom, mobile drawer, and sidebar toggle in topbar.
- **2026-03-24** — Dashboard Phase 3 completed: main content area with 4 stats cards (items/blue, collections/purple, favorite items/yellow star, favorite collections/red heart), collections grid with dominant-type accent bars, pinned items section, and 10 most recent items.
- **2026-03-24** — Beginning Prisma + Neon PostgreSQL setup.
- **2026-03-25** — Prisma + Neon PostgreSQL setup completed. Installed Prisma 7 with pg adapter, configured prisma.config.ts, defined full schema (User, Item, ItemType, Collection, ItemCollection, Tag + NextAuth models). Ran initial migration (20260326015745_init). Seeded 7 system item types (snippet, prompt, command, note, file, image, link). Added scripts/test-db.ts for connection and data verification.
- **2026-03-25** — Seed data completed. Added bcryptjs, rewrote prisma/seed.ts to create demo user (demo@devstash.io), re-seed system item types, and populate 5 collections with 14 items: React Patterns (3 snippets), AI Workflows (3 prompts), DevOps (1 snippet, 1 command, 2 links), Terminal Commands (4 commands), Design Resources (4 links).
- **2026-03-25** — Dashboard Collections completed. Created `src/lib/db/collections.ts` with `getCollections` and `getDemoUserId` functions. Updated dashboard page to async server component fetching real collections from Neon DB via Prisma. Collection cards now show dominant-type accent bar and icons for all content types present in the collection. Collections and Favorite Collections stats derive from real data.
- **2026-03-26** — Dashboard Items completed. Created `src/lib/db/items.ts` with `getPinnedItems`, `getRecentItems`, and `getItemStats` functions. Dashboard page now fetches all data in parallel; pinned section hidden when no pinned items; item cards derive icon/border color from itemType; tags from DB relations; all four stats cards fully real.
- **2026-03-26** — Stats & Sidebar completed. Added `getItemTypes` to `src/lib/db/items.ts`. Converted dashboard layout to a server component; extracted client state into `DashboardShell`. Sidebar now receives real DB data as props: system item types with per-user counts linking to `/items/[typename]`, favorite collections with star icons, other collections with dominant-type colored circle, and a "View all collections" link. Seed data updated so React Patterns and AI Workflows are favorite collections, and useDebounce Hook and Code Review Prompt are favorite items.
- **2026-03-29** — Add Pro Badge to Sidebar completed. Installed ShadCN Badge component (`src/components/ui/badge.tsx`). Added a subtle secondary-variant PRO badge to the files and images item types in the sidebar, rendered only when the sidebar is expanded.
- **2026-03-29** — Code Quality Quick Wins completed. Removed unused Image import (`page.tsx`); added DATABASE_URL runtime guard (`prisma.ts`); added HTTP security headers to `next.config.ts`; wrapped `getCollections` and `getItemTypes` with `React.cache()` to deduplicate layout/page queries; extracted `iconMap` to `src/lib/icon-map.ts`; moved `formatDate` to `src/lib/utils.ts`; disabled inert Settings button with `aria-disabled`.
