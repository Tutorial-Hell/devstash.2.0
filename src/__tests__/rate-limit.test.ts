import { describe, it, expect, vi, beforeEach } from "vitest"

// Must mock next/headers before importing rate-limit
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}))

import { headers } from "next/headers"
import { getClientIp, rateLimitErrorMessage } from "@/lib/rate-limit"

describe("rateLimitErrorMessage", () => {
  it("uses singular 'minute' for 1 minute", () => {
    expect(rateLimitErrorMessage(1)).toBe(
      "Too many attempts. Please try again in 1 minute."
    )
  })

  it("uses plural 'minutes' for > 1 minute", () => {
    expect(rateLimitErrorMessage(5)).toBe(
      "Too many attempts. Please try again in 5 minutes."
    )
  })
})

describe("getClientIp", () => {
  it("reads x-forwarded-for from a Request object", async () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    })
    expect(await getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip from a Request object", async () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.9.9.9" },
    })
    expect(await getClientIp(req)).toBe("9.9.9.9")
  })

  it("returns 'unknown' when no IP headers on Request", async () => {
    const req = new Request("http://localhost")
    expect(await getClientIp(req)).toBe("unknown")
  })

  describe("server action path (no Request)", () => {
    beforeEach(() => {
      vi.mocked(headers).mockReset()
    })

    it("reads x-forwarded-for from next/headers", async () => {
      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => (key === "x-forwarded-for" ? "10.0.0.1" : null),
      } as never)
      expect(await getClientIp()).toBe("10.0.0.1")
    })

    it("falls back to x-real-ip from next/headers", async () => {
      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => (key === "x-real-ip" ? "10.0.0.2" : null),
      } as never)
      expect(await getClientIp()).toBe("10.0.0.2")
    })

    it("returns 'unknown' when no IP headers in next/headers", async () => {
      vi.mocked(headers).mockResolvedValue({
        get: () => null,
      } as never)
      expect(await getClientIp()).toBe("unknown")
    })
  })
})
