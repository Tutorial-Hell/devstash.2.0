"use server"

import { z } from "zod"
import { getDemoUserId } from "@/lib/db/collections"
import { updateItemById, deleteItemById, createItemInDb, type ItemDetail } from "@/lib/db/items"
import { deleteFromR2 } from "@/lib/r2"

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

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteItem(
  itemId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await getDemoUserId()

  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const result = await deleteItemById(userId, itemId)
  if (!result.deleted) {
    return { success: false, error: "Item not found or access denied." }
  }

  if (result.fileKey) {
    await deleteFromR2(result.fileKey).catch(console.error)
  }

  return { success: true }
}

// ─── Create ───────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["snippet", "prompt", "command", "note", "link", "file", "image"] as const
type ItemTypeName = (typeof ITEM_TYPES)[number]

const createItemSchema = z
  .object({
    type: z.enum(ITEM_TYPES),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().nullable().optional().transform((v) => v ?? null),
    content: z.string().nullable().optional().transform((v) => v ?? null),
    url: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : (v ?? null))),
    fileUrl: z.string().nullable().optional().transform((v) => v ?? null),
    fileName: z.string().nullable().optional().transform((v) => v ?? null),
    fileSize: z.number().nullable().optional().transform((v) => v ?? null),
    language: z.string().trim().nullable().optional().transform((v) => v ?? null),
    tags: z.array(z.string().trim().min(1)).default([]),
  })
  .refine((d) => d.type !== "link" || (d.url != null && d.url.length > 0), {
    message: "URL is required for link items",
    path: ["url"],
  })
  .refine((d) => d.type !== "link" || /^https?:\/\/.+/.test(d.url ?? ""), {
    message: "Invalid URL",
    path: ["url"],
  })
  .refine((d) => !["file", "image"].includes(d.type) || d.fileUrl != null, {
    message: "A file must be uploaded",
    path: ["fileUrl"],
  })

export type CreateItemInput = {
  type: ItemTypeName
  title: string
  description?: string | null
  content?: string | null
  url?: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  language?: string | null
  tags?: string[]
}

export async function createItem(
  input: CreateItemInput
): Promise<{ success: true; data: ItemDetail } | { success: false; error: string }> {
  const userId = await getDemoUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const parsed = createItemSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? "Invalid input." }
  }

  const item = await createItemInDb(userId, {
    typeName: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    content: parsed.data.content ?? null,
    url: parsed.data.url ?? null,
    fileUrl: parsed.data.fileUrl ?? null,
    fileName: parsed.data.fileName ?? null,
    fileSize: parsed.data.fileSize ?? null,
    language: parsed.data.language ?? null,
    tags: parsed.data.tags,
  })

  if (!item) {
    return { success: false, error: "Invalid item type." }
  }

  return { success: true, data: item }
}
