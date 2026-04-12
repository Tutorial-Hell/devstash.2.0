import { notFound } from "next/navigation"
import Link from "next/link"
import { Star, Pin, File, ArrowLeft } from "lucide-react"
import { getDemoUserId, getCollectionById } from "@/lib/db/collections"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { ClickableItemCard } from "@/components/clickable-item-card"
import { CollectionDetailActions } from "@/components/collection-detail-actions"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CollectionDetailPage({ params }: Props) {
  const userId = await getDemoUserId()
  const { id } = await params

  const collection = userId ? await getCollectionById(userId, id) : null
  if (!collection) notFound()

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{collection.name}</h1>
          {collection.isFavorite && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <CollectionDetailActions
          collectionId={collection.id}
          collectionName={collection.name}
          collectionDescription={collection.description}
          isFavorite={collection.isFavorite}
        />
      </div>
      {collection.description && (
        <p className="text-sm text-muted-foreground -mt-4">{collection.description}</p>
      )}
      <p className="text-sm text-muted-foreground -mt-4">
        {collection.items.length} {collection.items.length === 1 ? "item" : "items"}
      </p>

      {/* Grid */}
      {collection.items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {collection.items.map((item) => {
            const Icon = iconMap[item.itemType.icon] ?? File
            const color = item.itemType.color
            return (
              <ClickableItemCard
                key={item.id}
                itemId={item.id}
                className="relative overflow-hidden flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: color }} />

                {/* Title row */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="h-3 w-3" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate flex-1">
                    {item.title}
                  </span>
                  {item.isPinned && (
                    <Pin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  )}
                  {item.isFavorite && (
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground/60 shrink-0">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
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
              </ClickableItemCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
