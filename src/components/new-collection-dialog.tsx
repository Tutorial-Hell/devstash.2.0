"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FolderPlus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCollection } from "@/actions/collections"

// ─── Component ────────────────────────────────────────────────────────────────

interface NewCollectionDialogProps {
  triggerClassName?: string
}

export function NewCollectionDialog({ triggerClassName }: NewCollectionDialogProps = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) resetForm()
  }

  function resetForm() {
    setName("")
    setDescription("")
    setError(null)
    setSaving(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const result = await createCollection({
        name,
        description: description || undefined,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      toast.success("Collection created.")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        size="sm"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        <FolderPlus className="h-4 w-4" />
        New Collection
      </Button>

      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          {/* Name */}
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

          {/* Description */}
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
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || !name.trim()}
            >
              {saving ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
