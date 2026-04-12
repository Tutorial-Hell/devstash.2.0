"use server"

import { z } from "zod"
import {
  getDemoUserId,
  createCollectionInDb,
  updateCollectionById,
  deleteCollectionById,
  getCollectionsForSelect,
  type CollectionCreated,
  type CollectionOption,
} from "@/lib/db/collections"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
})

export type CreateCollectionInput = {
  name: string
  description?: string
}

type ActionResult =
  | { success: true; data: CollectionCreated }
  | { success: false; error: string }

type DeleteResult =
  | { success: true }
  | { success: false; error: string }

// ─── Action ───────────────────────────────────────────────────────────────────

export async function fetchCollectionsForSelect(): Promise<CollectionOption[]> {
  const userId = await getDemoUserId()
  if (!userId) return []
  return getCollectionsForSelect(userId)
}

export async function createCollection(
  input: CreateCollectionInput
): Promise<ActionResult> {
  const userId = await getDemoUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const parsed = collectionSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? "Invalid input." }
  }

  const collection = await createCollectionInDb(userId, {
    name: parsed.data.name,
    description: parsed.data.description,
  })

  return { success: true, data: collection }
}

export async function updateCollection(
  collectionId: string,
  input: { name: string; description?: string }
): Promise<ActionResult> {
  const userId = await getDemoUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const parsed = collectionSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? "Invalid input." }
  }

  const collection = await updateCollectionById(userId, collectionId, {
    name: parsed.data.name,
    description: parsed.data.description,
  })

  if (!collection) {
    return { success: false, error: "Collection not found." }
  }

  return { success: true, data: collection }
}

export async function deleteCollection(
  collectionId: string
): Promise<DeleteResult> {
  const userId = await getDemoUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const deleted = await deleteCollectionById(userId, collectionId)
  if (!deleted) {
    return { success: false, error: "Collection not found." }
  }

  return { success: true }
}
