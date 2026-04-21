import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { uploadToR2 } from "@/lib/r2"

// ─── Allowed types ────────────────────────────────────────────────────────────

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
])

const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
])

const IMAGE_MAX_BYTES = 5 * 1024 * 1024  // 5 MB
const FILE_MAX_BYTES  = 10 * 1024 * 1024 // 10 MB

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!session?.user?.isPro) {
    return NextResponse.json({ error: "File uploads require a Pro plan." }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  const itemType = formData.get("itemType") as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!itemType || !["file", "image"].includes(itemType)) {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 })
  }

  const mimeType = file.type
  const isImage = itemType === "image"

  if (isImage && !IMAGE_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Allowed: png, jpg, gif, webp, svg" },
      { status: 400 }
    )
  }
  if (!isImage && !FILE_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: pdf, txt, md, json, yaml, xml, csv, toml, ini" },
      { status: 400 }
    )
  }

  const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES
  if (file.size > maxBytes) {
    const limitMb = maxBytes / 1024 / 1024
    return NextResponse.json(
      { error: `File too large. Maximum size is ${limitMb} MB` },
      { status: 400 }
    )
  }

  // Generate a unique R2 key
  const ext = file.name.includes(".") ? file.name.split(".").pop()! : ""
  const key = `${userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, mimeType)
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  return NextResponse.json({
    key,
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  })
}
