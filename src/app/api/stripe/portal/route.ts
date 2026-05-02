import { requireAuth } from "@/lib/auth-utils"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { apiError, apiSuccess } from "@/lib/api-response"

export async function POST(_req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) return apiError("No billing account found", 400)

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
  })

  return apiSuccess({ url: portalSession.url })
}
