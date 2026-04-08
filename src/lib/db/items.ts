import { cache } from "react"
import { prisma } from "@/lib/prisma"

export type ItemDetail = {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  tags: { id: string; name: string }[]
  collections: { id: string; name: string }[]
  itemType: { id: string; name: string; icon: string; color: string }
  createdAt: Date
  updatedAt: Date
}

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

export type ItemTypeWithCount = {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

export async function getItemsByType(
  userId: string,
  typeSlug: string
): Promise<{ items: ItemWithMeta[]; itemType: { name: string; icon: string; color: string } | null }> {
  const typeName = typeSlug.replace(/s$/, "")
  const itemType = await prisma.itemType.findFirst({
    where: {
      name: typeName,
      OR: [{ isSystem: true }, { userId }],
    },
    select: { id: true, name: true, icon: true, color: true },
  })

  if (!itemType) return { items: [], itemType: null }

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: itemType.id },
    orderBy: { createdAt: "desc" },
    include: itemInclude,
  })

  return { items: items.map(mapItem), itemType }
}

export async function getItemById(userId: string, itemId: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })

  if (!item) return null

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.url,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    tags: item.tags,
    collections: item.collections.map((ic) => ic.collection),
    itemType: item.itemType,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const getItemTypes = cache(async function getItemTypes(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
    orderBy: { name: "asc" },
    include: {
      items: {
        where: { userId },
        select: { id: true },
      },
    },
  })
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    count: t.items.length,
  }))
})
