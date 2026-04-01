import { getDemoUserId, getCollections } from "@/lib/db/collections"
import { getItemTypes } from "@/lib/db/items"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { auth } from "@/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, userId] = await Promise.all([auth(), getDemoUserId()])

  const [itemTypes, collections] = await Promise.all([
    userId ? getItemTypes(userId) : Promise.resolve([]),
    userId ? getCollections(userId) : Promise.resolve([]),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} collections={collections} user={session?.user ?? null}>
      {children}
    </DashboardShell>
  )
}
