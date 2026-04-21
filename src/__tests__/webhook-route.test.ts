import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { POST } from "@/app/api/stripe/webhook/route"

function makeRequest(body: string, sig: string | null): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (sig !== null) headers["stripe-signature"] = sig
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers,
  })
}

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_123",
    status: "active",
    metadata: { userId: "user-1" },
    ...overrides,
  }
}

function makeEvent(type: string, object: unknown) {
  return { type, data: { object } }
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.mocked(stripe.webhooks.constructEvent).mockReset()
    vi.mocked(prisma.user.update).mockReset()
    vi.mocked(prisma.user.updateMany).mockReset()
  })

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await POST(makeRequest("{}", null))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing stripe-signature/i)
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled()
  })

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("invalid signature")
    })

    const res = await POST(makeRequest("{}", "bad-sig"))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Invalid signature")
  })

  it("sets isPro=true on subscription.created", async () => {
    const sub = makeSubscription()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("customer.subscription.created", sub) as any
    )

    const res = await POST(makeRequest("{}", "sig"))

    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isPro: true, stripeSubscriptionId: "sub_123" },
    })
  })

  it("sets isPro=true on subscription.updated when status is active", async () => {
    const sub = makeSubscription({ status: "active" })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("customer.subscription.updated", sub) as any
    )

    await POST(makeRequest("{}", "sig"))

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isPro: true }) })
    )
  })

  it("sets isPro=true on subscription.updated when status is trialing", async () => {
    const sub = makeSubscription({ status: "trialing" })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("customer.subscription.updated", sub) as any
    )

    await POST(makeRequest("{}", "sig"))

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isPro: true }) })
    )
  })

  it("sets isPro=false on subscription.updated when status is canceled", async () => {
    const sub = makeSubscription({ status: "canceled" })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("customer.subscription.updated", sub) as any
    )

    await POST(makeRequest("{}", "sig"))

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isPro: false }) })
    )
  })

  it("sets isPro=false on subscription.deleted", async () => {
    const sub = makeSubscription()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("customer.subscription.deleted", sub) as any
    )

    await POST(makeRequest("{}", "sig"))

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isPro: false, stripeSubscriptionId: null },
    })
  })

  it("skips DB update when subscription has no userId in metadata", async () => {
    const sub = makeSubscription({ metadata: {} })
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("customer.subscription.created", sub) as any
    )

    const res = await POST(makeRequest("{}", "sig"))

    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("sets isPro=false by customerId on invoice.payment_failed", async () => {
    const invoice = { customer: "cus_abc" }
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("invoice.payment_failed", invoice) as any
    )

    const res = await POST(makeRequest("{}", "sig"))

    expect(res.status).toBe(200)
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_abc" },
      data: { isPro: false },
    })
  })

  it("handles invoice.payment_failed when customer is an object", async () => {
    const invoice = { customer: { id: "cus_xyz" } }
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("invoice.payment_failed", invoice) as any
    )

    await POST(makeRequest("{}", "sig"))

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCustomerId: "cus_xyz" } })
    )
  })

  it("returns 200 received:true for unhandled event types", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      makeEvent("payment_intent.succeeded", {}) as any
    )

    const res = await POST(makeRequest("{}", "sig"))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ received: true })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
