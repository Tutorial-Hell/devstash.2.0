"use server"

import { z } from "zod"
import {
  createCollectionInDb,
  updateCollectionById,
  deleteCollectionById,
  getCollectionsForSelect,
  toggleCollectionFavoriteById,
  type CollectionCreated,
  type CollectionOption,
} from "@/lib/db/collections"
import { getAuthenticatedUserId, getSession } from "@/lib/auth-utils"
import { isAtCollectionLimit } from "@/lib/usage-limits"

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
  const userId = await getAuthenticatedUserId()
  if (!userId) return []
  return getCollectionsForSelect(userId)
}

export async function createCollection(
  input: CreateCollectionInput
): Promise<ActionResult> {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  if (!session?.user?.isPro) {
    const atLimit = await isAtCollectionLimit(userId)
    if (atLimit) {
      return { success: false, error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited collections." }
    }
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
  const userId = await getAuthenticatedUserId()
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

export async function toggleCollectionFavorite(
  collectionId: string
): Promise<{ success: true; isFavorite: boolean } | { success: false; error: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const result = await toggleCollectionFavoriteById(userId, collectionId)
  if (!result) {
    return { success: false, error: "Collection not found or access denied." }
  }

  return { success: true, isFavorite: result.isFavorite }
}

export async function deleteCollection(
  collectionId: string
): Promise<DeleteResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: "Not authenticated." }
  }

  const deleted = await deleteCollectionById(userId, collectionId)
  if (!deleted) {
    return { success: false, error: "Collection not found." }
  }

  return { success: true }
}
