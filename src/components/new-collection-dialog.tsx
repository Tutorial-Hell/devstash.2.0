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
import { FormField } from "@/components/form-field"

// ─── Component ────────────────────────────────────────────────────────────────

interface NewCollectionDialogProps {
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NewCollectionDialog({ triggerClassName, open: controlledOpen, onOpenChange: controlledOnOpenChange }: NewCollectionDialogProps = {}) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleOpenChange(next: boolean) {
    if (controlledOnOpenChange) controlledOnOpenChange(next)
    else setInternalOpen(next)
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
      handleOpenChange(false)
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
      {controlledOpen === undefined && (
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          onClick={() => handleOpenChange(true)}
        >
          <FolderPlus className="h-4 w-4" />
          New Collection
        </Button>
      )}

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
              onClick={() => handleOpenChange(false)}
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
