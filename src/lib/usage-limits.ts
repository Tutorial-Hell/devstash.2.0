import { prisma } from "@/lib/prisma"
import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from "@/lib/constants"

export async function isAtItemLimit(userId: string): Promise<boolean> {
  const count = await prisma.item.count({ where: { userId } })
  return count >= FREE_ITEM_LIMIT
}

export async function isAtCollectionLimit(userId: string): Promise<boolean> {
  const count = await prisma.collection.count({ where: { userId } })
  return count >= FREE_COLLECTION_LIMIT
}
