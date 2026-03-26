import { prisma } from "@/lib/prisma"

export type ItemWithMeta = {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  tags: { id: string; name: string }[]
  itemType: {
    id: string
    name: string
    icon: string
    color: string
  }
  createdAt: Date
}

const itemInclude = {
  itemType: true,
  tags: { select: { id: true, name: true } },
} as const

function mapItem(item: {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
  itemType: { id: string; name: string; icon: string; color: string }
  tags: { id: string; name: string }[]
}): ItemWithMeta {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    tags: item.tags,
    itemType: item.itemType,
    createdAt: item.createdAt,
  }
}

export async function getPinnedItems(userId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: itemInclude,
  })
  return items.map(mapItem)
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: itemInclude,
  })
  return items.map(mapItem)
}

export async function getItemStats(userId: string): Promise<{ totalItems: number; favoriteItemsCount: number }> {
  const [totalItems, favoriteItemsCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ])
  return { totalItems, favoriteItemsCount }
}
