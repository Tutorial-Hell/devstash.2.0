import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth-utils", () => ({
  getAuthenticatedUserId: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  createCollectionInDb: vi.fn(),
  updateCollectionById: vi.fn(),
  deleteCollectionById: vi.fn(),
  toggleCollectionFavoriteById: vi.fn(),
}))

vi.mock("@/lib/usage-limits", () => ({
  isAtCollectionLimit: vi.fn().mockResolvedValue(false),
}))

import { getAuthenticatedUserId, getSession } from "@/lib/auth-utils"
import { isAtCollectionLimit } from "@/lib/usage-limits"
import {
  createCollectionInDb,
  updateCollectionById,
  deleteCollectionById,
  toggleCollectionFavoriteById,
} from "@/lib/db/collections"
import {
  createCollection,
  updateCollection,
  deleteCollection,
  toggleCollectionFavorite,
} from "@/actions/collections"

const mockCollection = {
  id: "col-1",
  name: "My Collection",
  description: null,
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const freeSession = { user: { id: "user-1", isPro: false } }
const proSession = { user: { id: "user-1", isPro: true } }

describe("createCollection", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset()
    vi.mocked(createCollectionInDb).mockReset()
    vi.mocked(isAtCollectionLimit).mockReset()
    vi.mocked(isAtCollectionLimit).mockResolvedValue(false)
  })

  it("returns not-authenticated error when no session", async () => {
    vi.mocked(getSession).mockResolvedValue(null as any)

    const result = await createCollection({ name: "Test" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(createCollectionInDb).not.toHaveBeenCalled()
  })

  it("returns limit error when free user is at collection limit", async () => {
    vi.mocked(getSession).mockResolvedValue(freeSession as any)
    vi.mocked(isAtCollectionLimit).mockResolvedValue(true)

    const result = await createCollection({ name: "Test" })

    expect(result).toEqual({ success: false, error: expect.stringContaining("3 collections") })
    expect(createCollectionInDb).not.toHaveBeenCalled()
  })

  it("skips limit check for pro users", async () => {
    vi.mocked(getSession).mockResolvedValue(proSession as any)
    vi.mocked(createCollectionInDb).mockResolvedValue(mockCollection)

    await createCollection({ name: "My Collection" })

    expect(isAtCollectionLimit).not.toHaveBeenCalled()
  })

  it("returns validation error when name is empty", async () => {
    vi.mocked(getSession).mockResolvedValue(freeSession as any)

    const result = await createCollection({ name: "   " })

    expect(result).toEqual({ success: false, error: "Name is required" })
    expect(createCollectionInDb).not.toHaveBeenCalled()
  })

  it("returns success with created collection", async () => {
    vi.mocked(getSession).mockResolvedValue(freeSession as any)
    vi.mocked(createCollectionInDb).mockResolvedValue(mockCollection)

    const result = await createCollection({ name: "My Collection" })

    expect(result).toEqual({ success: true, data: mockCollection })
    expect(createCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "My Collection",
      description: null,
    })
  })

  it("passes description when provided", async () => {
    vi.mocked(getSession).mockResolvedValue(freeSession as any)
    vi.mocked(createCollectionInDb).mockResolvedValue({
      ...mockCollection,
      description: "A helpful collection",
    })

    const result = await createCollection({
      name: "My Collection",
      description: "A helpful collection",
    })

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ description: "A helpful collection" }),
    })
    expect(createCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "My Collection",
      description: "A helpful collection",
    })
  })

  it("converts empty description to null", async () => {
    vi.mocked(getSession).mockResolvedValue(freeSession as any)
    vi.mocked(createCollectionInDb).mockResolvedValue(mockCollection)

    await createCollection({ name: "My Collection", description: "" })

    expect(createCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "My Collection",
      description: null,
    })
  })

  it("converts whitespace-only description to null", async () => {
    vi.mocked(getSession).mockResolvedValue(freeSession as any)
    vi.mocked(createCollectionInDb).mockResolvedValue(mockCollection)

    await createCollection({ name: "My Collection", description: "   " })

    expect(createCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "My Collection",
      description: null,
    })
  })
})

describe("updateCollection", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(updateCollectionById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await updateCollection("col-1", { name: "New Name" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(updateCollectionById).not.toHaveBeenCalled()
  })

  it("returns validation error when name is empty", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")

    const result = await updateCollection("col-1", { name: "   " })

    expect(result).toEqual({ success: false, error: "Name is required" })
    expect(updateCollectionById).not.toHaveBeenCalled()
  })

  it("returns not-found error when collection does not belong to user", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(updateCollectionById).mockResolvedValue(null)

    const result = await updateCollection("col-999", { name: "New Name" })

    expect(result).toEqual({ success: false, error: "Collection not found." })
  })

  it("returns success with updated collection", async () => {
    const updated = { ...mockCollection, name: "Renamed", description: "New desc" }
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(updateCollectionById).mockResolvedValue(updated)

    const result = await updateCollection("col-1", {
      name: "Renamed",
      description: "New desc",
    })

    expect(result).toEqual({ success: true, data: updated })
    expect(updateCollectionById).toHaveBeenCalledWith("user-1", "col-1", {
      name: "Renamed",
      description: "New desc",
    })
  })

  it("converts empty description to null", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(updateCollectionById).mockResolvedValue(mockCollection)

    await updateCollection("col-1", { name: "Name", description: "" })

    expect(updateCollectionById).toHaveBeenCalledWith("user-1", "col-1", {
      name: "Name",
      description: null,
    })
  })
})

describe("deleteCollection", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(deleteCollectionById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await deleteCollection("col-1")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(deleteCollectionById).not.toHaveBeenCalled()
  })

  it("returns not-found error when collection does not belong to user", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(deleteCollectionById).mockResolvedValue(false)

    const result = await deleteCollection("col-999")

    expect(result).toEqual({ success: false, error: "Collection not found." })
  })

  it("returns success when collection is deleted", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(deleteCollectionById).mockResolvedValue(true)

    const result = await deleteCollection("col-1")

    expect(result).toEqual({ success: true })
    expect(deleteCollectionById).toHaveBeenCalledWith("user-1", "col-1")
  })
})

// ─── toggleCollectionFavorite ─────────────────────────────────────────────────

describe("toggleCollectionFavorite", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(toggleCollectionFavoriteById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await toggleCollectionFavorite("col-1")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(toggleCollectionFavoriteById).not.toHaveBeenCalled()
  })

  it("returns not-found error when collection does not belong to user", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleCollectionFavoriteById).mockResolvedValue(null)

    const result = await toggleCollectionFavorite("col-999")

    expect(result).toEqual({ success: false, error: "Collection not found or access denied." })
    expect(toggleCollectionFavoriteById).toHaveBeenCalledWith("user-1", "col-999")
  })

  it("returns success with isFavorite=true when favorited", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleCollectionFavoriteById).mockResolvedValue({ isFavorite: true })

    const result = await toggleCollectionFavorite("col-1")

    expect(result).toEqual({ success: true, isFavorite: true })
    expect(toggleCollectionFavoriteById).toHaveBeenCalledWith("user-1", "col-1")
  })

  it("returns success with isFavorite=false when unfavorited", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleCollectionFavoriteById).mockResolvedValue({ isFavorite: false })

    const result = await toggleCollectionFavorite("col-1")

    expect(result).toEqual({ success: true, isFavorite: false })
  })
})
