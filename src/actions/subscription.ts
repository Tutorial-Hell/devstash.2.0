"use server"

import { headers } from "next/headers"
import { auth } from "@/auth"
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

async function getAppUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl?.startsWith("http")) return envUrl.replace(/\/$/, "")

  const headersList = await headers()
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000"
  const proto =
    headersList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export async function createCheckoutSession(
  planKey: "monthly" | "yearly"
): Promise<{ url: string | null; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { url: null, error: "Not authenticated." }

  const userId = session.user.id

  const priceId =
    planKey === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY

  if (!priceId) return { url: null, error: "Price ID is not configured." }

  try {
    const customerId = await getOrCreateStripeCustomer(userId)
    if (!customerId) return { url: null, error: "User not found." }

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
