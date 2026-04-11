"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, X, File, ImageIcon } from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadedFile = {
  key: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface FileUploadProps {
  itemType: "file" | "image"
  onUpload: (file: UploadedFile) => void
  onClear: () => void
  uploaded: UploadedFile | null
}

// ─── UploadedFilePreview ──────────────────────────────────────────────────────

function UploadedFilePreview({
  uploaded,
  previewUrl,
  itemType,
  onClear,
}: {
  uploaded: UploadedFile
  previewUrl: string | null
  itemType: "file" | "image"
  onClear: () => void
}) {
  return (
    <div className="rounded-md border border-input bg-muted/30 px-3 py-2.5">
      {previewUrl ? (
        <div className="relative mb-2 overflow-hidden rounded border border-input">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={uploaded.fileName}
            className="max-h-40 w-full object-contain bg-[#1e1e1e]"
          />
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {itemType === "image" ? (
          <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <File className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm text-foreground">{uploaded.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(uploaded.fileSize)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </button>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUpload({ itemType, onUpload, onClear, uploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const accept = itemType === "image"
    ? ".png,.jpg,.jpeg,.gif,.webp,.svg"
    : ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini"

  const uploadFile = useCallback(async (file: File) => {
    setError(null)
    setProgress(0)
    setPreviewUrl(null)

    // Local preview for images
    if (itemType === "image" && file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      setPreviewUrl(URL.createObjectURL(file))
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("itemType", itemType)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText) as UploadedFile
          setProgress(null)
          onUpload(data)
          resolve()
        } else {
          let message = "Upload failed"
          try {
            message = (JSON.parse(xhr.responseText) as { error: string }).error ?? message
          } catch { /* ignore */ }
          reject(new Error(message))
        }
      })

      xhr.addEventListener("error", () => reject(new Error("Upload failed")))
      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    }).catch((err: Error) => {
      setError(err.message)
      setProgress(null)
      setPreviewUrl(null)
    })
  }, [itemType, onUpload])

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    uploadFile(files[0])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleClear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setError(null)
    setProgress(null)
    if (inputRef.current) inputRef.current.value = ""
    onClear()
  }

  // ─── Uploaded state ──────────────────────────────────────────────────────────

  if (uploaded) {
    return (
      <UploadedFilePreview
        uploaded={uploaded}
        previewUrl={previewUrl}
        itemType={itemType}
        onClear={handleClear}
      />
    )
  }

  // ─── Upload state ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => progress === null && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50 hover:bg-muted/20"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div>
          <p className="text-sm text-foreground">
            {dragging ? "Drop file here" : "Click or drag to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {itemType === "image"
              ? "PNG, JPG, GIF, WEBP, SVG — max 5 MB"
              : "PDF, TXT, MD, JSON, YAML, XML, CSV, TOML — max 10 MB"}
          </p>
        </div>
      </div>

      {progress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
