# Stripe Subscription Integration Plan

## Overview

DevStash Pro — $8/month or $72/year ($6/month).

The schema already has `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` on the User model, and Stripe env vars (including test keys) are already configured. The main work is: wiring the Stripe API, adding webhook handling, gating features, and surfacing subscription UI.

---

## Current State

| Area | Status |
|---|---|
| Prisma schema fields (`isPro`, `stripeCustomerId`, `stripeSubscriptionId`) | ✅ Ready |
| Stripe env vars in `.env.example` | ✅ Ready |
| Stripe test keys in `.env` | ✅ In place |
| `stripe` npm package | ❌ Not installed |
| Checkout / billing server actions | ❌ Missing |
| Webhook handler | ❌ Missing |
| Feature gating (item/collection limits, upload gate) | ❌ Missing |
| `isPro` in session | ❌ Missing |
| Billing UI on settings page | ❌ Missing |

**Also note:** All server actions currently use `getDemoUserId()` (hardcoded to `demo@devstash.io`). This must be replaced with real session auth before feature gating is meaningful.

---

## Implementation Order

1. [Install `stripe` package](#1-install-stripe-package)
2. [Create Stripe client singleton](#2-stripe-client-singleton)
3. [Fix auth — real session in server actions](#3-fix-session-auth-in-server-actions)
4. [Add `isPro` to the JWT/session](#4-add-ispro-to-session)
5. [Checkout API route](#5-checkout-api-route)
6. [Billing portal API route](#6-billing-portal-api-route)
7. [Webhook handler](#7-webhook-handler)
8. [Feature gating — items](#8-feature-gating--items)
9. [Feature gating — collections](#9-feature-gating--collections)
10. [Feature gating — file uploads](#10-feature-gating--file-uploads)
11. [Billing settings page](#11-billing-settings-page)
12. [Stripe Dashboard setup](#12-stripe-dashboard-setup)
13. [Testing checklist](#13-testing-checklist)

---

## 1. Install Stripe Package

```bash
npm install stripe
```

---

## 2. Stripe Client Singleton

**Create:** `src/lib/stripe.ts`

```typescript
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
})
```

---

## 3. Fix Session Auth in Server Actions

**Context:** `getDemoUserId()` in `src/lib/db/collections.ts:316` is hardcoded to `demo@devstash.io`. All server actions import and call it. This needs to become the real authenticated user.

**Modify:** `src/lib/db/collections.ts` — replace `getDemoUserId` with a real auth helper:

```typescript
// Remove getDemoUserId entirely, or keep it only for demo/seeding purposes.
// Add this to src/lib/auth-utils.ts (new file):
import { auth } from "@/auth"

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
```

Then do a find-and-replace in all server actions and API routes:
- `getDemoUserId()` → `getAuthenticatedUserId()`
- Update imports accordingly

**Files to update:**
- `src/actions/items.ts` (lines 38, 180)
- `src/actions/collections.ts` (lines 50, 73, 97, 115, 130)
- `src/actions/settings.ts`
- `src/app/api/upload/route.ts` (line 34)
- `src/app/api/items/[id]/route.ts`
- `src/app/api/download/[id]/route.ts`

---

## 4. Add `isPro` to Session

**Modify:** `src/auth.ts`

Apply the pattern from the research notes — always sync `isPro` from DB on every token validation so webhook updates are picked up on the next page load.

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/flags"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id

      // Always sync isPro from DB so webhook updates surface on next session validation
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
  },
  providers: [ /* same as before */ ],
})
```

**Extend the session type** — modify or create `src/types/next-auth.d.ts`:

```typescript
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isPro: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean
  }
}
```

---

## 5. Checkout API Route

**Create:** `src/app/api/stripe/checkout/route.ts`

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { priceId } = await req.json()
  if (!priceId) {
    return NextResponse.json({ error: "priceId required" }, { status: 400 })
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  })

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
```

---

## 6. Billing Portal API Route

**Create:** `src/app/api/stripe/portal/route.ts`

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
```

---

## 7. Webhook Handler

**Create:** `src/app/api/stripe/webhook/route.ts`

This is the critical piece — it updates `isPro`, `stripeSubscriptionId` in the database in response to Stripe events.

```typescript
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      if (!userId) break

      const isActive = ["active", "trialing"].includes(subscription.status)
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPro: isActive,
          stripeSubscriptionId: subscription.id,
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.userId
      if (!userId) break

      await prisma.user.update({
        where: { id: userId },
        data: { isPro: false, stripeSubscriptionId: null },
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { isPro: false },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}

// Stripe requires the raw body — disable Next.js body parsing
export const config = { api: { bodyParser: false } }
```

**Important:** The webhook route must not be protected by NextAuth middleware. Verify `src/middleware.ts` does not match `/api/stripe/webhook`.

---

## 8. Feature Gating — Items

**Modify:** `src/actions/items.ts` — `createItem()` function

```typescript
export async function createItem(
  input: CreateItemInput
): Promise<{ success: true; data: ItemDetail } | { success: false; error: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: "Not authenticated." }

  // Enforce free tier item limit
  if (!session.user.isPro) {
    const itemCount = await prisma.item.count({ where: { userId } })
    if (itemCount >= 50) {
      return {
        success: false,
        error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items.",
      }
    }
  }

  // ... rest of existing logic unchanged
}
```

---

## 9. Feature Gating — Collections

**Modify:** `src/actions/collections.ts` — `createCollection()` function

```typescript
export async function createCollection(
  input: CreateCollectionInput
): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { success: false, error: "Not authenticated." }

  if (!session.user.isPro) {
    const collectionCount = await prisma.collection.count({ where: { userId } })
    if (collectionCount >= 3) {
      return {
        success: false,
        error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited collections.",
      }
    }
  }

  // ... rest of existing logic unchanged
}
```

---

## 10. Feature Gating — File Uploads

**Modify:** `src/app/api/upload/route.ts`

```typescript
export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // File/image uploads are Pro-only
  if (!session.user.isPro) {
    return NextResponse.json(
      { error: "File uploads require a Pro plan. Upgrade to unlock this feature." },
      { status: 403 }
    )
  }

  // ... rest of existing logic unchanged
}
```

---

## 11. Billing Settings Page

### New server action: `src/actions/subscription.ts`

```typescript
"use server"

import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function createCheckoutSession(priceId: string): Promise<{ url: string | null; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { url: null, error: "Not authenticated." }

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  })
  const data = await res.json()
  return { url: data.url ?? null, error: data.error }
}

export async function createBillingPortalSession(): Promise<{ url: string | null; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { url: null, error: "Not authenticated." }

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/portal`, {
    method: "POST",
  })
  const data = await res.json()
  return { url: data.url ?? null, error: data.error }
}
```

### Billing tab in settings

**Modify:** `src/app/(dashboard)/settings/page.tsx` — add a Billing tab/section.

The billing section should show:
- Current plan (Free / Pro)
- For Free users: pricing cards with upgrade CTAs linking to checkout
- For Pro users: next billing date, "Manage Billing" button (opens Stripe portal)
- Usage summary (X/50 items, X/3 collections) for free users

Example billing section component sketch:

```typescript
// src/components/settings/billing-section.tsx
"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { createCheckoutSession, createBillingPortalSession } from "@/actions/subscription"

export function BillingSection() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(priceId: string) {
    setLoading(true)
    const { url, error } = await createCheckoutSession(priceId)
    if (url) window.location.href = url
    setLoading(false)
  }

  async function handleManageBilling() {
    setLoading(true)
    const { url } = await createBillingPortalSession()
    if (url) window.location.href = url
    setLoading(false)
  }

  if (session?.user.isPro) {
    return (
      <div>
        <p>You are on the <strong>Pro</strong> plan.</p>
        <button onClick={handleManageBilling} disabled={loading}>
          Manage Billing
        </button>
      </div>
    )
  }

  return (
    <div>
      <p>You are on the <strong>Free</strong> plan.</p>
      <button
        onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!)}
        disabled={loading}
      >
        Upgrade Monthly — $8/mo
      </button>
      <button
        onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!)}
        disabled={loading}
      >
        Upgrade Yearly — $72/yr
      </button>
    </div>
  )
}
```

**Add to `.env.example`:**
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=""
```

---

## 12. Stripe Dashboard Setup

1. **Create Products & Prices**
   - Product: "DevStash Pro"
   - Price 1: $8.00/month recurring → copy ID to `STRIPE_PRICE_ID_MONTHLY`
   - Price 2: $72.00/year recurring → copy ID to `STRIPE_PRICE_ID_YEARLY`

2. **Configure Webhook Endpoint**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Enable Billing Portal**
   - Stripe Dashboard → Billing → Customer Portal → Activate
   - Configure allowed actions (cancel, change plan)

4. **Local Development Webhook Forwarding**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   This gives a local `STRIPE_WEBHOOK_SECRET` for `.env`.

---

## 13. Files to Create

| File | Purpose |
|---|---|
| `src/lib/stripe.ts` | Stripe client singleton |
| `src/lib/auth-utils.ts` | `getAuthenticatedUserId()` replacing demo helper |
| `src/app/api/stripe/checkout/route.ts` | Create Stripe checkout session |
| `src/app/api/stripe/portal/route.ts` | Open Stripe billing portal |
| `src/app/api/stripe/webhook/route.ts` | Handle Stripe webhook events |
| `src/actions/subscription.ts` | Server actions for checkout/portal |
| `src/components/settings/billing-section.tsx` | Billing UI component |
| `src/types/next-auth.d.ts` | Augment session types with `isPro` |

## Files to Modify

| File | Change |
|---|---|
| `src/auth.ts` | Add DB sync for `isPro` in JWT callback |
| `src/lib/db/collections.ts` | Remove/replace `getDemoUserId` |
| `src/actions/items.ts` | Use real auth; add item limit gate |
| `src/actions/collections.ts` | Use real auth; add collection limit gate |
| `src/actions/settings.ts` | Use real auth |
| `src/app/api/upload/route.ts` | Use real auth; add Pro-only gate |
| `src/app/api/items/[id]/route.ts` | Use real auth |
| `src/app/api/download/[id]/route.ts` | Use real auth |
| `src/app/(dashboard)/settings/page.tsx` | Add billing tab/section |
| `src/middleware.ts` | Ensure `/api/stripe/webhook` is not protected |
| `.env.example` | Add `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PRICE_ID_*` |
| `src/lib/db/profile.ts` | Optionally add `isPro` to `ProfileData` return |

---

## 14. Testing Checklist

### Webhook Testing (local)
- [ ] Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Trigger `customer.subscription.created` — verify `isPro = true` in DB
- [ ] Trigger `customer.subscription.deleted` — verify `isPro = false` in DB
- [ ] Trigger `invoice.payment_failed` — verify `isPro = false` in DB
- [ ] Verify invalid signature returns 400

### Checkout Flow
- [ ] Free user clicks upgrade → redirected to Stripe checkout
- [ ] Complete checkout with Stripe test card `4242 4242 4242 4242`
- [ ] Redirected to `/settings?tab=billing&success=true`
- [ ] After redirect, session shows `isPro = true` (page reload picks it up)
- [ ] Stripe customer ID and subscription ID written to DB

### Feature Gates
- [ ] Free user at 50 items: `createItem` returns limit error
- [ ] Pro user: can create item 51+
- [ ] Free user at 3 collections: `createCollection` returns limit error
- [ ] Pro user: can create collection 4+
- [ ] Free user: upload endpoint returns 403
- [ ] Pro user: upload succeeds

### Billing Portal
- [ ] Pro user clicks "Manage Billing" → redirected to Stripe portal
- [ ] Cancel subscription in portal → webhook fires → `isPro = false` in DB
- [ ] After reload, UI shows Free plan

### Session Sync
- [ ] Webhook updates `isPro = true` → reload page → session shows Pro
- [ ] No additional client-side `update()` call needed
