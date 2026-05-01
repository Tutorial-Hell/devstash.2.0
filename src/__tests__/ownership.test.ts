import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst: vi.fn() },
    collection: { findFirst: vi.fn() },
  },
}))

import { prisma } from "@/lib/prisma"
import { assertItemOwnership, assertCollectionOwnership } from "@/lib/db/ownership"

describe("assertItemOwnership", () => {
  beforeEach(() => {
    vi.mocked(prisma.item.findFirst).mockReset()
  })

  it("returns { id } when item belongs to user", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({ id: "item-1" } as any)

    const result = await assertItemOwnership("item-1", "user-1")

    expect(result).toEqual({ id: "item-1" })
    expect(prisma.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true },
    })
  })

  it("returns null when item does not belong to user", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    const result = await assertItemOwnership("item-999", "user-1")

    expect(result).toBeNull()
    expect(prisma.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-999", userId: "user-1" },
      select: { id: true },
    })
  })

  it("returns null when item does not exist", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    const result = await assertItemOwnership("nonexistent", "user-1")

    expect(result).toBeNull()
  })

  it("filters by both itemId and userId in the where clause", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({ id: "item-1" } as any)

    await assertItemOwnership("item-1", "user-42")

    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-42" },
      })
    )
  })
})

describe("assertCollectionOwnership", () => {
  beforeEach(() => {
    vi.mocked(prisma.collection.findFirst).mockReset()
  })

  it("returns { id } when collection belongs to user", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({ id: "col-1" } as any)

    const result = await assertCollectionOwnership("col-1", "user-1")

    expect(result).toEqual({ id: "col-1" })
    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      select: { id: true },
    })
  })

  it("returns null when collection does not belong to user", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null)

    const result = await assertCollectionOwnership("col-999", "user-1")

    expect(result).toBeNull()
    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "col-999", userId: "user-1" },
      select: { id: true },
    })
  })

  it("returns null when collection does not exist", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null)

    const result = await assertCollectionOwnership("nonexistent", "user-1")

    expect(result).toBeNull()
  })

  it("filters by both collectionId and userId in the where clause", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({ id: "col-1" } as any)

    await assertCollectionOwnership("col-1", "user-42")

    expect(prisma.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "col-1", userId: "user-42" },
      })
    )
  })
})
