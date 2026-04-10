import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/collections", () => ({
  getDemoUserId: vi.fn(),
}))

vi.mock("@/lib/r2", () => ({
  uploadToR2: vi.fn(),
}))

import { getDemoUserId } from "@/lib/db/collections"
import { uploadToR2 } from "@/lib/r2"
import { POST } from "@/app/api/upload/route"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new Uint8Array(sizeBytes)
  return new File([buffer], name, { type })
}

function makeRequest(file: File, itemType: string): Request {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("itemType", itemType)
  return new Request("http://localhost/api/upload", { method: "POST", body: formData })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.mocked(getDemoUserId).mockReset()
    vi.mocked(uploadToR2).mockReset()
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue(null)

    const file = makeFile("photo.png", "image/png", 100)
    const res = await POST(makeRequest(file, "image"))

    expect(res.status).toBe(401)
  })

  it("returns 400 when no file is provided", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const formData = new FormData()
    formData.append("itemType", "image")
    const req = new Request("http://localhost/api/upload", { method: "POST", body: formData })

    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("No file provided")
  })

  it("returns 400 for invalid itemType", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const file = makeFile("photo.png", "image/png", 100)
    const res = await POST(makeRequest(file, "snippet"))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Invalid item type")
  })

  it("returns 400 for unsupported image MIME type", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const file = makeFile("doc.pdf", "application/pdf", 100)
    const res = await POST(makeRequest(file, "image"))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/unsupported image type/i)
  })

  it("returns 400 for unsupported file MIME type", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const file = makeFile("photo.png", "image/png", 100)
    const res = await POST(makeRequest(file, "file"))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/unsupported file type/i)
  })

  it("returns 400 when image exceeds 5 MB", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const file = makeFile("big.jpg", "image/jpeg", 5 * 1024 * 1024 + 1)
    const res = await POST(makeRequest(file, "image"))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/too large/i)
    expect(body.error).toMatch(/5 MB/)
  })

  it("returns 400 when file exceeds 10 MB", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")

    const file = makeFile("big.pdf", "application/pdf", 10 * 1024 * 1024 + 1)
    const res = await POST(makeRequest(file, "file"))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/too large/i)
    expect(body.error).toMatch(/10 MB/)
  })

  it("returns 500 when R2 upload throws", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(uploadToR2).mockRejectedValue(new Error("R2 error"))

    const file = makeFile("photo.png", "image/png", 100)
    const res = await POST(makeRequest(file, "image"))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Upload failed")
  })

  it("returns key, fileName, fileSize, mimeType on successful image upload", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(uploadToR2).mockResolvedValue(undefined)

    const file = makeFile("photo.png", "image/png", 1024)
    const res = await POST(makeRequest(file, "image"))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.fileName).toBe("photo.png")
    expect(body.fileSize).toBe(1024)
    expect(body.mimeType).toBe("image/png")
    expect(typeof body.key).toBe("string")
    expect(body.key).toMatch(/^user-1\//)
    expect(body.key).toMatch(/\.png$/)
  })

  it("returns key without extension for extensionless file", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(uploadToR2).mockResolvedValue(undefined)

    const file = makeFile("Makefile", "text/plain", 100)
    const res = await POST(makeRequest(file, "file"))

    expect(res.status).toBe(200)
    const body = await res.json()
    // Key should not end with ".Makefile" (full name as ext)
    expect(body.key).not.toMatch(/\.Makefile$/)
  })

  it("passes correct args to uploadToR2", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(uploadToR2).mockResolvedValue(undefined)

    const file = makeFile("data.json", "application/json", 256)
    await POST(makeRequest(file, "file"))

    expect(uploadToR2).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/.+\.json$/),
      expect.any(Buffer),
      "application/json"
    )
  })

  it("accepts all valid image MIME types", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(uploadToR2).mockResolvedValue(undefined)

    const types = [
      { name: "a.png",  type: "image/png" },
      { name: "a.jpg",  type: "image/jpeg" },
      { name: "a.gif",  type: "image/gif" },
      { name: "a.webp", type: "image/webp" },
      { name: "a.svg",  type: "image/svg+xml" },
    ]

    for (const { name, type } of types) {
      vi.mocked(uploadToR2).mockResolvedValue(undefined)
      const res = await POST(makeRequest(makeFile(name, type, 100), "image"))
      expect(res.status).toBe(200)
    }
  })

  it("accepts all valid file MIME types", async () => {
    vi.mocked(getDemoUserId).mockResolvedValue("user-1")
    vi.mocked(uploadToR2).mockResolvedValue(undefined)

    const types = [
      { name: "a.pdf",  type: "application/pdf" },
      { name: "a.txt",  type: "text/plain" },
      { name: "a.md",   type: "text/markdown" },
      { name: "a.json", type: "application/json" },
      { name: "a.yaml", type: "application/x-yaml" },
      { name: "a.yaml", type: "text/yaml" },
      { name: "a.xml",  type: "application/xml" },
      { name: "a.xml",  type: "text/xml" },
      { name: "a.csv",  type: "text/csv" },
      { name: "a.toml", type: "application/toml" },
    ]

    for (const { name, type } of types) {
      vi.mocked(uploadToR2).mockResolvedValue(undefined)
      const res = await POST(makeRequest(makeFile(name, type, 100), "file"))
      expect(res.status).toBe(200)
    }
  })
})
