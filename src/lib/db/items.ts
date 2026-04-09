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

export type UpdateItemData = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
}

export async function updateItemById(
  userId: string,
  itemId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  // Verify ownership (update's where only accepts unique fields)
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  })
  if (!existing) return null

  // Upsert each tag, then set the full list (set + connectOrCreate can't be combined in Prisma)
  const tagRecords = await Promise.all(
    data.tags.map((name) =>
      prisma.tag.upsert({
        where: { name_userId: { name, userId } },
        create: { name, userId },
        update: {},
        select: { id: true },
      })
    )
  )

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: { set: tagRecords },
    },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    content: updated.content,
    url: updated.url,
    language: updated.language,
    isFavorite: updated.isFavorite,
    isPinned: updated.isPinned,
    tags: updated.tags,
    collections: updated.collections.map((ic) => ic.collection),
    itemType: updated.itemType,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  }
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

export type CreateItemData = {
  typeName: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
}

export async function createItemInDb(
  userId: string,
  data: CreateItemData
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.typeName, OR: [{ isSystem: true }, { userId }] },
    select: { id: true, name: true, icon: true, color: true },
  })
  if (!itemType) return null

  const tagRecords = await Promise.all(
    data.tags.map((name) =>
      prisma.tag.upsert({
        where: { name_userId: { name, userId } },
        create: { name, userId },
        update: {},
        select: { id: true },
      })
    )
  )

  const item = await prisma.item.create({
    data: {
      userId,
      itemTypeId: itemType.id,
      contentType: "text",
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: { connect: tagRecords },
    },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })

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

export async function deleteItemById(userId: string, itemId: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  })
  if (!existing) return false

  await prisma.item.delete({ where: { id: itemId } })
  return true
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
