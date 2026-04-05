import { prisma } from "@/lib/prisma"

export type ProfileData = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  hasPassword: boolean
  createdAt: Date
  totalItems: number
  totalCollections: number
  itemTypeBreakdown: { id: string; name: string; icon: string; color: string; count: number }[]
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  const [user, totalItems, totalCollections, itemTypes] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, password: true, createdAt: true },
    }),
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        items: { where: { userId }, select: { id: true } },
      },
    }),
  ])

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    hasPassword: user.password !== null,
    createdAt: user.createdAt,
    totalItems,
    totalCollections,
    itemTypeBreakdown: itemTypes.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      count: t.items.length,
    })),
  }
}
