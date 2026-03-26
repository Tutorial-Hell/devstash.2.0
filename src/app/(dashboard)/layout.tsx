import { getDemoUserId, getCollections } from "@/lib/db/collections"
import { getItemTypes } from "@/lib/db/items"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getDemoUserId()

  const [itemTypes, collections] = await Promise.all([
    userId ? getItemTypes(userId) : Promise.resolve([]),
    userId ? getCollections(userId) : Promise.resolve([]),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections}>
      {children}
    </DashboardShell>
  )
}
