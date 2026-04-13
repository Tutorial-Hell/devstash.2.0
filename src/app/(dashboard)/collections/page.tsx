import Link from "next/link"
import { Star, ArrowLeft } from "lucide-react"
import { getDemoUserId, getCollectionsPaginated } from "@/lib/db/collections"
import { iconMap } from "@/lib/icon-map"
import { COLLECTIONS_PER_PAGE } from "@/lib/constants"
import { NewCollectionDialog } from "@/components/new-collection-dialog"
import { CollectionCard } from "@/components/collection-card"
import { Pagination } from "@/components/pagination"

interface Props {
  searchParams: Promise<{ page?: string }>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CollectionsPage({ searchParams }: Props) {
  const userId = await getDemoUserId()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const { collections, total } = userId
    ? await getCollectionsPaginated(userId, { page, pageSize: COLLECTIONS_PER_PAGE })
    : { collections: [], total: 0 }

  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} {total === 1 ? "collection" : "collections"}
          </p>
        </div>
        <NewCollectionDialog />
      </div>

      {/* Grid */}
      {total === 0 ? (
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
              <CollectionCard key={col.id} collection={col}>
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="flex items-start justify-between gap-2 pr-6">
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
              </CollectionCard>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/collections" />
    </div>
  )
}
