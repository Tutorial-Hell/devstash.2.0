import { requireAuth } from "@/lib/auth-utils"
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe"
import { apiError, apiSuccess } from "@/lib/api-response"

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => ({}))
  const { priceId } = body
  if (!priceId) return apiError("priceId is required", 400)

  const customerId = await getOrCreateStripeCustomer(auth.userId)
  if (!customerId) return apiError("User not found", 404)

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { userId: auth.userId } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
  })

  return apiSuccess({ url: checkoutSession.url })
}
