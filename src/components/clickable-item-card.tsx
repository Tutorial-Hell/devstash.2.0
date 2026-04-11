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
    <div
      role="button"
      tabIndex={0}
      className={className}
      style={style}
      onClick={() => openDrawer(itemId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openDrawer(itemId)
        }
      }}
    >
      {children}
    </div>
  )
}
