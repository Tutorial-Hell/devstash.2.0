"use client"

import { Check, ChevronDown, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOutsideClick } from "@/hooks/use-outside-click"

interface CollectionSelectProps {
  collections: { id: string; name: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CollectionSelect({
  collections,
  selected,
  onChange,
  open,
  onOpenChange,
}: CollectionSelectProps) {
  const ref = useOutsideClick<HTMLDivElement>(() => onOpenChange(false))

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const label =
    selected.length === 0
      ? "No collections"
      : selected.length === 1
        ? collections.find((c) => c.id === selected[0])?.name ?? "1 collection"
        : `${selected.length} collections`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 text-left", selected.length === 0 && "text-muted-foreground")}>
          {label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
          {collections.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No collections yet</p>
          ) : (
            collections.map((col) => {
              const isSelected = selected.includes(col.id)
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggle(col.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input",
                      isSelected && "bg-primary border-primary"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="flex-1 text-left truncate">{col.name}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
