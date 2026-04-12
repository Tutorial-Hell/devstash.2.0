import Link from "next/link"
import { Star } from "lucide-react"
import { getDemoUserId, getCollections } from "@/lib/db/collections"
import { iconMap } from "@/lib/icon-map"
import { NewCollectionDialog } from "@/components/new-collection-dialog"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CollectionsPage() {
  const userId = await getDemoUserId()
  const collections = userId ? await getCollections(userId) : []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>
        <NewCollectionDialog />
      </div>

      {/* Grid */}
      {collections.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No collections yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Create your first collection to organize your items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {collections.map((col) => {
            const accentColor = col.dominantType?.color ?? "#6b7280"
            return (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group rounded-lg border border-border bg-card p-4 flex flex-col gap-2 hover:border-border/80 hover:bg-card/80 transition-colors relative overflow-hidden"
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {col.name}
                  </span>
                  {col.isFavorite && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400 mt-0.5" />
                  )}
                </div>

                {col.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {col.description}
                  </p>
                )}

                <p className="text-xs text-muted-foreground/70">
                  {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                </p>

                {col.allTypes.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {col.allTypes.map((t) => {
                      const Icon = iconMap[t.icon]
                      if (!Icon) return null
                      return (
                        <Icon
                          key={t.id}
                          className="h-3.5 w-3.5"
                          style={{ color: t.color }}
                        />
                      )
                    })}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
