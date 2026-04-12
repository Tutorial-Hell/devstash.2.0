"use server"

import { z } from "zod"
import {
  getDemoUserId,
  createCollectionInDb,
  getCollectionsForSelect,
  type CollectionCreated,
  type CollectionOption,
} from "@/lib/db/collections"

// ─── Schema ───────────────────────────────────────────────────────────────────

const createCollectionSchema = z.object({
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

  const parsed = createCollectionSchema.safeParse(input)
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
