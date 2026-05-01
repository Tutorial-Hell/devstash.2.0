import { z } from "zod"

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function safeParse<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid input." }
  }
  return { ok: true, data: result.data }
}
