import { prisma } from "@/lib/prisma"

export async function assertItemOwnership(
  itemId: string,
  userId: string
): Promise<{ id: string } | null> {
  return prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  })
}

export async function assertCollectionOwnership(
  collectionId: string,
  userId: string
): Promise<{ id: string } | null> {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
}
