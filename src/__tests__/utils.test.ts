import { describe, it, expect } from "vitest"
import { cn, formatDate } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("resolves tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar")
  })
})

describe("formatDate", () => {
  it("formats a date as short month and day", () => {
    const date = new Date("2026-04-07T00:00:00Z")
    const result = formatDate(date)
    // locale-dependent but format is always "Mon D"
    expect(result).toMatch(/^[A-Z][a-z]+\s\d+$/)
  })

  it("includes the correct month abbreviation", () => {
    const date = new Date("2026-01-15T00:00:00Z")
    expect(formatDate(date)).toContain("Jan")
  })

  it("includes the correct day", () => {
    const date = new Date("2026-06-03T12:00:00Z")
    expect(formatDate(date)).toContain("3")
  })
})
