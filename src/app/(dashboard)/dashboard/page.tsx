import Link from "next/link"
import { Star, Pin, Package, FolderOpen, Heart, File } from "lucide-react"
import { getCollections, getDemoUserId } from "@/lib/db/collections"
import { getPinnedItems, getRecentItems, getItemStats, type ItemWithMeta } from "@/lib/db/items"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { DASHBOARD_COLLECTIONS_LIMIT, DASHBOARD_RECENT_ITEMS_LIMIT } from "@/lib/constants"
import { ClickableItemCard } from "@/components/clickable-item-card"
import { CollectionCard } from "@/components/collection-card"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const userId = await getDemoUserId()

  const [collections, pinnedItems, recentItems, itemStats] = await Promise.all([
    userId ? getCollections(userId) : Promise.resolve([]),
    userId ? getPinnedItems(userId) : Promise.resolve([]),
    userId ? getRecentItems(userId, DASHBOARD_RECENT_ITEMS_LIMIT) : Promise.resolve([]),
    userId ? getItemStats(userId) : Promise.resolve({ totalItems: 0, favoriteItemsCount: 0 }),
  ])

  const totalCollections = collections.length
  const favoriteCollectionsCount = collections.filter((c) => c.isFavorite).length
  const dashboardCollections = collections.slice(0, DASHBOARD_COLLECTIONS_LIMIT)

  const stats = [
    { label: "Items", value: itemStats.totalItems, icon: Package, color: "#3b82f6", fill: false },
    { label: "Collections", value: totalCollections, icon: FolderOpen, color: "#8b5cf6", fill: false },
    { label: "Favorite Items", value: itemStats.favoriteItemsCount, icon: Star, color: "#fde047", fill: true },
    { label: "Favorite Collections", value: favoriteCollectionsCount, icon: Heart, color: "#ef4444", fill: false },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your developer knowledge hub
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dashboardCollections.map((col) => {
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
                <p className="text-xs text-muted-foreground/70">
                  {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                </p>
                {col.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {col.description}
                  </p>
                )}
                {col.allTypes.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {col.allTypes.map((t) => {
                      const Icon = iconMap[t.icon] ?? File
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
      </section>

      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Pinned</h2>
          </div>
          <div className="space-y-2">
            {pinnedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent items */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Recent</h2>
        <div className="space-y-2">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  fill,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  fill: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        <Icon
          className="h-5 w-5 shrink-0"
          style={{ color, ...(fill ? { fill: color } : {}) }}
        />
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: ItemWithMeta }) {
  const { itemType } = item
  const Icon = iconMap[itemType.icon] ?? File
  const color = itemType.color

  return (
    <ClickableItemCard
      itemId={item.id}
      className="relative overflow-hidden flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: color }} />
      {/* Type icon */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">
            {item.title}
          </span>
          {item.isPinned && (
            <Pin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          )}
          {item.isFavorite && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
        {formatDate(item.createdAt)}
      </span>
    </ClickableItemCard>
  )
}
