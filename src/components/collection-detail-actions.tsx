"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Star } from "lucide-react"
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  collectionId: string
  collectionName: string
  collectionDescription: string | null
  isFavorite: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CollectionDetailActions({
  collectionId,
  collectionName,
  collectionDescription,
  isFavorite,
}: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(collectionName)
  const [description, setDescription] = useState(collectionDescription ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favorite, setFavorite] = useState(isFavorite)
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  async function handleToggleFavorite() {
    setTogglingFavorite(true)
    try {
      const result = await toggleCollectionFavorite(collectionId)
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
    setName(collectionName)
    setDescription(collectionDescription ?? "")
    setError(null)
    setEditOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const result = await updateCollection(collectionId, {
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
      const result = await deleteCollection(collectionId)
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete collection.")
        return
      }
      toast.success("Collection deleted.")
      router.push("/collections")
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Favorite */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={handleToggleFavorite}
          disabled={togglingFavorite}
        >
          <Star
            className="h-4 w-4"
            style={favorite ? { fill: "#facc15", color: "#facc15" } : undefined}
          />
        </Button>

        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={openEdit}
          title="Edit collection"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
          title="Delete collection"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
              &ldquo;{collectionName}&rdquo; will be permanently deleted. Items inside will not be deleted.
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
