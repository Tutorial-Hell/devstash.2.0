import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/collections", () => ({
  getDemoUserId: vi.fn(),
  createCollectionInDb: vi.fn(),
  updateCollectionById: vi.fn(),
  deleteCollectionById: vi.fn(),
}))

import {
  getDemoUserId,
  createCollectionInDb,
  updateCollectionById,
  deleteCollectionById,
} from "@/lib/db/collections"
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/actions/collections"

const mockCollection = {
  id: "col-1",
  name: "My Collection",
  description: null,
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("createCollection", () => {
  beforeEach(() => {
    vi.mocked(getDemoUserId).mockReset()
    vi.mocked(createCollectionInDb).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue(null)

    const result = await createCollection({ name: "Test" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(createCollectionInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when name is empty", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const result = await createCollection({ name: "   " })

    expect(result).toEqual({ success: false, error: "Name is required" })
    expect(createCollectionInDb).not.toHaveBeenCalled()
  })

  it("returns success with created collection", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(createCollectionInDb).mockResolvedValue(mockCollection)

    const result = await createCollection({ name: "My Collection" })

    expect(result).toEqual({ success: true, data: mockCollection })
    expect(createCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "My Collection",
      description: null,
    })
  })

  it("passes description when provided", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
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
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(createCollectionInDb).mockResolvedValue(mockCollection)

    await createCollection({ name: "My Collection", description: "" })

    expect(createCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "My Collection",
      description: null,
    })
  })

  it("converts whitespace-only description to null", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
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
    vi.mocked(getDemoUserId).mockReset()
    vi.mocked(updateCollectionById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue(null)

    const result = await updateCollection("col-1", { name: "New Name" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(updateCollectionById).not.toHaveBeenCalled()
  })

  it("returns validation error when name is empty", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const result = await updateCollection("col-1", { name: "   " })

    expect(result).toEqual({ success: false, error: "Name is required" })
    expect(updateCollectionById).not.toHaveBeenCalled()
  })

  it("returns not-found error when collection does not belong to user", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(updateCollectionById).mockResolvedValue(null)

    const result = await updateCollection("col-999", { name: "New Name" })

    expect(result).toEqual({ success: false, error: "Collection not found." })
  })

  it("returns success with updated collection", async () => {
    const updated = { ...mockCollection, name: "Renamed", description: "New desc" }
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
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
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
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
    vi.mocked(getDemoUserId).mockReset()
    vi.mocked(deleteCollectionById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue(null)

    const result = await deleteCollection("col-1")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(deleteCollectionById).not.toHaveBeenCalled()
  })

  it("returns not-found error when collection does not belong to user", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(deleteCollectionById).mockResolvedValue(false)

    const result = await deleteCollection("col-999")

    expect(result).toEqual({ success: false, error: "Collection not found." })
  })

  it("returns success when collection is deleted", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(deleteCollectionById).mockResolvedValue(true)

    const result = await deleteCollection("col-1")

    expect(result).toEqual({ success: true })
    expect(deleteCollectionById).toHaveBeenCalledWith("user-1", "col-1")
  })
})
