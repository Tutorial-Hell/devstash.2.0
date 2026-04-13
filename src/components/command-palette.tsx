"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Layers } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useItemDrawer } from "@/components/item-drawer"
import { iconMap } from "@/lib/icon-map"
import type { SearchableItem } from "@/lib/db/items"

export type SearchableCollection = {
  id: string
  name: string
  itemCount: number
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SearchableItem[]
  collections: SearchableCollection[]
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  collections,
}: CommandPaletteProps) {
  const router = useRouter()
  const { openDrawer } = useItemDrawer()

  function handleSelectItem(id: string) {
    onOpenChange(false)
    openDrawer(id)
  }

  function handleSelectCollection(id: string) {
    onOpenChange(false)
    router.push(`/collections/${id}`)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={true}>
          <CommandInput placeholder="Search items and collections..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {items.length > 0 && (
              <CommandGroup heading="Items">
                {items.map((item) => {
                  const Icon = iconMap[item.itemType.icon] ?? Layers
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelectItem(item.id)}
                    >
                      <Icon
                        className="shrink-0"
                        style={{ color: item.itemType.color }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{item.title}</span>
                        {item.contentPreview && (
                          <span className="truncate text-xs text-muted-foreground">
                            {item.contentPreview}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {items.length > 0 && collections.length > 0 && <CommandSeparator />}

            {collections.length > 0 && (
              <CommandGroup heading="Collections">
                {collections.map((col) => (
                  <CommandItem
                    key={col.id}
                    value={col.name}
                    onSelect={() => handleSelectCollection(col.id)}
                  >
                    <Layers className="shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{col.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
