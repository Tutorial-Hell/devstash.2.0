import Link from "next/link"
import { ArrowLeft, Star, Folders } from "lucide-react"
import { getDemoUserId, getFavoriteCollections } from "@/lib/db/collections"
import { getFavoriteItems } from "@/lib/db/items"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { ClickableItemCard } from "@/components/clickable-item-card"

export default async function FavoritesPage() {
  const userId = await getDemoUserId()

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
        <div className="space-y-8">
          {/* Items section */}
          {items.length > 0 && (
            <section className="space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Items
                </span>
                <span className="text-xs text-muted-foreground/60 font-mono">{items.length}</span>
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                {items.map((item, i) => {
                  const Icon = iconMap[item.itemType.icon]
                  return (
                    <ClickableItemCard
                      key={item.id}
                      itemId={item.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors font-mono text-sm ${
                        i !== 0 ? "border-t border-border" : ""
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: item.itemType.color }}
                        />
                      )}
                      <span className="flex-1 truncate text-foreground">{item.title}</span>
                      <span
                        className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: item.itemType.color,
                          backgroundColor: `${item.itemType.color}18`,
                        }}
                      >
                        {item.itemType.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground/60 font-mono">
                        {formatDate(item.updatedAt)}
                      </span>
                    </ClickableItemCard>
                  )
                })}
              </div>
            </section>
          )}

          {/* Collections section */}
          {collections.length > 0 && (
            <section className="space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Collections
                </span>
                <span className="text-xs text-muted-foreground/60 font-mono">{collections.length}</span>
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                {collections.map((col, i) => (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className={`flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors font-mono text-sm ${
                      i !== 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <Folders className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-foreground">{col.name}</span>
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded text-muted-foreground bg-muted">
                      collection
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground/60 font-mono">
                      {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground/60 font-mono">
                      {formatDate(col.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
