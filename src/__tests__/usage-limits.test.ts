import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}))

import { prisma } from "@/lib/prisma"
import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT, isAtItemLimit, isAtCollectionLimit } from "@/lib/usage-limits"

describe("isAtItemLimit", () => {
  beforeEach(() => {
    vi.mocked(prisma.item.count).mockReset()
  })

  it("returns false when count is below limit", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(FREE_ITEM_LIMIT - 1)
    expect(await isAtItemLimit("user-1")).toBe(false)
  })

  it("returns true when count equals limit", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(FREE_ITEM_LIMIT)
    expect(await isAtItemLimit("user-1")).toBe(true)
  })

  it("returns true when count exceeds limit", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(FREE_ITEM_LIMIT + 5)
    expect(await isAtItemLimit("user-1")).toBe(true)
  })

  it("queries with the correct userId", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(0)
    await isAtItemLimit("user-abc")
    expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: "user-abc" } })
  })
})

describe("isAtCollectionLimit", () => {
  beforeEach(() => {
    vi.mocked(prisma.collection.count).mockReset()
  })

  it("returns false when count is below limit", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(FREE_COLLECTION_LIMIT - 1)
    expect(await isAtCollectionLimit("user-1")).toBe(false)
  })

  it("returns true when count equals limit", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(FREE_COLLECTION_LIMIT)
    expect(await isAtCollectionLimit("user-1")).toBe(true)
  })

  it("returns true when count exceeds limit", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(FREE_COLLECTION_LIMIT + 2)
    expect(await isAtCollectionLimit("user-1")).toBe(true)
  })

  it("queries with the correct userId", async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(0)
    await isAtCollectionLimit("user-abc")
    expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: "user-abc" } })
  })
})
