import { requireAuth } from "@/lib/auth-utils"
import { getItemById } from "@/lib/db/items"
import { apiError, apiSuccess } from "@/lib/api-response"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const item = await getItemById(auth.userId, id)

  if (!item) return apiError("Not found", 404)

  return apiSuccess(item)
}
