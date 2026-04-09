"use client"

import { Search, PanelLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NewItemDialog } from "@/components/new-item-dialog"

interface TopbarProps {
  onToggleSidebar?: () => void
  onMobileMenuOpen?: () => void
}

export function Topbar({ onToggleSidebar, onMobileMenuOpen }: TopbarProps) {
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

      {/* Search */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8 h-8 bg-muted border-0 text-sm"
            readOnly
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          New Collection
        </Button>
        <NewItemDialog />
      </div>
    </header>
  )
}
