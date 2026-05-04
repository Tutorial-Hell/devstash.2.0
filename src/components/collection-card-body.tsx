import { Star } from "lucide-react"
import { iconMap } from "@/lib/icon-map"
import type { CollectionWithMeta } from "@/lib/db/collections"

interface Props {
  collection: CollectionWithMeta
  descriptionClamp?: "line-clamp-1" | "line-clamp-2"
}

export function CollectionCardBody({ collection: col, descriptionClamp = "line-clamp-2" }: Props) {
  const accentColor = col.dominantType?.color ?? "#6b7280"

  return (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: accentColor }} />

      <div className="flex items-start justify-between gap-2 pr-6">
        <span className="text-sm font-medium text-foreground leading-tight">{col.name}</span>
        {col.isFavorite && (
          <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400 mt-0.5" />
        )}
      </div>

      {col.description && (
        <p className={`text-xs text-muted-foreground ${descriptionClamp}`}>{col.description}</p>
      )}

      <p className="text-xs text-muted-foreground/70">
        {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
      </p>

      {col.allTypes.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          {col.allTypes.map((t) => {
            const Icon = iconMap[t.icon]
            if (!Icon) return null
            return <Icon key={t.id} className="h-3.5 w-3.5" style={{ color: t.color }} />
          })}
        </div>
      )}
    </>
  )
}
