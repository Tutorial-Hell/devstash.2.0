"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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
import { updateCollection, deleteCollection } from "@/actions/collections"
import { FormField } from "@/components/form-field"

interface CollectionEditDeleteDialogsProps {
  collectionId: string
  collectionName: string
  collectionDescription: string | null
  editOpen: boolean
  deleteOpen: boolean
  onEditOpenChange: (open: boolean) => void
  onDeleteOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function CollectionEditDeleteDialogs({
  collectionId,
  collectionName,
  collectionDescription,
  editOpen,
  deleteOpen,
  onEditOpenChange,
  onDeleteOpenChange,
  onDeleted,
}: CollectionEditDeleteDialogsProps) {
  const router = useRouter()
  const [name, setName] = useState(collectionName)
  const [description, setDescription] = useState(collectionDescription ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Capture latest prop values so the effect can read them without being a dep
  const latestProps = useRef({ collectionName, collectionDescription })
  latestProps.current = { collectionName, collectionDescription }

  useEffect(() => {
    if (editOpen) {
      setName(latestProps.current.collectionName)
      setDescription(latestProps.current.collectionDescription ?? "")
      setError(null)
    }
  }, [editOpen])

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
      onEditOpenChange(false)
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
      onDeleted()
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setDeleting(false)
      onDeleteOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
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
            <FormField label="Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
                className="h-8 text-sm"
                required
                autoFocus
              />
            </FormField>
            <FormField label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditOpenChange(false)}
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

      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
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
