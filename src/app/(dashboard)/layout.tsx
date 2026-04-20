import { getCollections } from "@/lib/db/collections"
import { getItemTypes, getAllItemsForSearch } from "@/lib/db/items"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences"
import type { EditorPreferences } from "@/types/editor-preferences"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const [itemTypes, collections, searchItems, userRow] = await Promise.all([
    userId ? getItemTypes(userId) : Promise.resolve([]),
    userId ? getCollections(userId) : Promise.resolve([]),
    userId ? getAllItemsForSearch(userId) : Promise.resolve([]),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { editorPreferences: true },
        })
      : Promise.resolve(null),
  ])

  const editorPreferences: EditorPreferences = {
    ...DEFAULT_EDITOR_PREFERENCES,
    ...(userRow?.editorPreferences as Partial<EditorPreferences> | null ?? {}),
  }

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
      editorPreferences={editorPreferences}
    >
      {children}
    </DashboardShell>
  )
}
