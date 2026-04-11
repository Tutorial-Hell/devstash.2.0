"use client"

import { type ItemWithMeta } from "@/lib/db/items"
import { useItemDrawer } from "@/components/item-drawer"

interface Props {
  item: ItemWithMeta
}

export function ImageThumbnailCard({ item }: Props) {
  const { openDrawer } = useItemDrawer()

  return (
    <div
      role="button"
      tabIndex={0}
      className="group rounded-lg border border-border bg-card overflow-hidden cursor-pointer"
      onClick={() => openDrawer(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openDrawer(item.id)
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video overflow-hidden bg-muted">
        {item.fileUrl ? (
          <img
            src={`/api/download/${item.id}`}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No preview
          </div>
        )}
      </div>

      {/* Title */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
      </div>
    </div>
  )
}
