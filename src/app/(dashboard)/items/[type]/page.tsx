import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { getItemsByType } from "@/lib/db/items"
import { iconMap } from "@/lib/icon-map"
import { slugToTypeName } from "@/lib/utils"
import { ITEMS_PER_PAGE } from "@/lib/constants"
import { File } from "lucide-react"
import { NewItemDialog } from "@/components/new-item-dialog"
import { ImageThumbnailCard } from "@/components/image-thumbnail-card"
import { FileListRow } from "@/components/file-list-row"
import { CopyButton } from "@/components/copy-button"
import { Pagination } from "@/components/pagination"
import { ItemGridCard } from "@/components/item-grid-card"
import { BackToDashboard } from "@/components/back-to-dashboard"

const DIALOG_TYPES = new Set(["snippet", "prompt", "command", "note", "link", "file", "image"])

interface Props {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ItemsTypePage({ params, searchParams }: Props) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const { type } = await params
  const { page: pageParam } = await searchParams

  const isPro = session?.user?.isPro ?? false
  if ((type === "files" || type === "images") && !isPro) {
    redirect("/upgrade")
  }

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const { items, itemType, total } = userId
    ? await getItemsByType(userId, type, { page, pageSize: ITEMS_PER_PAGE })
    : { items: [], itemType: null, total: 0 }

  if (!itemType) notFound()

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const Icon = iconMap[itemType.icon] ?? File
  const color = itemType.color
  const typeName = slugToTypeName(type)
  const label = typeName.charAt(0).toUpperCase() + typeName.slice(1)
  const dialogType = DIALOG_TYPES.has(typeName) ? typeName as "snippet" | "prompt" | "command" | "note" | "link" | "file" | "image" : null

  return (
    <div className="space-y-6 max-w-5xl">
      <BackToDashboard />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{label}s</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} {total === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {dialogType && <NewItemDialog defaultType={dialogType} />}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} yet.</p>
        </div>
      ) : type === "images" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <ImageThumbnailCard key={item.id} item={item} />
          ))}
        </div>
      ) : type === "files" ? (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <FileListRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <ItemGridCard
              key={item.id}
              item={item}
              color={color}
              footer={
                (item.content ?? item.url) ? (
                  <div className="flex justify-end">
                    <CopyButton value={(item.content ?? item.url)!} />
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={`/items/${type}`} />
    </div>
  )
}
