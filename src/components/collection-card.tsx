"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { useToggleCollectionFavorite } from "@/hooks/use-toggle-collection-favorite"
import { CollectionEditDeleteDialogs } from "@/components/collection-edit-delete-dialogs"
import type { CollectionWithMeta } from "@/lib/db/collections"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  collection: CollectionWithMeta
  children: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CollectionCard({ collection, children }: Props) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { favorite, togglingFavorite, handleToggleFavorite: toggleFavorite } = useToggleCollectionFavorite(collection.id, collection.isFavorite)
  const dropdownRef = useOutsideClick<HTMLDivElement>(() => setDropdownOpen(false), dropdownOpen)

  function handleToggleFavorite() {
    setDropdownOpen(false)
    toggleFavorite()
  }

  return (
    <>
      {/* Outer wrapper — relative but NOT overflow-hidden so the dropdown can escape */}
      <div ref={dropdownRef} className="group relative">
        {/* Card — overflow-hidden kept for the accent bar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/collections/${collection.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              router.push(`/collections/${collection.id}`)
            }
          }}
          className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 hover:border-border/80 hover:bg-card/80 transition-colors relative overflow-hidden cursor-pointer w-full"
        >
          {children}
        </div>

        {/* 3-dot menu — outside overflow-hidden so dropdown renders freely */}
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-muted-foreground hover:bg-accent/50 transition-all"
            aria-label="Collection options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-border bg-popover shadow-md py-1 z-50">
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); setEditOpen(true) }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={togglingFavorite}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Star
                  className="h-3.5 w-3.5"
                  style={favorite ? { fill: "#facc15", color: "#facc15" } : undefined}
                />
                {favorite ? "Unfavorite" : "Favorite"}
              </button>
              <button
                type="button"
                onClick={() => { setDropdownOpen(false); setDeleteOpen(true) }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <CollectionEditDeleteDialogs
        collectionId={collection.id}
        collectionName={collection.name}
        collectionDescription={collection.description}
        editOpen={editOpen}
        deleteOpen={deleteOpen}
        onEditOpenChange={setEditOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleted={() => router.refresh()}
      />
    </>
  )
}
