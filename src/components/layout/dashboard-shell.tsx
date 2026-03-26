"use client"

import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import type { ItemTypeWithCount } from "@/lib/db/items"
import type { CollectionWithMeta } from "@/lib/db/collections"

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithMeta[]
}

export function DashboardShell({ children, itemTypes, collections }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <Topbar
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onMobileMenuOpen={() => setMobileOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          itemTypes={itemTypes}
          collections={collections}
        />
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
