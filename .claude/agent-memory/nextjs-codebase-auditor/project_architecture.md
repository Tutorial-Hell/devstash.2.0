---
name: dstash project architecture
description: Core architecture, routing pattern, auth state, and data access patterns for the dstash Next.js codebase
type: project
---

App Router project using Next.js 16.2 with React 19 and TypeScript. Database is Neon (Postgres) via Prisma 7 using the `@prisma/adapter-pg` driver adapter. UI components are built on @base-ui/react primitives styled with Tailwind CSS v4.

**Key architectural facts:**
- No authentication layer is implemented yet — all data access uses `getDemoUserId()` which does a DB lookup for `demo@devstash.io` hardcoded in source
- The sidebar still imports `mockUser` from `src/lib/mock-data.ts` for the user area display (name, email, avatar) even though real data now flows from the DB for item types and collections
- `src/lib/mock-data.ts` is a development-only file not yet fully retired; it is imported in production code paths
- No API routes exist yet — all data fetching is in Server Components / Server Actions
- `next.config.ts` has `reactCompiler: true` enabled but no security headers configured
- The `prisma/seed.ts` stores the demo user's bcrypt password hash in `Account.access_token` (credentials provider hack) — not using a proper NextAuth credentials callback
- `iconMap` is duplicated between `src/app/(dashboard)/dashboard/page.tsx` and `src/components/layout/sidebar.tsx`
- `formatDate` is defined inline in the dashboard page rather than in a shared util
- The `getCollections` query is called twice per dashboard page load: once in the layout (`getDashboardLayout`) and once in the page itself

**Why:** App is in early development; auth and multi-user support are planned but not yet implemented.
**How to apply:** Frame audit findings with awareness that auth scaffolding exists in the schema but no NextAuth runtime is wired up yet. Do not flag absence of auth middleware — flag the hardcoded demo user bypass that will ship to production if left in.
