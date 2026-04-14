import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { COLLECTIONS_PER_PAGE } from "@/lib/constants"

export type CollectionWithMeta = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  dominantType: {
    id: string
    name: string
    icon: string
    color: string
  } | null
  allTypes: {
    id: string
    name: string
    icon: string
    color: string
  }[]
  createdAt: Date
}

export const getCollections = cache(async function getCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  })

  return collections.map((col) => {
    const typeCounts: Record<
      string,
      { count: number; type: { id: string; name: string; icon: string; color: string } }
    > = {}

    for (const ic of col.items) {
      const t = ic.item.itemType
      if (!typeCounts[t.id]) {
        typeCounts[t.id] = { count: 0, type: { id: t.id, name: t.name, icon: t.icon, color: t.color } }
      }
      typeCounts[t.id].count++
    }

    const sorted = Object.values(typeCounts).sort((a, b) => b.count - a.count)

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      dominantType: sorted[0]?.type ?? null,
      allTypes: sorted.map((e) => e.type),
      createdAt: col.createdAt,
    }
  })
})

export type CollectionDetail = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  total: number
  items: {
    id: string
    title: string
    description: string | null
    isFavorite: boolean
    isPinned: boolean
    tags: { id: string; name: string }[]
    itemType: { id: string; name: string; icon: string; color: string }
    createdAt: Date
  }[]
}

export async function getCollectionById(
  userId: string,
  collectionId: string,
  { page = 1, pageSize = COLLECTIONS_PER_PAGE }: { page?: number; pageSize?: number } = {}
): Promise<CollectionDetail | null> {
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          item: {
            include: {
              itemType: { select: { id: true, name: true, icon: true, color: true } },
              tags: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  if (!col) return null

  return {
    id: col.id,
    name: col.name,
    description: col.description,
    isFavorite: col.isFavorite,
    total: col._count.items,
    items: col.items.map(({ item }) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      tags: item.tags,
      itemType: item.itemType,
      createdAt: item.createdAt,
    })),
  }
}

export type CollectionCreated = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

export async function createCollectionInDb(
  userId: string,
  data: { name: string; description?: string | null }
): Promise<CollectionCreated> {
  return prisma.collection.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getCollectionsPaginated(
  userId: string,
  { page = 1, pageSize = COLLECTIONS_PER_PAGE }: { page?: number; pageSize?: number } = {}
): Promise<{ collections: CollectionWithMeta[]; total: number }> {
  const [allCollections, total] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: {
          include: {
            item: {
              include: { itemType: true },
            },
          },
        },
      },
    }),
    prisma.collection.count({ where: { userId } }),
  ])

  const collections = allCollections.map((col) => {
    const typeCounts: Record<
      string,
      { count: number; type: { id: string; name: string; icon: string; color: string } }
    > = {}

    for (const ic of col.items) {
      const t = ic.item.itemType
      if (!typeCounts[t.id]) {
        typeCounts[t.id] = { count: 0, type: { id: t.id, name: t.name, icon: t.icon, color: t.color } }
      }
      typeCounts[t.id].count++
    }

    const sorted = Object.values(typeCounts).sort((a, b) => b.count - a.count)

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      dominantType: sorted[0]?.type ?? null,
      allTypes: sorted.map((e) => e.type),
      createdAt: col.createdAt,
    }
  })

  return { collections, total }
}

export type CollectionOption = { id: string; name: string }

export async function getCollectionsForSelect(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function updateCollectionById(
  userId: string,
  collectionId: string,
  data: { name: string; description?: string | null }
): Promise<CollectionCreated | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  })
  if (!existing) return null

  return prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: data.name,
      description: data.description ?? null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function deleteCollectionById(
  userId: string,
  collectionId: string
): Promise<boolean> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  })
  if (!existing) return false

  await prisma.$transaction([
    prisma.itemCollection.deleteMany({ where: { collectionId } }),
    prisma.collection.delete({ where: { id: collectionId } }),
  ])

  return true
}

export type FavoriteCollection = {
  id: string
  name: string
  updatedAt: Date
  itemCount: number
}

export async function getFavoriteCollections(userId: string): Promise<FavoriteCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  })
  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    updatedAt: c.updatedAt,
    itemCount: c._count.items,
  }))
}

export async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  })
  return user?.id ?? null
}
