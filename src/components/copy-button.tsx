"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface Props {
  value: string
  className?: string
}

export function CopyButton({ value, className }: Props) {
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const Icon = copied ? Check : Copy

  return (
    <button
      onClick={handleClick}
      className={`p-1 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors ${className ?? ""}`}
      aria-label="Copy to clipboard"
    >
      <Icon className="h-3 w-3" />
    </button>
  )
}
