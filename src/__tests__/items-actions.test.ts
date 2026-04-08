import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/collections", () => ({
  getDemoUserId: vi.fn(),
}))

vi.mock("@/lib/db/items", () => ({
  deleteItemById: vi.fn(),
}))

import { getDemoUserId } from "@/lib/db/collections"
import { deleteItemById } from "@/lib/db/items"
import { deleteItem } from "@/actions/items"

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
