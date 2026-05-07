---
name: dstash project architecture
description: Core architecture, auth model, data access, and key patterns for the dstash Next.js codebase (updated 2026-04-25)
type: project
---

Next.js 16.2, React 19, TypeScript throughout. App Router. Prisma 7 with `@prisma/adapter-pg` against PostgreSQL (Neon). UI on ShadCN / @base-ui/react + Tailwind v4. Storage on Cloudflare R2 via AWS S3 SDK. Stripe for subscriptions (free/pro). Monaco + react-markdown editors.

**Auth**: next-auth v5 beta. Prisma adapter, JWT strategy. GitHub OAuth + Credentials provider. Email verification via `EmailVerificationToken` table. Password reset via `VerificationToken` table. Rate limiting via Upstash Redis (fails open when not configured). `auth.config.ts` holds a stub Credentials provider used by middleware; full logic in `src/auth.ts`. The previous demo-user bypass has been removed — all data paths now use real `auth()` / `getAuthenticatedUserId()`.

**Authorization pattern**: All server actions call `getAuthenticatedUserId()` or `getSession()` first. DB functions scope queries with `where: { userId }`. API routes call `getAuthenticatedUserId()` inline.

**Stripe**: Two paths — server action (`src/actions/subscription.ts`) and API route (`src/app/api/stripe/checkout/route.ts`, `portal/route.ts`). Webhook verified with `stripe.webhooks.constructEvent`.

**Key issues found in 2026-04-25 audit**:
- `updateEditorPreferences` (`src/actions/settings.ts`) accepts `Partial<EditorPreferences>` without Zod schema validation — arbitrary JSON shapes are merged into user record
- `getAllItemsForSearch` fetches ALL user items on every dashboard layout render with no limit
- `getItemTypes` uses `include: { items: { where: { userId } } }` — loads all item IDs to count in-process; should use `_count`
- `getCollections` (full collection list) is called in dashboard layout on every navigation, then sliced client-side — should paginate or limit server-side
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) runs 4 parallel DB queries on every page render including `getAllItemsForSearch` which fetches unbounded items
- No CSP (Content-Security-Policy) header in next.config.ts — Monaco/CDN loads make this harder but still worth configuring
- Rate limiter fails open (returns success:true) when Upstash not configured — acceptable for dev but must not deploy to prod without it configured
- `registerAction` (`src/app/(auth)/register/actions.ts`) has no email format validation, no name length cap, no rate limiting
- `Content-Disposition` download header uses correct RFC 5987 `filename*=UTF-8''` encoding — OK
- `react-markdown` renders user-supplied markdown without explicit `rehype-sanitize` — relies on react-markdown's default escaping (no dangerouslySetInnerHTML misuse found)
- `NewItemDialog` and `ItemDrawerEdit` both duplicate the full form field layout for the same item types — refactor opportunity
- `collectionIds` passed from client to `createItem`/`updateItem` server actions are not validated to belong to the calling user — IDOR risk

**Key file locations**:
- Auth: `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`
- Server actions: `src/actions/items.ts`, `src/actions/collections.ts`, `src/actions/subscription.ts`, `src/actions/settings.ts`
- Auth form actions: `src/app/(auth)/sign-in/actions.ts`, `src/app/(auth)/register/actions.ts`, `src/app/(auth)/forgot-password/actions.ts`, `src/app/(auth)/reset-password/actions.ts`
- DB layer: `src/lib/db/items.ts`, `src/lib/db/collections.ts`, `src/lib/db/profile.ts`
- API routes: `src/app/api/upload/route.ts`, `src/app/api/download/[id]/route.ts`, `src/app/api/items/[id]/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/portal/route.ts`, `src/app/api/auth/verify-email/route.ts`

**Why:** Updated audit snapshot 2026-04-25. Previous demo-user bypass is gone.
**How to apply:** Use for context on future audits, feature work, or security reviews.
