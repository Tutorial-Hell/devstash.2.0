"use client"

import { Check, X } from "lucide-react"

interface TagSuggestionsProps {
  suggestions: string[]
  onAccept: (tag: string) => void
  onReject: (tag: string) => void
}

export function TagSuggestions({ suggestions, onAccept, onReject }: TagSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {suggestions.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => onAccept(tag)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-green-500/20 hover:text-green-400 transition-colors"
            aria-label={`Accept tag: ${tag}`}
          >
            <Check className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => onReject(tag)}
            className="rounded-full p-0.5 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            aria-label={`Reject tag: ${tag}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  )
}
