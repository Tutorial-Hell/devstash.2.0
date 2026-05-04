import { getCollectionsPaginated } from "@/lib/db/collections"
import { getAuthenticatedUserId } from "@/lib/auth-utils"
import { COLLECTIONS_PER_PAGE } from "@/lib/constants"
import { parsePage } from "@/lib/utils"
import { NewCollectionDialog } from "@/components/new-collection-dialog"
import { CollectionCard } from "@/components/collection-card"
import { CollectionCardBody } from "@/components/collection-card-body"
import { Pagination } from "@/components/pagination"
import { BackToDashboard } from "@/components/back-to-dashboard"
import { EmptyState } from "@/components/empty-state"

interface Props {
  searchParams: Promise<{ page?: string }>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CollectionsPage({ searchParams }: Props) {
  const userId = await getAuthenticatedUserId()
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  const { collections, total } = userId
    ? await getCollectionsPaginated(userId, { page, pageSize: COLLECTIONS_PER_PAGE })
    : { collections: [], total: 0 }

  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE)

  return (
    <div className="space-y-6 max-w-5xl">
      <BackToDashboard />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} {total === 1 ? "collection" : "collections"}
          </p>
        </div>
        <NewCollectionDialog />
      </div>

      {/* Grid */}
      {total === 0 ? (
        <EmptyState
          padding="p-12"
          message="No collections yet."
          detail="Create your first collection to organize your items."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col}>
              <CollectionCardBody collection={col} />
            </CollectionCard>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/collections" />
    </div>
  )
}
