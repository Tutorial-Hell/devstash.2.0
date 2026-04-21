# Stripe Integration - Phase 1: Core Infrastructure

## Overview

Install Stripe, create the client singleton, replace the demo user helper with real session auth, expose `isPro` in the JWT/session, and add a tested usage-limits module. No Stripe CLI or live webhook events required for this phase.

## Requirements

- Install `stripe` npm package
- Create `src/lib/stripe.ts` singleton
- Create `src/lib/auth-utils.ts` with `getAuthenticatedUserId()` replacing `getDemoUserId()`
- Replace all `getDemoUserId()` calls with `getAuthenticatedUserId()` across server actions and API routes
- Sync `isPro` from DB on every JWT validation in `src/auth.ts`
- Extend NextAuth session/JWT types with `isPro`
- Create `src/lib/usage-limits.ts` with limit constants and helpers
- Write unit tests for `usage-limits.ts`

## Files to Create

1. `src/lib/stripe.ts` — Stripe client singleton
2. `src/lib/auth-utils.ts` — `getAuthenticatedUserId()` helper
3. `src/lib/usage-limits.ts` — limit constants and check helpers
4. `src/lib/usage-limits.test.ts` — unit tests
5. `src/types/next-auth.d.ts` — augment Session and JWT with `isPro`

## Files to Modify

| File | Change |
|---|---|
| `src/auth.ts` | Add DB sync for `isPro` in JWT callback; add `session` callback to expose it |
| `src/lib/db/collections.ts` | Remove `getDemoUserId`; update imports |
| `src/actions/items.ts` | Replace `getDemoUserId()` → `getAuthenticatedUserId()` (lines 38, 180) |
| `src/actions/collections.ts` | Replace `getDemoUserId()` → `getAuthenticatedUserId()` (lines 50, 73, 97, 115, 130) |
| `src/actions/settings.ts` | Replace `getDemoUserId()` → `getAuthenticatedUserId()` |
| `src/app/api/upload/route.ts` | Replace `getDemoUserId()` → `getAuthenticatedUserId()` (line 34) |
| `src/app/api/items/[id]/route.ts` | Replace `getDemoUserId()` → `getAuthenticatedUserId()` |
| `src/app/api/download/[id]/route.ts` | Replace `getDemoUserId()` → `getAuthenticatedUserId()` |
| `.env.example` | Add `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY` |

## Implementation Details

### Stripe Singleton (`src/lib/stripe.ts`)

```typescript
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
})
```

### Auth Helper (`src/lib/auth-utils.ts`)

```typescript
import { auth } from "@/auth"

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
```

### JWT/Session Callbacks (`src/auth.ts`)

Always sync `isPro` from DB in `jwt` callback so webhook updates surface on the next page load without requiring an explicit `update()` call:

```typescript
async jwt({ token, user }) {
  if (user?.id) token.sub = user.id
  if (token.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { isPro: true },
    })
    token.isPro = dbUser?.isPro ?? false
  }
  return token
},
session({ session, token }) {
  if (token.sub) session.user.id = token.sub
  if (typeof token.isPro === "boolean") session.user.isPro = token.isPro
  return session
},
```

### Usage Limits Module (`src/lib/usage-limits.ts`)

Export constants and pure async helpers so feature gating logic is centralized and testable:

```typescript
export const FREE_ITEM_LIMIT = 50
export const FREE_COLLECTION_LIMIT = 3

export async function isAtItemLimit(userId: string): Promise<boolean>
export async function isAtCollectionLimit(userId: string): Promise<boolean>
```

### Unit Tests (`src/lib/usage-limits.test.ts`)

Mock Prisma and verify:
- Returns `false` when count is below limit
- Returns `true` when count equals limit
- Returns `true` when count exceeds limit (data-integrity guard)
- Correct limit constants are used

## Key Gotchas

- `getDemoUserId()` is currently the only user source for all server actions — replacing it will break nothing structurally, but every action will now return an auth error if the user is not signed in. Verify no unauthenticated paths depend on it.
- The JWT callback fires on every session check, so the DB read in `jwt` adds one query per request. This is acceptable for now; cache if it becomes a bottleneck.
- Keep `getDemoUserId` in place for seeding/demo purposes if needed — just remove all call sites in production server actions.

## Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=
```

## Testing

1. Sign in as a real user (not demo)
2. Confirm all dashboard actions (create item, create collection, upload) work without errors
3. Confirm unauthenticated requests to those actions return auth errors
4. Run unit tests: `npm test src/lib/usage-limits.test.ts`
5. Check `session.user.isPro` is present (and `false`) after signing in
