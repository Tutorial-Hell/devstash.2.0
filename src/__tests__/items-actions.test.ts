import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/collections", () => ({
  getDemoUserId: vi.fn(),
}))

vi.mock("@/lib/db/items", () => ({
  deleteItemById: vi.fn(),
  createItemInDb: vi.fn(),
}))

import { getDemoUserId } from "@/lib/db/collections"
import { deleteItemById, createItemInDb } from "@/lib/db/items"
import { deleteItem, createItem } from "@/actions/items"

describe("deleteItem", () => {
  beforeEach(() => {
    vi.mocked(getDemoUserId).mockReset()
    vi.mocked(deleteItemById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue(null)

    const result = await deleteItem("item-123")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(deleteItemById).not.toHaveBeenCalled()
  })

  it("returns not-found error when item does not belong to user", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(deleteItemById).mockResolvedValue(false)

    const result = await deleteItem("item-999")

    expect(result).toEqual({ success: false, error: "Item not found or access denied." })
    expect(deleteItemById).toHaveBeenCalledWith("user-1", "item-999")
  })

  it("returns success when item is deleted", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(deleteItemById).mockResolvedValue(true)

    const result = await deleteItem("item-123")

    expect(result).toEqual({ success: true })
    expect(deleteItemById).toHaveBeenCalledWith("user-1", "item-123")
  })
})

// ─── createItem ───────────────────────────────────────────────────────────────

const mockItem = {
  id: "item-1",
  title: "Test",
  description: null,
  content: null,
  url: null,
  language: null,
  isFavorite: false,
  isPinned: false,
  tags: [],
  collections: [],
  itemType: { id: "t1", name: "snippet", icon: "code", color: "#000" },
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("createItem", () => {
  beforeEach(() => {
    vi.mocked(getDemoUserId).mockReset()
    vi.mocked(createItemInDb).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue(null)

    const result = await createItem({ type: "snippet", title: "Hello" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when title is empty", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "snippet", title: "   " })

    expect(result).toEqual({ success: false, error: "Title is required" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when link type has no URL", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "link", title: "My Link", url: null })

    expect(result).toEqual({ success: false, error: "URL is required for link items" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when link URL is invalid", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "link", title: "My Link", url: "not-a-url" })

    expect(result).toEqual({ success: false, error: "Invalid URL" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("does not require URL for non-link types", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(mockItem)

    const result = await createItem({ type: "snippet", title: "My Snippet" })

    expect(result).toEqual({ success: true, data: mockItem })
  })

  it("returns error when item type is not found in db", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(null)

    const result = await createItem({ type: "snippet", title: "My Snippet" })

    expect(result).toEqual({ success: false, error: "Invalid item type." })
  })

  it("returns success with created item on valid link input", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(mockItem)

    const result = await createItem({
      type: "link",
      title: "GitHub",
      url: "https://github.com",
    })

    expect(result).toEqual({ success: true, data: mockItem })
    expect(createItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ typeName: "link", url: "https://github.com" })
    )
  })

  it("passes tags to createItemInDb", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(mockItem)

    await createItem({ type: "note", title: "Notes", tags: ["react", "hooks"] })

    expect(createItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ tags: ["react", "hooks"] })
    )
  })
})
