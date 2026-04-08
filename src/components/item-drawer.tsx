"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Star, Pin, Copy, Pencil, Trash2, File,
  FolderOpen, Tag as TagIcon, Calendar,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { iconMap } from "@/lib/icon-map"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { updateItem, deleteItem } from "@/actions/items"
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

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"])
const LANGUAGE_TYPES = new Set(["snippet", "command"])

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

  function enterEdit() { setEditMode(true) }
  function exitEdit() { setEditMode(false) }

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
          onCancel={exitEdit}
          onSaved={(updated) => {
            onUpdate(updated)
            exitEdit()
          }}
        />
      ) : (
        <ViewBody
          item={item}
          onEdit={enterEdit}
          onClose={onClose}
        />
      )}
    </>
  )
}

// ─── View mode ────────────────────────────────────────────────────────────────

function ViewBody({
  item,
  onEdit,
  onClose,
}: {
  item: ItemDetailResponse
  onEdit: () => void
  onClose: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await deleteItem(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onClose()
      router.refresh()
      toast.success("Item deleted.")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
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
          <Star className={cn("h-3.5 w-3.5", item.isFavorite ? "fill-yellow-400 text-yellow-400" : "")} />
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
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <div className="flex-1" />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleting}
              />
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete item?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{item.title}&rdquo; will be permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {item.description && (
          <Section label="Description">
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </Section>
        )}

        {item.content && (
          <Section label="Content">
            <pre className="text-xs text-foreground bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {item.content}
            </pre>
          </Section>
        )}

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

// ─── Edit mode ────────────────────────────────────────────────────────────────

function EditBody({
  item,
  typeName,
  onCancel,
  onSaved,
}: {
  item: ItemDetailResponse
  typeName: string
  onCancel: () => void
  onSaved: (updated: ItemDetailResponse) => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? "")
  const [content, setContent] = useState(item.content ?? "")
  const [url, setUrl] = useState(item.url ?? "")
  const [language, setLanguage] = useState(item.language ?? "")
  const [tagsInput, setTagsInput] = useState(item.tags.map((t) => t.name).join(", "))

  const showContent = CONTENT_TYPES.has(typeName)
  const showLanguage = LANGUAGE_TYPES.has(typeName)
  const showUrl = typeName === "link"

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const result = await updateItem(item.id, {
        title,
        description: description || null,
        content: content || null,
        url: url || null,
        language: language || null,
        tags,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      // Convert Date fields back to ISO strings to match ItemDetailResponse
      const updated: ItemDetailResponse = {
        ...result.data,
        createdAt: new Date(result.data.createdAt).toISOString(),
        updatedAt: new Date(result.data.updatedAt).toISOString(),
      }

      toast.success("Item saved.")
      router.refresh()
      onSaved(updated)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Edit action bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-y border-border">
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      {/* Edit form */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {error && (
          <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title"
            className="h-8 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {/* Content — snippet, prompt, command, note */}
        {showContent && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Item content"
              rows={8}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
          </div>
        )}

        {/* Language — snippet, command */}
        {showLanguage && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Language</label>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. typescript"
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* URL — link */}
        {showUrl && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="h-8 text-sm"
              type="url"
            />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tags</label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, hooks, typescript"
            className="h-8 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">Comma-separated</p>
        </div>

        {/* Non-editable: collections + dates */}
        {item.collections.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Collections</p>
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
          </div>
        )}

        <div className="space-y-1.5 pt-1 border-t border-border">
          <DetailRow label="Created" value={formatDate(new Date(item.createdAt))} />
          <DetailRow label="Updated" value={formatDate(new Date(item.updatedAt))} />
        </div>
      </div>
    </>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
