import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth-utils", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: vi.fn(),
  AI_MODEL: "gpt-5-nano",
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitErrorMessage: vi.fn((mins: number) => `Too many attempts. Please try again in ${mins} minutes.`),
}))

import { getSession } from "@/lib/auth-utils"
import { getOpenAIClient } from "@/lib/openai"
import { rateLimit } from "@/lib/rate-limit"
import { generateAutoTags } from "@/actions/ai"

const mockClient = {
  responses: {
    create: vi.fn(),
  },
}

describe("generateAutoTags", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset()
    vi.mocked(getOpenAIClient).mockReturnValue(mockClient as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: true })
    mockClient.responses.create.mockReset()
  })

  it("returns not-authenticated error when no session", async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const result = await generateAutoTags({ title: "Test", type: "snippet" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
  })

  it("returns Pro gate error for free users", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: false },
    } as never)

    const result = await generateAutoTags({ title: "Test", type: "snippet" })

    expect(result).toEqual({
      success: false,
      error: "AI tag suggestions are a Pro feature. Upgrade to use them.",
    })
  })

  it("returns rate limit error when limit exceeded", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: false, retryAfterMinutes: 30 })

    const result = await generateAutoTags({ title: "Test", type: "snippet" })

    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toContain("30 minutes")
  })

  it("returns tags from AI when response contains {tags: [...]} shape", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["React", "Hooks", "TypeScript"] }),
    })

    const result = await generateAutoTags({ title: "useDebounce Hook", type: "snippet" })

    expect(result).toEqual({ success: true, tags: ["react", "hooks", "typescript"] })
  })

  it("returns tags when AI response is a bare array", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify(["Docker", "DevOps", "CLI"]),
    })

    const result = await generateAutoTags({ title: "Docker compose up", type: "command" })

    expect(result).toEqual({ success: true, tags: ["docker", "devops", "cli"] })
  })

  it("returns error when AI response is invalid JSON", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "not-json" })

    const result = await generateAutoTags({ title: "Test", type: "note" })

    expect(result).toEqual({ success: false, error: "AI returned an unexpected response." })
  })

  it("returns error when OpenAI client throws", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    mockClient.responses.create.mockRejectedValue(new Error("network error"))

    const result = await generateAutoTags({ title: "Test", type: "note" })

    expect(result).toEqual({ success: false, error: "AI service error. Please try again." })
  })

  it("truncates content to 2000 chars before API call", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["tag"] }),
    })

    const longContent = "a".repeat(5000)
    await generateAutoTags({ title: "Test", content: longContent, type: "snippet" })

    const callArg = mockClient.responses.create.mock.calls[0][0]
    expect(callArg.input).toContain("a".repeat(2000))
    expect(callArg.input).not.toContain("a".repeat(2001))
  })

  it("caps results at 5 tags", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", isPro: true },
    } as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["a", "b", "c", "d", "e", "f", "g"] }),
    })

    const result = await generateAutoTags({ title: "Test", type: "note" })

    expect(result.success).toBe(true)
    expect((result as { success: true; tags: string[] }).tags).toHaveLength(5)
  })
})
