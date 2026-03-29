import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-5 shrink-0 rounded-sm" />
              <Skeleton className="h-7 w-8" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 relative overflow-hidden"
            >
              {/* Accent bar */}
              <Skeleton className="absolute left-0 top-0 bottom-0 w-0.5 rounded-none" />
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-40" />
              <div className="flex items-center gap-1.5 mt-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-3.5 w-3.5 rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pinned items */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <ItemRowSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Recent items */}
      <section>
        <Skeleton className="h-5 w-16 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <ItemRowSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ItemRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {/* Type icon */}
      <Skeleton className="mt-0.5 h-7 w-7 shrink-0 rounded-md" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      </div>

      {/* Date */}
      <Skeleton className="h-3.5 w-10 shrink-0 mt-0.5" />
    </div>
  )
}
