"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { toggleCollectionFavorite } from "@/actions/collections"
import { CollectionEditDeleteDialogs } from "@/components/collection-edit-delete-dialogs"

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
          onClick={() => setEditOpen(true)}
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

      <CollectionEditDeleteDialogs
        collectionId={collectionId}
        collectionName={collectionName}
        collectionDescription={collectionDescription}
        editOpen={editOpen}
        deleteOpen={deleteOpen}
        onEditOpenChange={setEditOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/collections")}
      />
    </>
  )
}
