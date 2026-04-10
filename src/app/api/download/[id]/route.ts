import { NextResponse } from "next/server"
import { getDemoUserId } from "@/lib/db/collections"
import { getItemById } from "@/lib/db/items"
import { getFromR2 } from "@/lib/r2"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDemoUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const item = await getItemById(userId, id)

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!item.fileUrl) {
    return NextResponse.json({ error: "No file attached to this item" }, { status: 404 })
  }

  let body: ReadableStream
  let contentType: string | undefined

  try {
    const result = await getFromR2(item.fileUrl)
    body = result.body
    contentType = result.contentType
  } catch {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 })
  }

  const isImage = contentType?.startsWith("image/")
  const disposition = isImage
    ? "inline"
    : `attachment; filename="${encodeURIComponent(item.fileName ?? "file")}"`

  return new Response(body, {
    headers: {
      "Content-Type": contentType ?? "application/octet-stream",
      "Content-Disposition": disposition,
      ...(item.fileSize ? { "Content-Length": String(item.fileSize) } : {}),
    },
  })
}
