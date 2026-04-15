"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Star, Pin, Copy, Pencil, Trash2, File,
  FolderOpen, Tag as TagIcon, Calendar, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { CodeEditor } from "@/components/code-editor"
import { MarkdownEditor } from "@/components/markdown-editor"
import { formatDate, formatBytes, cn } from "@/lib/utils"
import { deleteItem, toggleItemFavorite } from "@/actions/items"
import type { ItemDetail } from "@/lib/db/items"

// ─── Shared types & constants ─────────────────────────────────────────────────

// Dates come back as ISO strings from the API
export type ItemDetailResponse = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"])
export const LANGUAGE_TYPES = new Set(["snippet", "command"])
export const MARKDOWN_TYPES = new Set(["note", "prompt"])

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

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function BadgeList({ items }: { items: { id: string; name: string }[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
        >
          {item.name}
        </span>
      ))}
    </div>
  )
}

// ─── ViewBody ─────────────────────────────────────────────────────────────────

export function ViewBody({
  item,
  typeName,
  onEdit,
  onClose,
  onUpdate,
}: {
  item: ItemDetailResponse
  typeName: string
  onEdit: () => void
  onClose: () => void
  onUpdate?: (item: ItemDetailResponse) => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  async function handleToggleFavorite() {
    setTogglingFavorite(true)
    try {
      const result = await toggleItemFavorite(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onUpdate?.({ ...item, isFavorite: result.isFavorite })
      router.refresh()
      toast.success(result.isFavorite ? "Added to favorites." : "Removed from favorites.")
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setTogglingFavorite(false)
    }
  }

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
          onClick={handleToggleFavorite}
          disabled={togglingFavorite}
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
        {item.fileUrl && (
          <a
            href={`/api/download/${item.id}`}
            download={item.fileName ?? undefined}
            className="inline-flex items-center gap-1.5 rounded-md px-2 text-xs h-8 font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
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
        {/* Image preview */}
        {typeName === "image" && item.fileUrl && (
          <Section label="Preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/download/${item.id}`}
              alt={item.fileName ?? item.title}
              loading="lazy"
              className="max-h-64 w-full rounded-md object-contain bg-[#1e1e1e] border border-input"
            />
          </Section>
        )}

        {/* File info */}
        {(typeName === "file" || typeName === "image") && item.fileName && (
          <Section label="File">
            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2">
              <File className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-foreground">{item.fileName}</p>
                {item.fileSize && (
                  <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
                )}
              </div>
            </div>
          </Section>
        )}

        {item.description && (
          <Section label="Description">
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </Section>
        )}

        {item.content && (
          <Section label="Content">
            {LANGUAGE_TYPES.has(typeName) ? (
              <CodeEditor
                value={item.content}
                language={item.language ?? "plaintext"}
                readOnly
              />
            ) : MARKDOWN_TYPES.has(typeName) ? (
              <MarkdownEditor value={item.content} readOnly />
            ) : (
              <pre className="text-xs text-foreground bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono">
                {item.content}
              </pre>
            )}
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
            <BadgeList items={item.tags} />
          </Section>
        )}

        {item.collections.length > 0 && (
          <Section label="Collections" icon={<FolderOpen className="h-3.5 w-3.5" />}>
            <BadgeList items={item.collections} />
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
