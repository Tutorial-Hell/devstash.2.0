import { Pin, Star } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ClickableItemCard } from "@/components/clickable-item-card"
import { BadgeList } from "@/components/item-drawer-view"

interface ItemGridCardItem {
  id: string
  title: string
  isPinned: boolean
  isFavorite: boolean
  description: string | null
  tags: Array<{ id: string; name: string }>
  createdAt: Date
}

interface Props {
  item: ItemGridCardItem
  color: string
  titlePrefix?: React.ReactNode
  footer?: React.ReactNode
}

export function ItemGridCard({ item, color, titlePrefix, footer }: Props) {
  return (
    <ClickableItemCard
      itemId={item.id}
      className="relative overflow-hidden flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:bg-card/80 transition-colors cursor-pointer"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: color }} />

      {/* Title row */}
      <div className="flex items-center gap-1.5">
        {titlePrefix}
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

      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      )}

      {item.tags.length > 0 && <BadgeList items={item.tags} size="sm" />}

      {footer}
    </ClickableItemCard>
  )
}
