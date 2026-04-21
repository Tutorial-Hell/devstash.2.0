# Stripe Integration - Phase 2: Webhooks, Feature Gating & Billing UI

## Overview

Add Stripe API routes (checkout, billing portal, webhook), enforce free-tier limits on items/collections/uploads, and build the billing section in the settings page. Requires Stripe CLI for webhook testing.

## Prerequisites

- Phase 1 complete: `stripe` installed, `isPro` in session, `getAuthenticatedUserId()` in place, `usage-limits.ts` module present

## Requirements

- Checkout API route: create or reuse Stripe customer, return checkout URL
- Billing portal API route: redirect Pro users to Stripe's hosted portal
- Webhook handler: update `isPro` and `stripeSubscriptionId` in DB on subscription events
- Feature gating on `createItem`, `createCollection`, and the upload API route
- Server actions for checkout and portal (called from client components)
- Billing tab/section in settings page showing plan status, usage, and upgrade CTAs
- Middleware must NOT protect `/api/stripe/webhook`

## Files to Create

1. `src/app/api/stripe/checkout/route.ts` — create Stripe checkout session
2. `src/app/api/stripe/portal/route.ts` — open Stripe billing portal
3. `src/app/api/stripe/webhook/route.ts` — handle Stripe webhook events
4. `src/actions/subscription.ts` — server actions wrapping checkout/portal routes
5. `src/components/settings/billing-section.tsx` — billing UI component

## Files to Modify

| File | Change |
|---|---|
| `src/actions/items.ts` | Add item limit gate using `usage-limits.ts` |
| `src/actions/collections.ts` | Add collection limit gate using `usage-limits.ts` |
| `src/app/api/upload/route.ts` | Add Pro-only gate (return 403 for free users) |
| `src/app/(dashboard)/settings/page.tsx` | Add Billing tab; render `<BillingSection />` |
| `src/middleware.ts` | Ensure `/api/stripe/webhook` is excluded from auth protection |

## Implementation Details

### Checkout Route (`src/app/api/stripe/checkout/route.ts`)

- Require authenticated session; return 401 if missing
- Accept `priceId` in request body; return 400 if missing
- Look up user's `stripeCustomerId`; create Stripe customer if none exists and persist to DB
- Create checkout session with `mode: "subscription"`, set `subscription_data.metadata.userId`
- `success_url`: `/settings?tab=billing&success=true`
- `cancel_url`: `/settings?tab=billing`
- Return `{ url: checkoutSession.url }`

### Billing Portal Route (`src/app/api/stripe/portal/route.ts`)

- Require authenticated session; return 401 if missing
- Look up `stripeCustomerId`; return 400 if not found
- Create portal session with `return_url`: `/settings?tab=billing`
- Return `{ url: portalSession.url }`

### Webhook Handler (`src/app/api/stripe/webhook/route.ts`)

Read raw body with `req.text()`. Verify signature with `stripe.webhooks.constructEvent`. Return 400 on missing or invalid signature.

Handle these events:

| Event | Action |
|---|---|
| `customer.subscription.created` | Set `isPro = true`, save `stripeSubscriptionId` |
| `customer.subscription.updated` | Set `isPro` based on `active`/`trialing` status, save `stripeSubscriptionId` |
| `customer.subscription.deleted` | Set `isPro = false`, clear `stripeSubscriptionId` |
| `invoice.payment_failed` | Set `isPro = false` by `stripeCustomerId` |

Use `subscription.metadata.userId` to look up the user. If `userId` is missing from metadata, skip the update.

Add at module level to disable Next.js body parsing:
```typescript
export const config = { api: { bodyParser: false } }
```

### Feature Gating — Items (`src/actions/items.ts`)

In `createItem()`, after auth check:
```typescript
if (!session.user.isPro) {
  const atLimit = await isAtItemLimit(userId)
  if (atLimit) return { success: false, error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items." }
}
```

### Feature Gating — Collections (`src/actions/collections.ts`)

In `createCollection()`, after auth check:
```typescript
if (!session.user.isPro) {
  const atLimit = await isAtCollectionLimit(userId)
  if (atLimit) return { success: false, error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited collections." }
}
```

### Feature Gating — Uploads (`src/app/api/upload/route.ts`)

After auth check:
```typescript
if (!session.user.isPro) {
  return NextResponse.json({ error: "File uploads require a Pro plan." }, { status: 403 })
}
```

### Server Actions (`src/actions/subscription.ts`)

Two thin server actions that call the API routes internally:
- `createCheckoutSession(priceId: string)` → `{ url: string | null; error?: string }`
- `createBillingPortalSession()` → `{ url: string | null; error?: string }`

Both require an authenticated session and return early with an error if not signed in.

### Billing Section (`src/components/settings/billing-section.tsx`)

Client component using `useSession()`:

**Free user view:**
- "You are on the Free plan"
- Usage summary: `X / 50 items`, `X / 3 collections`
- Two upgrade buttons: Monthly ($8/mo) and Yearly ($72/yr)
- Buttons call `createCheckoutSession` with the appropriate `NEXT_PUBLIC_STRIPE_PRICE_ID_*` and redirect to the returned URL

**Pro user view:**
- "You are on the Pro plan"
- "Manage Billing" button calls `createBillingPortalSession` and redirects

Both states show a loading state on the active button while the async action is in-flight.

## Middleware Check

`src/middleware.ts` must not match `/api/stripe/webhook`. Verify the matcher pattern explicitly excludes it, e.g.:

```typescript
export const config = {
  matcher: ["/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)"],
}
```

## Environment Variables

```
STRIPE_WEBHOOK_SECRET=whsec_...         # from Stripe CLI or Dashboard
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...
```

## Stripe Dashboard Setup (one-time)

1. Create product "DevStash Pro" with two prices: $8/month and $72/year
2. Copy price IDs to `.env`
3. Configure webhook endpoint (`/api/stripe/webhook`) and subscribe to the four events listed above
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`
5. Enable Customer Portal in Stripe Dashboard → Billing → Customer Portal

## Testing

### Local Webhook Forwarding (required for all webhook tests)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`.

### Webhook Tests

- [ ] Trigger `customer.subscription.created` → DB `isPro = true`
- [ ] Trigger `customer.subscription.updated` (status=`canceled`) → DB `isPro = false`
- [ ] Trigger `customer.subscription.deleted` → DB `isPro = false`, `stripeSubscriptionId = null`
- [ ] Trigger `invoice.payment_failed` → DB `isPro = false`
- [ ] Invalid signature → returns 400

### Checkout Flow

- [ ] Free user clicks "Upgrade Monthly" → redirects to Stripe hosted checkout
- [ ] Complete with test card `4242 4242 4242 4242`
- [ ] Redirected to `/settings?tab=billing&success=true`
- [ ] Page reload shows Pro plan UI
- [ ] DB has `stripeCustomerId` and `stripeSubscriptionId`

### Feature Gates

- [ ] Free user at 50 items: `createItem` returns limit error
- [ ] Pro user: can create item 51+
- [ ] Free user at 3 collections: `createCollection` returns limit error
- [ ] Pro user: can create collection 4+
- [ ] Free user: upload returns 403
- [ ] Pro user: upload succeeds

### Billing Portal

- [ ] Pro user clicks "Manage Billing" → opens Stripe portal
- [ ] Cancel subscription in portal → webhook fires → `isPro = false` in DB
- [ ] Page reload shows Free plan UI

### Session Sync

- [ ] Webhook sets `isPro = true` in DB → page reload → session shows Pro (no manual `update()` needed)
