import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string
}

export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const href = (n: number) => `${basePath}?page=${n}`
  const pages = buildPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      {page <= 1 ? (
        <span className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground/30 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={href(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pages.map((p, i) =>
        p === null ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground text-sm select-none"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded text-sm transition-colors",
              p === page
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {p}
          </Link>
        )
      )}

      {page >= totalPages ? (
        <span className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground/30 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={href(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function buildPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const range: (number | null)[] = []

  range.push(1)
  if (current - 1 > 2) range.push(null)

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    range.push(i)
  }

  if (current + 1 < total - 1) range.push(null)
  range.push(total)

  return range
}
