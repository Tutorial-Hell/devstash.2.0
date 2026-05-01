import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/auth"
import { requireProUser } from "@/lib/auth-utils"

describe("requireProUser", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset()
  })

  it("returns ok:false with 'Not authenticated.' when session is null", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const result = await requireProUser()

    expect(result).toEqual({ ok: false, error: "Not authenticated." })
  })

  it("returns ok:false with 'Not authenticated.' when session has no user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as never)

    const result = await requireProUser()

    expect(result).toEqual({ ok: false, error: "Not authenticated." })
  })

  it("returns ok:false with default Pro message when user is not Pro", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", isPro: false } } as never)

    const result = await requireProUser()

    expect(result).toEqual({
      ok: false,
      error: "This feature requires a Pro subscription.",
    })
  })

  it("returns ok:false with custom Pro message when provided", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", isPro: false } } as never)

    const result = await requireProUser("AI features are Pro-only. Upgrade to continue.")

    expect(result).toEqual({
      ok: false,
      error: "AI features are Pro-only. Upgrade to continue.",
    })
  })

  it("returns ok:true with userId and session when user is Pro", async () => {
    const session = { user: { id: "user-1", isPro: true } }
    vi.mocked(auth).mockResolvedValue(session as never)

    const result = await requireProUser()

    expect(result).toEqual({ ok: true, userId: "user-1", session })
  })
})
