import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/collections", () => ({
  getDemoUserId: vi.fn(),
  createCollectionInDb: vi.fn(),
}))

import { getDemoUserId, createCollectionInDb } from "@/lib/db/collections"
import { createCollection } from "@/actions/collections"

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
