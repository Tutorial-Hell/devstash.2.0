import { describe, it, expect } from "vitest"
import { z } from "zod"
import { safeParse } from "@/lib/validation"

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  age: z.number().int().min(0, "Age must be non-negative"),
})

describe("safeParse", () => {
  it("returns ok:true with parsed data for valid input", () => {
    const result = safeParse(schema, { name: "Alice", age: 30 })

    expect(result).toEqual({ ok: true, data: { name: "Alice", age: 30 } })
  })

  it("returns ok:false with first error message for invalid input", () => {
    const result = safeParse(schema, { name: "", age: 30 })

    expect(result).toEqual({ ok: false, error: "Name is required" })
  })

  it("returns ok:false with fallback message when issues is empty", () => {
    const emptySchema = z.object({}).superRefine((_, ctx) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "" })
    })

    const result = safeParse(emptySchema, {})

    expect(result.ok).toBe(false)
  })

  it("reports the first issue when multiple fields are invalid", () => {
    const result = safeParse(schema, { name: "", age: -5 })

    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toBe("Name is required")
  })

  it("trims whitespace on string fields per schema rules", () => {
    const result = safeParse(schema, { name: "   ", age: 1 })

    expect(result).toEqual({ ok: false, error: "Name is required" })
  })

})
