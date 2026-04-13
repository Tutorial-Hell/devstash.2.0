"use client"

import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { ItemDrawerProvider } from "@/components/item-drawer"
import { CommandPalette } from "@/components/command-palette"
import type { ItemTypeWithCount, SearchableItem } from "@/lib/db/items"
import type { CollectionWithMeta } from "@/lib/db/collections"
import type { SearchableCollection } from "@/components/command-palette"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithMeta[]
  user: SessionUser | null
  searchItems: SearchableItem[]
  searchCollections: SearchableCollection[]
}

export function DashboardShell({
  children,
  itemTypes,
  collections,
  user,
  searchItems,
  searchCollections,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <ItemDrawerProvider>
      <Toaster position="bottom-right" />
      <div className="flex flex-col h-full">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onMobileMenuOpen={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
            itemTypes={itemTypes}
            collections={collections}
            user={user}
          />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={searchItems}
        collections={searchCollections}
      />
    </ItemDrawerProvider>
  )
}
