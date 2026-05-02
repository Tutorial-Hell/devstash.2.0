import { requireAuth } from "@/lib/auth-utils"
import { getItemById } from "@/lib/db/items"
import { getFromR2 } from "@/lib/r2"
import { apiError } from "@/lib/api-response"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const item = await getItemById(auth.userId, id)

  if (!item) return apiError("Not found", 404)

  if (!item.fileUrl) return apiError("No file attached to this item", 404)

  let body: ReadableStream
  let contentType: string | undefined

  try {
    const result = await getFromR2(item.fileUrl)
    body = result.body
    contentType = result.contentType
  } catch {
    return apiError("Failed to fetch file", 502)
  }

  const isImage = contentType?.startsWith("image/")
  const disposition = isImage
    ? "inline"
    : `attachment; filename="${item.fileName ?? "file"}"; filename*=UTF-8''${encodeURIComponent(item.fileName ?? "file")}`

  return new Response(body, {
    headers: {
      "Content-Type": contentType ?? "application/octet-stream",
      "Content-Disposition": disposition,
      ...(item.fileSize ? { "Content-Length": String(item.fileSize) } : {}),
    },
  })
}
