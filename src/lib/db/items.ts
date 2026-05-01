import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { slugToTypeName } from "@/lib/utils"
import { ITEMS_PER_PAGE } from "@/lib/constants"
import { assertItemOwnership } from "@/lib/db/ownership"

export type ItemDetail = {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
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
  content: string | null
  url: string | null
  isFavorite: boolean
  isPinned: boolean
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  tags: { id: string; name: string }[]
  itemType: {
    id: string
    name: string
    icon: string
    color: string
  }
  createdAt: Date
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  url: true,
  isFavorite: true,
  isPinned: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  createdAt: true,
  itemType: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { id: true, name: true } },
} as const

function mapItem(item: {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  isFavorite: boolean
  isPinned: boolean
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  createdAt: Date
  itemType: { id: string; name: string; icon: string; color: string }
  tags: { id: string; name: string }[]
}): ItemWithMeta {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.url,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    tags: item.tags,
    itemType: item.itemType,
    createdAt: item.createdAt,
  }
}

type ItemDetailRow = {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  tags: { id: string; name: string }[]
  collections: { collection: { id: string; name: string } }[]
  itemType: { id: string; name: string; icon: string; color: string }
  createdAt: Date
  updatedAt: Date
}

function toItemDetail(item: ItemDetailRow): ItemDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
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

export async function getPinnedItems(userId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    select: itemSelect,
  })
  return items.map(mapItem)
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: itemSelect,
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
  typeSlug: string,
  { page = 1, pageSize = ITEMS_PER_PAGE }: { page?: number; pageSize?: number } = {}
): Promise<{ items: ItemWithMeta[]; itemType: { name: string; icon: string; color: string } | null; total: number }> {
  const typeName = slugToTypeName(typeSlug)
  const itemType = await prisma.itemType.findFirst({
    where: {
      name: typeName,
      OR: [{ isSystem: true }, { userId }],
    },
    select: { id: true, name: true, icon: true, color: true },
  })

  if (!itemType) return { items: [], itemType: null, total: 0 }

  const where = { userId, itemTypeId: itemType.id }
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: itemSelect,
    }),
    prisma.item.count({ where }),
  ])

  return { items: items.map(mapItem), itemType, total }
}

export type UpdateItemData = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  collectionIds?: string[]
}

export async function updateItemById(
  userId: string,
  itemId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  if (!await assertItemOwnership(itemId, userId)) return null

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

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.item.update({
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

    if (data.collectionIds !== undefined) {
      await tx.itemCollection.deleteMany({ where: { itemId } })
      if (data.collectionIds.length > 0) {
        const ownedCollections = await tx.collection.findMany({
          where: { id: { in: data.collectionIds }, userId },
          select: { id: true },
        })
        const ownedIds = ownedCollections.map((c) => c.id)
        if (ownedIds.length > 0) {
          await tx.itemCollection.createMany({
            data: ownedIds.map((collectionId) => ({ itemId, collectionId })),
          })
        }
      }
      // Re-fetch collections after sync
      const updatedCollections = await tx.itemCollection.findMany({
        where: { itemId },
        select: { collection: { select: { id: true, name: true } } },
      })
      return { ...item, collections: updatedCollections }
    }

    return item
  })

  return toItemDetail(updated)
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

  return toItemDetail(item)
}

export type CreateItemData = {
  typeName: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  language: string | null
  tags: string[]
  collectionIds?: string[]
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

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        userId,
        itemTypeId: itemType.id,
        contentType: data.fileUrl ? "file" : "text",
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
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

    if (data.collectionIds && data.collectionIds.length > 0) {
      const ownedCollections = await tx.collection.findMany({
        where: { id: { in: data.collectionIds }, userId },
        select: { id: true },
      })
      const ownedIds = ownedCollections.map((c) => c.id)
      if (ownedIds.length > 0) {
        await tx.itemCollection.createMany({
          data: ownedIds.map((collectionId) => ({
            itemId: created.id,
            collectionId,
          })),
        })
      }
      const updatedCollections = await tx.itemCollection.findMany({
        where: { itemId: created.id },
        select: { collection: { select: { id: true, name: true } } },
      })
      return { ...created, collections: updatedCollections }
    }

    return created
  })

  return toItemDetail(item)
}

export async function deleteItemById(
  userId: string,
  itemId: string
): Promise<{ deleted: boolean; fileKey: string | null }> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, fileUrl: true },
  })
  if (!existing) return { deleted: false, fileKey: null }

  await prisma.item.delete({ where: { id: itemId } })
  return { deleted: true, fileKey: existing.fileUrl }
}

export type SearchableItem = {
  id: string
  title: string
  contentPreview: string | null
  itemType: { name: string; icon: string; color: string }
}

export async function getAllItemsForSearch(userId: string): Promise<SearchableItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      description: true,
      itemType: { select: { name: true, icon: true, color: true } },
    },
  })
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    contentPreview: item.description ?? (item.content ? item.content.slice(0, 100) : null),
    itemType: item.itemType,
  }))
}

export type FavoriteItem = {
  id: string
  title: string
  updatedAt: Date
  itemType: { name: string; icon: string; color: string }
}

export async function getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      itemType: { select: { name: true, icon: true, color: true } },
    },
  })
  return items
}

export async function toggleItemPinnedById(
  userId: string,
  itemId: string
): Promise<{ isPinned: boolean } | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { isPinned: true },
  })
  if (!existing) return null

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isPinned: !existing.isPinned },
    select: { isPinned: true },
  })
  return updated
}

export async function toggleItemFavoriteById(
  userId: string,
  itemId: string
): Promise<{ isFavorite: boolean } | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { isFavorite: true },
  })
  if (!existing) return null

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isFavorite: !existing.isFavorite },
    select: { isFavorite: true },
  })
  return updated
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
