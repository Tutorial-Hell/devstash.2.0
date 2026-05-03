"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { toggleItemPin } from "@/actions/items"
import type { ItemDetailResponse } from "@/components/item-drawer-view"

export function useToggleItemPin(
  item: ItemDetailResponse,
  onUpdate?: (item: ItemDetailResponse) => void
) {
  const router = useRouter()
  const [togglingPin, setTogglingPin] = useState(false)

  async function handleTogglePin() {
    setTogglingPin(true)
    try {
      const result = await toggleItemPin(item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onUpdate?.({ ...item, isPinned: result.isPinned })
      router.refresh()
      toast.success(result.isPinned ? "Item pinned." : "Item unpinned.")
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setTogglingPin(false)
    }
  }

  return { togglingPin, handleTogglePin }
}
