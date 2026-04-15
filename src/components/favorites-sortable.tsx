"use client"

import { useState } from "react"
import Link from "next/link"
import { Folders } from "lucide-react"
import type { FavoriteItem } from "@/lib/db/items"
import type { FavoriteCollection } from "@/lib/db/collections"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { ClickableItemCard } from "@/components/clickable-item-card"

type ItemSortValue = "newest" | "name" | "type"
type CollectionSortValue = "newest" | "name"

function sortItems(items: FavoriteItem[], sort: ItemSortValue): FavoriteItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "newest": return b.updatedAt.getTime() - a.updatedAt.getTime()
      case "name":   return a.title.localeCompare(b.title)
      case "type":   return b.itemType.name.localeCompare(a.itemType.name)
    }
  })
}

function sortCollections(
  collections: FavoriteCollection[],
  sort: CollectionSortValue
): FavoriteCollection[] {
  return [...collections].sort((a, b) => {
    switch (sort) {
      case "newest": return b.updatedAt.getTime() - a.updatedAt.getTime()
      case "name":   return a.name.localeCompare(b.name)
    }
  })
}

const selectClass =
  "text-[11px] font-mono bg-muted text-muted-foreground border border-border rounded px-1.5 py-0.5 cursor-pointer hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

export function FavoritesSortable({
  items,
  collections,
}: {
  items: FavoriteItem[]
  collections: FavoriteCollection[]
}) {
  const [itemSort, setItemSort] = useState<ItemSortValue>("newest")
  const [colSort, setColSort] = useState<CollectionSortValue>("newest")

  const sortedItems = sortItems(items, itemSort)
  const sortedCollections = sortCollections(collections, colSort)

  return (
    <div className="space-y-8">
      {/* Items section */}
      {items.length > 0 && (
        <section className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Items
            </span>
            <span className="text-xs text-muted-foreground/60 font-mono">{items.length}</span>
            <select
              className={`ml-auto ${selectClass}`}
              value={itemSort}
              onChange={(e) => setItemSort(e.target.value as ItemSortValue)}
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
            </select>
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            {sortedItems.map((item, i) => {
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
            <select
              className={`ml-auto ${selectClass}`}
              value={colSort}
              onChange={(e) => setColSort(e.target.value as CollectionSortValue)}
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            {sortedCollections.map((col, i) => (
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
  )
}
