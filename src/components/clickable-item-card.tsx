"use client"

import { useItemDrawer } from "@/components/item-drawer"

interface Props {
  itemId: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function ClickableItemCard({ itemId, className, style, children }: Props) {
  const { openDrawer } = useItemDrawer()
  return (
    <div className={className} style={style} onClick={() => openDrawer(itemId)}>
      {children}
    </div>
  )
}
