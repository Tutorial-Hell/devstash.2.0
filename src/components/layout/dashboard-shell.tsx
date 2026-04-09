"use client"

import { useState } from "react"
import { Toaster } from "sonner"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { ItemDrawerProvider } from "@/components/item-drawer"
import type { ItemTypeWithCount } from "@/lib/db/items"
import type { CollectionWithMeta } from "@/lib/db/collections"

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
}

export function DashboardShell({ children, itemTypes, collections, user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ItemDrawerProvider>
      <Toaster position="bottom-right" />
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
            user={user}
          />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </ItemDrawerProvider>
  )
}
