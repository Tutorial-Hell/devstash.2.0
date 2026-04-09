import { describe, it, expect } from "vitest"
import { normalizeLanguage } from "@/lib/utils"

describe("normalizeLanguage", () => {
  it("passes through known Monaco language IDs unchanged", () => {
    expect(normalizeLanguage("javascript")).toBe("javascript")
    expect(normalizeLanguage("python")).toBe("python")
    expect(normalizeLanguage("typescript")).toBe("typescript")
  })

  it("maps common short aliases", () => {
    expect(normalizeLanguage("js")).toBe("javascript")
    expect(normalizeLanguage("ts")).toBe("typescript")
    expect(normalizeLanguage("py")).toBe("python")
    expect(normalizeLanguage("rb")).toBe("ruby")
  })

  it("maps JSX/TSX to their base language", () => {
    expect(normalizeLanguage("jsx")).toBe("javascript")
    expect(normalizeLanguage("tsx")).toBe("typescript")
  })

  it("maps shell aliases to shell", () => {
    expect(normalizeLanguage("sh")).toBe("shell")
    expect(normalizeLanguage("bash")).toBe("shell")
    expect(normalizeLanguage("zsh")).toBe("shell")
  })

  it("maps yml to yaml", () => {
    expect(normalizeLanguage("yml")).toBe("yaml")
  })

  it("maps md to markdown", () => {
    expect(normalizeLanguage("md")).toBe("markdown")
  })

  it("is case-insensitive", () => {
    expect(normalizeLanguage("JS")).toBe("javascript")
    expect(normalizeLanguage("TypeScript")).toBe("typescript")
    expect(normalizeLanguage("BASH")).toBe("shell")
  })

  it("passes through unknown languages as-is (lowercased)", () => {
    expect(normalizeLanguage("rust")).toBe("rust")
    expect(normalizeLanguage("Go")).toBe("go")
    expect(normalizeLanguage("COBOL")).toBe("cobol")
  })

  it("handles empty string", () => {
    expect(normalizeLanguage("")).toBe("")
  })
})
