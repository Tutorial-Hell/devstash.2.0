"use client"

import { Crown, Loader2, Sparkles } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AiFeatureButtonProps {
  label: string
  isPro: boolean
  isLoading: boolean
  onClick: () => void
  ariaLabel?: string
}

export function AiFeatureButton({
  label,
  isPro,
  isLoading,
  onClick,
  ariaLabel,
}: AiFeatureButtonProps) {
  if (isPro) {
    return (
      <button
        onClick={isLoading ? undefined : onClick}
        disabled={isLoading}
        className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label={ariaLabel ?? label}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className="flex items-center gap-1 text-[11px] text-white/20 cursor-default select-none bg-transparent border-0 p-0"
          aria-label="AI features require Pro subscription"
        >
          <Crown className="h-3.5 w-3.5" />
          {label}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          AI features require Pro subscription
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
