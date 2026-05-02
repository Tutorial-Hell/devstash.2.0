import { getSession } from "@/lib/auth-utils"
import { uploadToR2 } from "@/lib/r2"
import { apiError, apiSuccess } from "@/lib/api-response"

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
  const userId = session?.user?.id
  if (!userId) return apiError("Unauthorized", 401)
  if (!session?.user?.isPro) return apiError("File uploads require a Pro plan.", 403)

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return apiError("Invalid form data", 400)
  }

  const file = formData.get("file")
  const itemType = formData.get("itemType") as string | null

  if (!(file instanceof File)) return apiError("No file provided", 400)

  if (!itemType || !["file", "image"].includes(itemType)) {
    return apiError("Invalid item type", 400)
  }

  const mimeType = file.type
  const isImage = itemType === "image"

  if (isImage && !IMAGE_MIME_TYPES.has(mimeType)) {
    return apiError("Unsupported image type. Allowed: png, jpg, gif, webp, svg", 400)
  }
  if (!isImage && !FILE_MIME_TYPES.has(mimeType)) {
    return apiError("Unsupported file type. Allowed: pdf, txt, md, json, yaml, xml, csv, toml, ini", 400)
  }

  const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES
  if (file.size > maxBytes) {
    return apiError(`File too large. Maximum size is ${maxBytes / 1024 / 1024} MB`, 400)
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop()! : ""
  const key = `${userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, mimeType)
  } catch {
    return apiError("Upload failed", 500)
  }

  return apiSuccess({ key, fileName: file.name, fileSize: file.size, mimeType })
}
