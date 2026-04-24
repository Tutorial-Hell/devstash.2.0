"use server"

import { headers } from "next/headers"
import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

async function getAppUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("your-production-domain")) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  // Derive from request headers when env var is missing or placeholder
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const proto = host.startsWith("localhost") ? "http" : "https"
  return `${proto}://${host}`
}

export async function createCheckoutSession(
  planKey: "monthly" | "yearly"
): Promise<{ url: string | null; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { url: null, error: "Not authenticated." }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  })
  if (!user) return { url: null, error: "User not found." }

  const priceId =
    planKey === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY

  if (!priceId) return { url: null, error: "Price ID is not configured." }

  try {
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      })
    }

    const appUrl = await getAppUrl()
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing`,
    })

    return { url: checkoutSession.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error"
    console.error("[createCheckoutSession]", message)
    return { url: null, error: message }
  }
}

export async function createBillingPortalSession(): Promise<{ url: string | null; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { url: null, error: "Not authenticated." }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return { url: null, error: "No billing account found." }
  }

  try {
    const appUrl = await getAppUrl()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/settings?tab=billing`,
    })

    return { url: portalSession.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error"
    console.error("[createBillingPortalSession]", message)
    return { url: null, error: message }
  }
}
