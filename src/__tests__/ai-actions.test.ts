import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth-utils", () => ({
  requireProUser: vi.fn(),
}))

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: vi.fn(),
  AI_MODEL: "gpt-5-nano",
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitErrorMessage: vi.fn((mins: number) => `Too many attempts. Please try again in ${mins} minutes.`),
}))

import { requireProUser } from "@/lib/auth-utils"
import { getOpenAIClient } from "@/lib/openai"
import { rateLimit } from "@/lib/rate-limit"
import { generateAutoTags, generateDescription, explainCode, optimizePrompt } from "@/actions/ai"

const mockClient = {
  responses: {
    create: vi.fn(),
  },
}

const proAuth = { ok: true as const, userId: "user-1", session: { user: { id: "user-1", isPro: true } } }

describe("generateAutoTags", () => {
  beforeEach(() => {
    vi.mocked(requireProUser).mockReset()
    vi.mocked(getOpenAIClient).mockReturnValue(mockClient as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: true })
    mockClient.responses.create.mockReset()
  })

  it("returns not-authenticated error when no session", async () => {
    vi.mocked(requireProUser).mockResolvedValue({ ok: false, error: "Not authenticated." })

    const result = await generateAutoTags({ title: "Test", type: "snippet" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
  })

  it("returns Pro gate error for free users", async () => {
    vi.mocked(requireProUser).mockResolvedValue({
      ok: false,
      error: "AI tag suggestions are a Pro feature. Upgrade to use them.",
    })

    const result = await generateAutoTags({ title: "Test", type: "snippet" })

    expect(result).toEqual({
      success: false,
      error: "AI tag suggestions are a Pro feature. Upgrade to use them.",
    })
  })

  it("returns rate limit error when limit exceeded", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: false, retryAfterMinutes: 30 })

    const result = await generateAutoTags({ title: "Test", type: "snippet" })

    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toContain("30 minutes")
  })

  it("returns tags from AI when response contains {tags: [...]} shape", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["React", "Hooks", "TypeScript"] }),
    })

    const result = await generateAutoTags({ title: "useDebounce Hook", type: "snippet" })

    expect(result).toEqual({ success: true, tags: ["react", "hooks", "typescript"] })
  })

  it("returns tags when AI response is a bare array", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify(["Docker", "DevOps", "CLI"]),
    })

    const result = await generateAutoTags({ title: "Docker compose up", type: "command" })

    expect(result).toEqual({ success: true, tags: ["docker", "devops", "cli"] })
  })

  it("returns error when AI response is invalid JSON", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "not-json" })

    const result = await generateAutoTags({ title: "Test", type: "note" })

    expect(result).toEqual({ success: false, error: "AI returned an unexpected response." })
  })

  it("returns error when OpenAI client throws", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockRejectedValue(new Error("network error"))

    const result = await generateAutoTags({ title: "Test", type: "note" })

    expect(result).toEqual({ success: false, error: "AI service error. Please try again." })
  })

  it("truncates content to 2000 chars before API call", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
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
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["a", "b", "c", "d", "e", "f", "g"] }),
    })

    const result = await generateAutoTags({ title: "Test", type: "note" })

    expect(result.success).toBe(true)
    expect((result as { success: true; tags: string[] }).tags).toHaveLength(5)
  })
})

describe("generateDescription", () => {
  beforeEach(() => {
    vi.mocked(requireProUser).mockReset()
    vi.mocked(getOpenAIClient).mockReturnValue(mockClient as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: true })
    mockClient.responses.create.mockReset()
  })

  it("returns not-authenticated error when no session", async () => {
    vi.mocked(requireProUser).mockResolvedValue({ ok: false, error: "Not authenticated." })

    const result = await generateDescription({ title: "Test", type: "snippet" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
  })

  it("returns Pro gate error for free users", async () => {
    vi.mocked(requireProUser).mockResolvedValue({
      ok: false,
      error: "AI description generation is a Pro feature. Upgrade to use it.",
    })

    const result = await generateDescription({ title: "Test", type: "snippet" })

    expect(result).toEqual({
      success: false,
      error: "AI description generation is a Pro feature. Upgrade to use it.",
    })
  })

  it("returns rate limit error when limit exceeded", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: false, retryAfterMinutes: 45 })

    const result = await generateDescription({ title: "Test", type: "snippet" })

    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toContain("45 minutes")
  })

  it("returns generated description on success", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: "A custom React hook that delays state updates by a configurable amount.",
    })

    const result = await generateDescription({ title: "useDebounce", type: "snippet", content: "function useDebounce..." })

    expect(result).toEqual({
      success: true,
      description: "A custom React hook that delays state updates by a configurable amount.",
    })
  })

  it("sends url in context for link type", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "A useful resource." })

    await generateDescription({ title: "MDN Docs", type: "link", url: "https://developer.mozilla.org" })

    const callArg = mockClient.responses.create.mock.calls[0][0]
    expect(callArg.input).toContain("https://developer.mozilla.org")
  })

  it("truncates content to 2000 chars before API call", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "Some description." })

    const longContent = "x".repeat(5000)
    await generateDescription({ title: "Test", type: "note", content: longContent })

    const callArg = mockClient.responses.create.mock.calls[0][0]
    expect(callArg.input).toContain("x".repeat(2000))
    expect(callArg.input).not.toContain("x".repeat(2001))
  })

  it("returns error when OpenAI client throws", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockRejectedValue(new Error("timeout"))

    const result = await generateDescription({ title: "Test", type: "note" })

    expect(result).toEqual({ success: false, error: "AI service error. Please try again." })
  })

  it("returns error when output_text is empty", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "   " })

    const result = await generateDescription({ title: "Test", type: "note" })

    expect(result).toEqual({ success: false, error: "AI returned an empty response." })
  })
})

