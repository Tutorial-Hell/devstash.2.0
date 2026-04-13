import { getDemoUserId, getCollections } from "@/lib/db/collections"
import { getItemTypes, getAllItemsForSearch } from "@/lib/db/items"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { auth } from "@/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, userId] = await Promise.all([auth(), getDemoUserId()])

  const [itemTypes, collections, searchItems] = await Promise.all([
    userId ? getItemTypes(userId) : Promise.resolve([]),
    userId ? getCollections(userId) : Promise.resolve([]),
    userId ? getAllItemsForSearch(userId) : Promise.resolve([]),
  ])

  const searchCollections = collections.map((c) => ({
    id: c.id,
    name: c.name,
    itemCount: c.itemCount,
  }))

  return (
    <DashboardShell
      itemTypes={itemTypes}
      collections={collections}
      user={session?.user ?? null}
      searchItems={searchItems}
      searchCollections={searchCollections}
    >
      {children}
    </DashboardShell>
  )
}
