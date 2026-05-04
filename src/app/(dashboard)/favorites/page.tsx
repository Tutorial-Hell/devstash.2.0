import { Star } from "lucide-react"
import { getFavoriteCollections } from "@/lib/db/collections"
import { getAuthenticatedUserId } from "@/lib/auth-utils"
import { getFavoriteItems } from "@/lib/db/items"
import { FavoritesSortable } from "@/components/favorites-sortable"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { EmptyState } from "@/components/empty-state"

export default async function FavoritesPage() {
  const userId = await getAuthenticatedUserId()

  const [items, collections] = await Promise.all([
    userId ? getFavoriteItems(userId) : Promise.resolve([]),
    userId ? getFavoriteCollections(userId) : Promise.resolve([]),
  ])

  const isEmpty = items.length === 0 && collections.length === 0

  return (
    <div className="max-w-3xl space-y-8">
      <BackToDashboard />

      {/* Header */}
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        <h1 className="text-xl font-semibold text-foreground">Favorites</h1>
      </div>

      {isEmpty ? (
        <EmptyState
          padding="p-12"
          icon={<Star className="h-8 w-8 mx-auto text-muted-foreground/40" />}
          message="No favorites yet."
          detail="Star items and collections to find them here."
        />
      ) : (
        <FavoritesSortable items={items} collections={collections} />
      )}
    </div>
  )
}
