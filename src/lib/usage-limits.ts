import { prisma } from "@/lib/prisma"

export const FREE_ITEM_LIMIT = 50
export const FREE_COLLECTION_LIMIT = 3

export async function isAtItemLimit(userId: string): Promise<boolean> {
  const count = await prisma.item.count({ where: { userId } })
  return count >= FREE_ITEM_LIMIT
}

export async function isAtCollectionLimit(userId: string): Promise<boolean> {
  const count = await prisma.collection.count({ where: { userId } })
  return count >= FREE_COLLECTION_LIMIT
}
