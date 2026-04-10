import { notFound } from "next/navigation"
import { getDemoUserId } from "@/lib/db/collections"
import { getItemsByType } from "@/lib/db/items"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { Pin, Star, File } from "lucide-react"
import { ClickableItemCard } from "@/components/clickable-item-card"
import { NewItemDialog } from "@/components/new-item-dialog"
import { ImageThumbnailCard } from "@/components/image-thumbnail-card"

const DIALOG_TYPES = new Set(["snippet", "prompt", "command", "note", "link", "file", "image"])

interface Props {
  params: Promise<{ type: string }>
}

export default async function ItemsTypePage({ params }: Props) {
  const userId = await getDemoUserId()

  const { type } = await params
  const { items, itemType } = userId
    ? await getItemsByType(userId, type)
    : { items: [], itemType: null }

  if (!itemType) notFound()

  const Icon = iconMap[itemType.icon] ?? File
  const color = itemType.color
  const typeName = type.replace(/s$/, "")
  const label = typeName.charAt(0).toUpperCase() + typeName.slice(1)
  const dialogType = DIALOG_TYPES.has(typeName) ? typeName as "snippet" | "prompt" | "command" | "note" | "link" | "file" | "image" : null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{label}s</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {dialogType && <NewItemDialog defaultType={dialogType} />}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} yet.</p>
        </div>
      ) : type === "images" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <ImageThumbnailCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <ClickableItemCard
              key={item.id}
              itemId={item.id}
              className="relative overflow-hidden flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: color }} />

              {/* Title row */}
              <div className="flex items-center gap-1.5">
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
          ))}
        </div>
      )}
    </div>
  )
}
