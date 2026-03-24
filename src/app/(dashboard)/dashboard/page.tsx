import Link from "next/link"
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Star,
  Pin,
  Package,
  FolderOpen,
  Heart,
} from "lucide-react"
import {
  mockItems,
  mockCollections,
  mockItemTypes,
  mockTypeCounts,
} from "@/lib/mock-data"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
}

function getType(id: string) {
  return mockItemTypes.find((t) => t.id === id)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// ─── Derived data ─────────────────────────────────────────────────────────────

const totalItems = Object.values(mockTypeCounts).reduce((a, b) => a + b, 0)
const totalCollections = mockCollections.length
const favoriteItemsCount = mockItems.filter((i) => i.isFavorite).length
const favoriteCollectionsCount = mockCollections.filter((c) => c.isFavorite).length

const pinnedItems = mockItems.filter((i) => i.isPinned)
const recentItems = [...mockItems]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 10)

// ─── Stats ────────────────────────────────────────────────────────────────────

const stats = [
  { label: "Items", value: totalItems, icon: Package, color: "#3b82f6", fill: false },
  { label: "Collections", value: totalCollections, icon: FolderOpen, color: "#8b5cf6", fill: false },
  { label: "Favorite Items", value: favoriteItemsCount, icon: Star, color: "#fde047", fill: true },
  { label: "Favorite Collections", value: favoriteCollectionsCount, icon: Heart, color: "#ef4444", fill: false },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
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
        {stats.map(({ label, value, icon: Icon, color, fill }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className="h-5 w-5 shrink-0"
                style={{ color, ...(fill ? { fill: color } : {}) }}
              />
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
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
          {mockCollections.map((col) => {
            const dominantType = getType(col.dominantTypeId)
            const Icon = dominantType ? (iconMap[dominantType.icon] ?? File) : File
            const accentColor = dominantType?.color ?? "#6b7280"
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
                <p className="text-xs text-muted-foreground/70">
                  {col.itemCount} items
                </p>
                {col.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {col.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
                </div>
              </Link>
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

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: typeof mockItems[number] }) {
  const type = getType(item.itemTypeId)
  const Icon = type ? (iconMap[type.icon] ?? File) : File
  const color = type?.color ?? "#6b7280"

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer">
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
        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.description}
          </p>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
        {formatDate(item.createdAt)}
      </span>
    </div>
  )
}
