"use server"

import { z } from "zod"
import { getAuthenticatedUserId, getSession } from "@/lib/auth-utils"
import { updateItemById, deleteItemById, createItemInDb, toggleItemFavoriteById, toggleItemPinnedById, type ItemDetail } from "@/lib/db/items"
import { deleteFromR2 } from "@/lib/r2"
import { isAtItemLimit } from "@/lib/usage-limits"

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
  collectionIds: z.array(z.string()).optional(),
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
  const userId = await getAuthenticatedUserId()

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
    collectionIds: parsed.data.collectionIds,
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
  const userId = await getAuthenticatedUserId()

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

// ─── Toggle Favorite ──────────────────────────────────────────────────────────

export async function toggleItemFavorite(
  itemId: string
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const result = await toggleItemFavoriteById(userId, itemId)
  if (!result) {
    return { success: false, error: "Item not found or access denied." }
  }

  return { success: true, isFavorite: result.isFavorite }
}

// ─── Toggle Pin ───────────────────────────────────────────────────────────────

export async function toggleItemPin(
  itemId: string
): Promise<{ success: true; isPinned: boolean } | { success: false; error: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const result = await toggleItemPinnedById(userId, itemId)
  if (!result) {
    return { success: false, error: "Item not found or access denied." }
  }

  return { success: true, isPinned: result.isPinned }
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
    collectionIds: z.array(z.string()).optional(),
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
  collectionIds?: string[]
}

export async function createItem(
  input: CreateItemInput
): Promise<{ success: true; data: ItemDetail } | { success: false; error: string }> {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  if (!session?.user?.isPro) {
    const atLimit = await isAtItemLimit(userId)
    if (atLimit) {
      return { success: false, error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items." }
    }
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
    collectionIds: parsed.data.collectionIds,
  })

  if (!item) {
    return { success: false, error: "Invalid item type." }
  }

  return { success: true, data: item }
}
