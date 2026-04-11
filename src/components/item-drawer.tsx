"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { File } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { iconMap } from "@/lib/icon-map"
import { cn } from "@/lib/utils"
import { ViewBody, type ItemDetailResponse } from "@/components/item-drawer-view"
import { EditBody } from "@/components/item-drawer-edit"

// ─── Context ──────────────────────────────────────────────────────────────────

interface ItemDrawerContextValue {
  openDrawer: (id: string) => void
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null)

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerContext)
  if (!ctx) throw new Error("useItemDrawer must be used within ItemDrawerProvider")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const openDrawer = useCallback(async (id: string) => {
    setOpen(true)
    setItem(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/items/${id}`)
      if (res.ok) {
        setItem(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <ItemDrawerContext.Provider value={{ openDrawer }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 sm:max-w-[480px]"
        >
          {loading ? (
            <DrawerSkeleton />
          ) : item ? (
            <DrawerBody
              item={item}
              onClose={() => setOpen(false)}
              onUpdate={(updated) => setItem(updated)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </ItemDrawerContext.Provider>
  )
}

// ─── Drawer body ──────────────────────────────────────────────────────────────

function DrawerBody({
  item,
  onClose,
  onUpdate,
}: {
  item: ItemDetailResponse
  onClose: () => void
  onUpdate: (item: ItemDetailResponse) => void
}) {
  const [editMode, setEditMode] = useState(false)
  const Icon = iconMap[item.itemType.icon] ?? File
  const color = item.itemType.color
  const typeName = item.itemType.name.toLowerCase()

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon className="h-3 w-3" />
              {item.itemType.name.charAt(0).toUpperCase() + item.itemType.name.slice(1)}s
            </span>
            {item.language && !editMode && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                {item.language}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-foreground leading-snug">{item.title}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0 mt-0.5" onClick={onClose}>
          <span className="text-base leading-none">×</span>
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {editMode ? (
        <EditBody
          item={item}
          typeName={typeName}
          onCancel={() => setEditMode(false)}
          onSaved={(updated) => {
            onUpdate(updated)
            setEditMode(false)
          }}
        />
      ) : (
        <ViewBody
          item={item}
          typeName={typeName}
          onEdit={() => setEditMode(true)}
          onClose={onClose}
        />
      )}
    </>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      <div className="px-5 pt-5 pb-3 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex items-center gap-2 px-5 py-2 border-y border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16" />
        ))}
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Re-export the unused `cn` suppressor — cn is still needed by DrawerBody callers
export { cn }
