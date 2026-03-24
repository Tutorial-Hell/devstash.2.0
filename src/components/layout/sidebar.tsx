"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Star,
  Settings,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  mockUser,
  mockItemTypes,
  mockCollections,
  mockTypeCounts,
} from "@/lib/mock-data"

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
}

function typeToSlug(name: string): string {
  return `${name}s`
}

function SidebarContent({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname()
  const [typesExpanded, setTypesExpanded] = React.useState(true)
  const [collectionsExpanded, setCollectionsExpanded] = React.useState(true)

  const favoriteCollections = mockCollections.filter((c) => c.isFavorite)
  const otherCollections = mockCollections.filter((c) => !c.isFavorite)

  const userInitials = mockUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto py-2">
        {/* Types section header */}
        <div className="px-3 pb-1">
          {isOpen ? (
            <button
              className="flex items-center w-full text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest hover:text-muted-foreground transition-colors"
              onClick={() => setTypesExpanded((v) => !v)}
            >
              Types
              <ChevronDown
                className={cn(
                  "h-3 w-3 ml-auto transition-transform duration-150",
                  !typesExpanded && "-rotate-90"
                )}
              />
            </button>
          ) : (
            <div className="h-4" />
          )}
        </div>

        {/* Types list */}
        {(typesExpanded || !isOpen) && (
          <nav className="space-y-0.5 px-2">
            {mockItemTypes.map((type) => {
              const Icon = iconMap[type.icon] ?? File
              const slug = typeToSlug(type.name)
              const href = `/items/${slug}`
              const count = mockTypeCounts[type.id] ?? 0
              const isActive = pathname === href

              const linkEl = (
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    !isOpen && "justify-center"
                  )}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: type.color }}
                  />
                  {isOpen && (
                    <>
                      <span className="flex-1 capitalize">{slug}</span>
                      <span className="text-xs text-muted-foreground/60">
                        {count}
                      </span>
                    </>
                  )}
                </Link>
              )

              if (!isOpen) {
                return (
                  <Tooltip key={type.id}>
                    <TooltipTrigger render={linkEl} />
                    <TooltipContent side="right">
                      <span className="capitalize">{slug}</span> · {count}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={type.id}>{linkEl}</div>
            })}
          </nav>
        )}

        {/* Collections section */}
        {isOpen && (
          <>
            <div className="px-3 pt-4 pb-1">
              <button
                className="flex items-center w-full text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest hover:text-muted-foreground transition-colors"
                onClick={() => setCollectionsExpanded((v) => !v)}
              >
                Collections
                <ChevronDown
                  className={cn(
                    "h-3 w-3 ml-auto transition-transform duration-150",
                    !collectionsExpanded && "-rotate-90"
                  )}
                />
              </button>
            </div>

            {collectionsExpanded && (
              <div>
                {favoriteCollections.length > 0 && (
                  <>
                    <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                      Favorites
                    </div>
                    <nav className="space-y-0.5 px-2">
                      {favoriteCollections.map((col) => (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                        >
                          <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                          <span className="truncate">{col.name}</span>
                        </Link>
                      ))}
                    </nav>
                  </>
                )}

                {otherCollections.length > 0 && (
                  <>
                    <div className="px-4 py-1 mt-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                      All Collections
                    </div>
                    <nav className="space-y-0.5 px-2">
                      {otherCollections.map((col) => (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                        >
                          <span className="truncate flex-1">{col.name}</span>
                          <span className="text-xs text-muted-foreground/50">
                            {col.itemCount}
                          </span>
                        </Link>
                      ))}
                    </nav>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* User area */}
      <div
        className={cn(
          "border-t border-border p-3 flex items-center gap-2 shrink-0",
          !isOpen && "justify-center"
        )}
      >
        <Avatar size="sm">
          {mockUser.image && (
            <AvatarImage src={mockUser.image} alt={mockUser.name} />
          )}
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        {isOpen && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {mockUser.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {mockUser.email}
              </p>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <Settings className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

interface SidebarProps {
  isOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ isOpen, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-background transition-[width] duration-200 overflow-hidden shrink-0",
          isOpen ? "w-56" : "w-12"
        )}
      >
        <SidebarContent isOpen={isOpen} />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" showCloseButton={false} className="w-56 p-0 gap-0">
          <SidebarContent isOpen={true} />
        </SheetContent>
      </Sheet>
    </>
  )
}
