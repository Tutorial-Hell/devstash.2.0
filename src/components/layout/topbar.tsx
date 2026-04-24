"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Search, PanelLeft, Menu, Star, Plus, FolderPlus, FileText, Sparkles } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { NewItemDialog } from "@/components/new-item-dialog"
import { NewCollectionDialog } from "@/components/new-collection-dialog"

interface TopbarProps {
  onToggleSidebar?: () => void
  onMobileMenuOpen?: () => void
  onOpenPalette?: () => void
  isPro?: boolean
}

function CreateMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Create new"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-border bg-background shadow-lg z-50 py-1">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => { setMenuOpen(false); setItemOpen(true) }}
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            New Item
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={() => { setMenuOpen(false); setCollectionOpen(true) }}
          >
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
            New Collection
          </button>
        </div>
      )}

      <NewItemDialog open={itemOpen} onOpenChange={setItemOpen} />
      <NewCollectionDialog open={collectionOpen} onOpenChange={setCollectionOpen} />
    </div>
  )
}

export function Topbar({ onToggleSidebar, onMobileMenuOpen, onOpenPalette, isPro }: TopbarProps) {
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
        <span className="text-[1.2rem]">⚡</span>
        <span className="text-sm font-bold text-foreground">DevStash</span>
      </div>

      {/* Search — mobile: icon only; desktop: full bar */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden ml-auto"
        onClick={onOpenPalette}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>
      <div className="hidden md:flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onOpenPalette}
          className="relative w-full max-w-sm flex items-center h-8 rounded-md bg-muted px-3 gap-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isPro && (
          <Link
            href="/settings?tab=billing"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Upgrade
          </Link>
        )}
        <Link
          href="/favorites"
          aria-label="Favorites"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <Star className="h-4 w-4" />
        </Link>
        <NewCollectionDialog triggerClassName="hidden sm:inline-flex" />
        <div className="hidden sm:block">
          <NewItemDialog />
        </div>
        <div className="sm:hidden">
          <CreateMenu />
        </div>
      </div>
    </header>
  )
}
