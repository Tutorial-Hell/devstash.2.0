"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Star, ChevronDown, LogOut, User } from "lucide-react"
import { signOutAction } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { UserAvatar } from "@/components/user-avatar"
import type { ItemTypeWithCount } from "@/lib/db/items"
import type { CollectionWithMeta } from "@/lib/db/collections"
import { iconMap } from "@/lib/icon-map"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

function typeToSlug(name: string): string {
  return `${name}s`
}

function UserMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="absolute bottom-full left-0 mb-1 w-44 rounded-md border border-border bg-popover shadow-md py-1 z-50">
      <Link
        href="/profile"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <User className="h-3.5 w-3.5" />
        Profile
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </form>
    </div>
  )
}

function CollectionSection({
  title,
  collections,
  onNavigate,
}: {
  title: string
  collections: CollectionWithMeta[]
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
        {title}
      </div>
      <nav className="space-y-0.5 px-2">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.id}`}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            {title === "Favorites" ? (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            ) : col.dominantType ? (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: col.dominantType.color }}
              />
            ) : (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/30" />
            )}
            <span className="truncate flex-1">{col.name}</span>
            {title !== "Favorites" && (
              <span className="text-xs text-muted-foreground/50">{col.itemCount}</span>
            )}
          </Link>
        ))}
      </nav>
    </>
  )
}

interface SidebarContentProps {
  isOpen: boolean
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithMeta[]
  user: SessionUser | null
}

function SidebarContent({ isOpen, itemTypes, collections, user }: SidebarContentProps) {
  const pathname = usePathname()
  const [typesExpanded, setTypesExpanded] = React.useState(true)
  const [collectionsExpanded, setCollectionsExpanded] = React.useState(true)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const collapsedMenuRef = React.useRef<HTMLDivElement>(null)

  const favoriteCollections = collections.filter((c) => c.isFavorite)
  const otherCollections = collections.filter((c) => !c.isFavorite)

  React.useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const inExpanded = menuRef.current?.contains(target)
      const inCollapsed = collapsedMenuRef.current?.contains(target)
      if (!inExpanded && !inCollapsed) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

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
            {itemTypes.map((type) => {
              const Icon = iconMap[type.icon] ?? File
              const slug = typeToSlug(type.name)
              const href = `/items/${slug}`
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
                      {(type.name === "file" || type.name === "image") && (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px] font-semibold tracking-wide text-muted-foreground/70">
                          PRO
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground/60">
                        {type.count}
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
                      <span className="capitalize">{slug}</span> · {type.count}
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
                  <CollectionSection title="Favorites" collections={favoriteCollections} />
                )}

                {otherCollections.length > 0 && (
                  <div className="mt-2">
                    <CollectionSection title="All Collections" collections={otherCollections} />
                  </div>
                )}

                <div className="px-2 pt-2">
                  <Link
                    href="/collections"
                    className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    View all collections
                  </Link>
                </div>

                {/* User area (expanded) */}
                <div ref={menuRef} className="px-2 pt-4 pb-2 relative">
                  {menuOpen && (
                    <UserMenu onNavigate={() => setMenuOpen(false)} />
                  )}
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors"
                  >
                    <UserAvatar name={user?.name} image={user?.image} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-foreground truncate">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user?.email ?? ""}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User avatar (collapsed state only) */}
      {!isOpen && (
        <div
          ref={collapsedMenuRef}
          className="border-t border-border shrink-0 relative flex justify-center"
        >
          {menuOpen && (
            <UserMenu onNavigate={() => setMenuOpen(false)} />
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center p-3 hover:bg-accent/50 transition-colors"
          >
            <UserAvatar name={user?.name} image={user?.image} size="sm" />
          </button>
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  isOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithMeta[]
  user: SessionUser | null
}

export function Sidebar({ isOpen, mobileOpen, onMobileClose, itemTypes, collections, user }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-background transition-[width] duration-200 overflow-hidden shrink-0",
          isOpen ? "w-56" : "w-12"
        )}
      >
        <SidebarContent isOpen={isOpen} itemTypes={itemTypes} collections={collections} user={user} />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" showCloseButton={false} className="w-56 p-0 gap-0">
          <SidebarContent isOpen={true} itemTypes={itemTypes} collections={collections} user={user} />
        </SheetContent>
      </Sheet>
    </>
  )
}
