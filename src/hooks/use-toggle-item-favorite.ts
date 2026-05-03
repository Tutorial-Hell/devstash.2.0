"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { toggleItemFavorite } from "@/actions/items"
import type { ItemDetailResponse } from "@/components/item-drawer-view"

export function useToggleItemFavorite(
  item: ItemDetailResponse,
  onUpdate?: (item: ItemDetailResponse) => void
) {
  const router = useRouter()
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

  return { togglingFavorite, handleToggleFavorite }
}
