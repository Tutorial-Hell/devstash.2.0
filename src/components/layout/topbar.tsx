"use client"

import { Search, PanelLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewItemDialog } from "@/components/new-item-dialog"
import { NewCollectionDialog } from "@/components/new-collection-dialog"

interface TopbarProps {
  onToggleSidebar?: () => void
  onMobileMenuOpen?: () => void
  onOpenPalette?: () => void
}

export function Topbar({ onToggleSidebar, onMobileMenuOpen, onOpenPalette }: TopbarProps) {
  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-4 gap-2 shrink-0">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMobileMenuOpen}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="hidden md:inline-flex"
        onClick={onToggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <span className="text-[16px] font-bold text-white leading-none">DS</span>
        </div>
        <span className="text-sm font-semibold text-foreground">DevStash</span>
      </div>

      {/* Search — opens command palette on click */}
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onOpenPalette}
          className="relative w-full max-w-sm flex items-center h-8 rounded-md bg-muted px-3 gap-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search items...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <NewCollectionDialog triggerClassName="hidden sm:inline-flex" />
        <NewItemDialog />
      </div>
    </header>
  )
}
