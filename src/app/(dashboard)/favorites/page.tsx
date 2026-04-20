import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"
import { getFavoriteCollections } from "@/lib/db/collections"
import { auth } from "@/auth"
import { getFavoriteItems } from "@/lib/db/items"
import { FavoritesSortable } from "@/components/favorites-sortable"

export default async function FavoritesPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const [items, collections] = await Promise.all([
    userId ? getFavoriteItems(userId) : Promise.resolve([]),
    userId ? getFavoriteCollections(userId) : Promise.resolve([]),
  ])

  const isEmpty = items.length === 0 && collections.length === 0

  return (
    <div className="max-w-3xl space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        <h1 className="text-xl font-semibold text-foreground">Favorites</h1>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Star className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No favorites yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Star items and collections to find them here.
          </p>
        </div>
      ) : (
        <FavoritesSortable items={items} collections={collections} />
      )}
    </div>
  )
}
