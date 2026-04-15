"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateCollection, deleteCollection, toggleCollectionFavorite } from "@/actions/collections"
import type { CollectionWithMeta } from "@/lib/db/collections"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  collection: CollectionWithMeta
  children: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CollectionCard({ collection, children }: Props) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favorite, setFavorite] = useState(collection.isFavorite)
  const [togglingFavorite, setTogglingFavorite] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  async function handleToggleFavorite() {
    setDropdownOpen(false)
    setTogglingFavorite(true)
    try {
      const result = await toggleCollectionFavorite(collection.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setFavorite(result.isFavorite)
      router.refresh()
      toast.success(result.isFavorite ? "Added to favorites." : "Removed from favorites.")
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setTogglingFavorite(false)
    }
  }

  function openEdit() {
    setDropdownOpen(false)
    setName(collection.name)
    setDescription(collection.description ?? "")
    setError(null)
    setEditOpen(true)
  }

  function openDelete() {
    setDropdownOpen(false)
    setDeleteOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const result = await updateCollection(collection.id, {
        name,
        description: description || undefined,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      toast.success("Collection updated.")
      setEditOpen(false)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await deleteCollection(collection.id)
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete collection.")
        return
      }
      toast.success("Collection deleted.")
      router.refresh()
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      {/* Outer wrapper — relative but NOT overflow-hidden so the dropdown can escape */}
      <div ref={dropdownRef} className="group relative">
        {/* Card — overflow-hidden kept for the accent bar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/collections/${collection.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              router.push(`/collections/${collection.id}`)
            }
          }}
          className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 hover:border-border/80 hover:bg-card/80 transition-colors relative overflow-hidden cursor-pointer w-full"
        >
          {children}
        </div>

        {/* 3-dot menu — outside overflow-hidden so dropdown renders freely */}
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-muted-foreground hover:bg-accent/50 transition-all"
            aria-label="Collection options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-border bg-popover shadow-md py-1 z-50">
              <button
                type="button"
                onClick={openEdit}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={togglingFavorite}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Star
                  className="h-3.5 w-3.5"
                  style={favorite ? { fill: "#facc15", color: "#facc15" } : undefined}
                />
                {favorite ? "Unfavorite" : "Favorite"}
              </button>
              <button
                type="button"
                onClick={openDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
            {error && (
              <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
                className="h-8 text-sm"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !name.trim()}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{collection.name}&rdquo; will be permanently deleted. Items inside will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
