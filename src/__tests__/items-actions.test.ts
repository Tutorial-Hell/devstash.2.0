import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth-utils", () => ({
  getAuthenticatedUserId: vi.fn(),
}))

vi.mock("@/lib/db/items", () => ({
  deleteItemById: vi.fn(),
  createItemInDb: vi.fn(),
  toggleItemFavoriteById: vi.fn(),
  toggleItemPinnedById: vi.fn(),
}))

vi.mock("@/lib/r2", () => ({
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
}))

import { getAuthenticatedUserId } from "@/lib/auth-utils"
import { deleteItemById, createItemInDb, toggleItemFavoriteById, toggleItemPinnedById } from "@/lib/db/items"
import { deleteFromR2 } from "@/lib/r2"
import { deleteItem, createItem, toggleItemFavorite, toggleItemPin } from "@/actions/items"

describe("deleteItem", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(deleteItemById).mockReset()
    vi.mocked(deleteFromR2).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await deleteItem("item-123")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(deleteItemById).not.toHaveBeenCalled()
  })

  it("returns not-found error when item does not belong to user", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(deleteItemById).mockResolvedValue({ deleted: false, fileKey: null })

    const result = await deleteItem("item-999")

    expect(result).toEqual({ success: false, error: "Item not found or access denied." })
    expect(deleteItemById).toHaveBeenCalledWith("user-1", "item-999")
  })

  it("returns success when item is deleted", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(deleteItemById).mockResolvedValue({ deleted: true, fileKey: null })

    const result = await deleteItem("item-123")

    expect(result).toEqual({ success: true })
    expect(deleteItemById).toHaveBeenCalledWith("user-1", "item-123")
  })

  it("calls deleteFromR2 when deleted item has a fileKey", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(deleteItemById).mockResolvedValue({ deleted: true, fileKey: "user-1/abc.png" })
    vi.mocked(deleteFromR2).mockResolvedValue(undefined)

    await deleteItem("item-123")

    expect(deleteFromR2).toHaveBeenCalledWith("user-1/abc.png")
  })

  it("does not call deleteFromR2 when fileKey is null", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(deleteItemById).mockResolvedValue({ deleted: true, fileKey: null })

    await deleteItem("item-123")

    expect(deleteFromR2).not.toHaveBeenCalled()
  })
})

// ─── createItem ───────────────────────────────────────────────────────────────

const mockItem = {
  id: "item-1",
  title: "Test",
  description: null,
  content: null,
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
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
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(createItemInDb).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await createItem({ type: "snippet", title: "Hello" })

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when title is empty", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "snippet", title: "   " })

    expect(result).toEqual({ success: false, error: "Title is required" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when link type has no URL", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "link", title: "My Link", url: null })

    expect(result).toEqual({ success: false, error: "URL is required for link items" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when link URL is invalid", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "link", title: "My Link", url: "not-a-url" })

    expect(result).toEqual({ success: false, error: "Invalid URL" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("does not require URL for non-link types", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(mockItem)

    const result = await createItem({ type: "snippet", title: "My Snippet" })

    expect(result).toEqual({ success: true, data: mockItem })
  })

  it("returns error when item type is not found in db", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(null)

    const result = await createItem({ type: "snippet", title: "My Snippet" })

    expect(result).toEqual({ success: false, error: "Invalid item type." })
  })

  it("returns success with created item on valid link input", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
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
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(mockItem)

    await createItem({ type: "note", title: "Notes", tags: ["react", "hooks"] })

    expect(createItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ tags: ["react", "hooks"] })
    )
  })

  it("returns validation error when file type has no fileUrl", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "file", title: "My File" })

    expect(result).toEqual({ success: false, error: "A file must be uploaded" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("returns validation error when image type has no fileUrl", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")

    const result = await createItem({ type: "image", title: "My Image" })

    expect(result).toEqual({ success: false, error: "A file must be uploaded" })
    expect(createItemInDb).not.toHaveBeenCalled()
  })

  it("creates file item with fileUrl, fileName, fileSize", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(createItemInDb).mockResolvedValue(mockItem)

    const result = await createItem({
      type: "file",
      title: "My Doc",
      fileUrl: "user-1/uuid.pdf",
      fileName: "report.pdf",
      fileSize: 102400,
    })

    expect(result).toEqual({ success: true, data: mockItem })
    expect(createItemInDb).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        typeName: "file",
        fileUrl: "user-1/uuid.pdf",
        fileName: "report.pdf",
        fileSize: 102400,
      })
    )
  })
})

// ─── toggleItemFavorite ───────────────────────────────────────────────────────

describe("toggleItemFavorite", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(toggleItemFavoriteById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await toggleItemFavorite("item-1")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(toggleItemFavoriteById).not.toHaveBeenCalled()
  })

  it("returns not-found error when item does not belong to user", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleItemFavoriteById).mockResolvedValue(null)

    const result = await toggleItemFavorite("item-999")

    expect(result).toEqual({ success: false, error: "Item not found or access denied." })
    expect(toggleItemFavoriteById).toHaveBeenCalledWith("user-1", "item-999")
  })

  it("returns success with isFavorite=true when favorited", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleItemFavoriteById).mockResolvedValue({ isFavorite: true })

    const result = await toggleItemFavorite("item-1")

    expect(result).toEqual({ success: true, isFavorite: true })
    expect(toggleItemFavoriteById).toHaveBeenCalledWith("user-1", "item-1")
  })

  it("returns success with isFavorite=false when unfavorited", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleItemFavoriteById).mockResolvedValue({ isFavorite: false })

    const result = await toggleItemFavorite("item-1")

    expect(result).toEqual({ success: true, isFavorite: false })
  })
})

// ─── toggleItemPin ────────────────────────────────────────────────────────────

describe("toggleItemPin", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedUserId).mockReset()
    vi.mocked(toggleItemPinnedById).mockReset()
  })

  it("returns not-authenticated error when no userId", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(null)

    const result = await toggleItemPin("item-1")

    expect(result).toEqual({ success: false, error: "Not authenticated." })
    expect(toggleItemPinnedById).not.toHaveBeenCalled()
  })

  it("returns not-found error when item does not belong to user", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleItemPinnedById).mockResolvedValue(null)

    const result = await toggleItemPin("item-999")

    expect(result).toEqual({ success: false, error: "Item not found or access denied." })
    expect(toggleItemPinnedById).toHaveBeenCalledWith("user-1", "item-999")
  })

  it("returns success with isPinned=true when pinned", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleItemPinnedById).mockResolvedValue({ isPinned: true })

    const result = await toggleItemPin("item-1")

    expect(result).toEqual({ success: true, isPinned: true })
    expect(toggleItemPinnedById).toHaveBeenCalledWith("user-1", "item-1")
  })

  it("returns success with isPinned=false when unpinned", async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue("user-1")
    vi.mocked(toggleItemPinnedById).mockResolvedValue({ isPinned: false })

    const result = await toggleItemPin("item-1")

    expect(result).toEqual({ success: true, isPinned: false })
  })
})
