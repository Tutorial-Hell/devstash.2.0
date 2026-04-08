import { NextResponse } from "next/server"
import { getDemoUserId } from "@/lib/db/collections"
import { getItemById } from "@/lib/db/items"

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

  return NextResponse.json(item)
}
