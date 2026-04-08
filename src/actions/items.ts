"use server"

import { z } from "zod"
import { getDemoUserId } from "@/lib/db/collections"
import { updateItemById, type ItemDetail } from "@/lib/db/items"

// ─── Schema ───────────────────────────────────────────────────────────────────

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullable().optional().transform((v) => v ?? null),
  content: z.string().nullable().optional().transform((v) => v ?? null),
  url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v ?? null))
    .pipe(z.string().url("Invalid URL").nullable()),
  language: z.string().trim().nullable().optional().transform((v) => v ?? null),
  tags: z.array(z.string().trim().min(1)).default([]),
})

export type UpdateItemInput = z.input<typeof updateItemSchema>

type ActionResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string }

// ─── Action ───────────────────────────────────────────────────────────────────

export async function updateItem(
  itemId: string,
  input: UpdateItemInput
): Promise<ActionResult> {
  const userId = await getDemoUserId()

  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const parsed = updateItemSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? "Invalid input." }
  }

  const updated = await updateItemById(userId, itemId, {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    content: parsed.data.content ?? null,
    url: parsed.data.url ?? null,
    language: parsed.data.language ?? null,
    tags: parsed.data.tags,
  })

  if (!updated) {
    return { success: false, error: "Item not found or access denied." }
  }

  return { success: true, data: updated }
}
