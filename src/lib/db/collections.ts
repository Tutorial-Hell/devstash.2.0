import { cache } from "react"
import { prisma } from "@/lib/prisma"

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
    take: 6,
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
  collectionId: string
): Promise<CollectionDetail | null> {
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
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

export async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  })
  return user?.id ?? null
}
