"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { toggleCollectionFavorite } from "@/actions/collections"

export function useToggleCollectionFavorite(collectionId: string, initialValue: boolean) {
  const router = useRouter()
  const [favorite, setFavorite] = useState(initialValue)
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

  return { favorite, togglingFavorite, handleToggleFavorite }
}