describe("explainCode", () => {
  beforeEach(() => {
    vi.mocked(requireProUser).mockReset()
    vi.mocked(getOpenAIClient).mockReturnValue(mockClient as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: true })
    mockClient.responses.create.mockReset()
  })

  it("returns not-authenticated error when no session", async () => {
    vi.mocked(requireProUser).mockResolvedValue({ ok: false, error: "Not authenticated." })

    const result = await explainCode({ content: "console.log('hi')", type: "snippet" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
  })

  it("returns Pro gate error for free users", async () => {
    vi.mocked(requireProUser).mockResolvedValue({
      ok: false,
      error: "AI code explanation is a Pro feature. Upgrade to use it.",
    })

    const result = await explainCode({ content: "console.log('hi')", type: "snippet" })

    expect(result).toEqual({
      success: false,
      error: "AI code explanation is a Pro feature. Upgrade to use it.",
    })
  })

  it("returns rate limit error when limit exceeded", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: false, retryAfterMinutes: 20 })

    const result = await explainCode({ content: "console.log('hi')", type: "snippet" })

    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toContain("20 minutes")
  })

  it("returns explanation on success", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: "This snippet logs 'hi' to the console using `console.log`.",
    })

    const result = await explainCode({ content: "console.log('hi')", type: "snippet" })

    expect(result).toEqual({
      success: true,
      explanation: "This snippet logs 'hi' to the console using `console.log`.",
    })
  })

  it("includes language in the prompt when provided", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "An explanation." })

    await explainCode({ content: "echo hello", type: "command", language: "shell" })

    const callArg = mockClient.responses.create.mock.calls[0][0]
    expect(callArg.input).toContain("Language: shell")
  })

  it("truncates content to 2000 chars before API call", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "An explanation." })

    const longContent = "z".repeat(5000)
    await explainCode({ content: longContent, type: "snippet" })

    const callArg = mockClient.responses.create.mock.calls[0][0]
    expect(callArg.input).toContain("z".repeat(2000))
    expect(callArg.input).not.toContain("z".repeat(2001))
  })

  it("returns error when output_text is empty", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "   " })

    const result = await explainCode({ content: "some code", type: "snippet" })

    expect(result).toEqual({ success: false, error: "AI returned an empty response." })
  })

  it("returns error when OpenAI client throws", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockRejectedValue(new Error("timeout"))

    const result = await explainCode({ content: "some code", type: "snippet" })

    expect(result).toEqual({ success: false, error: "AI service error. Please try again." })
  })
})

describe("optimizePrompt", () => {
  beforeEach(() => {
    vi.mocked(requireProUser).mockReset()
    vi.mocked(getOpenAIClient).mockReturnValue(mockClient as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: true })
    mockClient.responses.create.mockReset()
  })

  it("returns not-authenticated error when no session", async () => {
    vi.mocked(requireProUser).mockResolvedValue({ ok: false, error: "Not authenticated." })

    const result = await optimizePrompt({ content: "Write a summary of this article." })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
  })

  it("returns Pro gate error for free users", async () => {
    vi.mocked(requireProUser).mockResolvedValue({
      ok: false,
      error: "AI prompt optimization is a Pro feature. Upgrade to use it.",
    })

    const result = await optimizePrompt({ content: "Write a summary of this article." })

    expect(result).toEqual({
      success: false,
      error: "AI prompt optimization is a Pro feature. Upgrade to use it.",
    })
  })

  it("returns rate limit error when limit exceeded", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    vi.mocked(rateLimit).mockResolvedValue({ success: false, retryAfterMinutes: 15 })

    const result = await optimizePrompt({ content: "Write a summary." })

    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toContain("15 minutes")
  })

  it("returns optimized content on success", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({
      output_text: "Please provide a concise, structured summary of the following article, highlighting the main argument and key supporting points.",
    })

    const result = await optimizePrompt({ content: "Write a summary of this article." })

    expect(result).toEqual({
      success: true,
      optimizedContent: "Please provide a concise, structured summary of the following article, highlighting the main argument and key supporting points.",
    })
  })

  it("truncates content to 3000 chars before API call", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "Optimized prompt." })

    const longContent = "x".repeat(5000)
    await optimizePrompt({ content: longContent })

    const callArg = mockClient.responses.create.mock.calls[0][0]
    expect(callArg.input).toContain("x".repeat(3000))
    expect(callArg.input).not.toContain("x".repeat(3001))
  })

  it("returns error when output_text is empty", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockResolvedValue({ output_text: "   " })

    const result = await optimizePrompt({ content: "Some prompt." })

    expect(result).toEqual({ success: false, error: "AI returned an empty response." })
  })

  it("returns error when OpenAI client throws", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)
    mockClient.responses.create.mockRejectedValue(new Error("network error"))

    const result = await optimizePrompt({ content: "Some prompt." })

    expect(result).toEqual({ success: false, error: "AI service error. Please try again." })
  })

  it("returns validation error when content is empty", async () => {
    vi.mocked(requireProUser).mockResolvedValue(proAuth as never)

    const result = await optimizePrompt({ content: "   " })

    expect(result).toEqual({ success: false, error: "Content is required" })
  })
})
