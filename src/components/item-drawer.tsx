"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { Star, Pin, Copy, Pencil, Trash2, File, FolderOpen, Tag as TagIcon, Calendar } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { ItemDetail } from "@/lib/db/items"

// ─── Types ────────────────────────────────────────────────────────────────────

// Dates come back as ISO strings from the API
type ItemDetailResponse = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

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
            <DrawerBody item={item} onClose={() => setOpen(false)} />
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
}: {
  item: ItemDetailResponse
  onClose: () => void
}) {
  const Icon = iconMap[item.itemType.icon] ?? File
  const color = item.itemType.color

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Type chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon className="h-3 w-3" />
              {item.itemType.name.charAt(0).toUpperCase() + item.itemType.name.slice(1)}s
            </span>
            {item.language && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                {item.language}
              </span>
            )}
          </div>
          {/* Title */}
          <h2 className="text-lg font-semibold text-foreground leading-snug">{item.title}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0 mt-0.5" onClick={onClose}>
          <span className="text-base leading-none">×</span>
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-y border-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 text-xs h-8 px-2",
            item.isFavorite && "text-yellow-400 hover:text-yellow-400"
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
            )}
          />
          Favorite
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
          <Pin className="h-3.5 w-3.5" />
          Pin
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Description */}
        {item.description && (
          <Section label="Description">
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </Section>
        )}

        {/* Content */}
        {item.content && (
          <Section label="Content">
            <pre className="text-xs text-foreground bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {item.content}
            </pre>
          </Section>
        )}

        {/* URL */}
        {item.url && (
          <Section label="URL">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary break-all hover:underline"
            >
              {item.url}
            </a>
          </Section>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <Section label="Tags" icon={<TagIcon className="h-3.5 w-3.5" />}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Collections */}
        {item.collections.length > 0 && (
          <Section label="Collections" icon={<FolderOpen className="h-3.5 w-3.5" />}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.collections.map((col) => (
                <span
                  key={col.id}
                  className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
                >
                  {col.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Details */}
        <Section label="Details" icon={<Calendar className="h-3.5 w-3.5" />}>
          <div className="space-y-1.5">
            <DetailRow label="Created" value={formatDate(new Date(item.createdAt))} />
            <DetailRow label="Updated" value={formatDate(new Date(item.updatedAt))} />
          </div>
        </Section>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {/* Header skeleton */}
      <div className="px-5 pt-5 pb-3 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-48" />
      </div>
      {/* Action bar skeleton */}
      <div className="flex items-center gap-2 px-5 py-2 border-y border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16" />
        ))}
      </div>
      {/* Body skeleton */}
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
