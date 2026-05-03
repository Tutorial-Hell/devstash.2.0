"use client"

import { Download, File, FileText, FileArchive, FileVideo, FileAudio, FileSpreadsheet } from "lucide-react"
import { type ItemWithMeta } from "@/lib/db/items"
import { ClickableItemCard } from "@/components/clickable-item-card"
import { formatDate, formatBytes } from "@/lib/utils"

function getFileIcon(fileName: string | null) {
  if (!fileName) return File
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  if (["pdf", "doc", "docx", "txt", "md", "rtf"].includes(ext)) return FileText
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return FileVideo
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) return FileAudio
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet
  return File
}

interface Props {
  item: ItemWithMeta
}

export function FileListRow({ item }: Props) {
  const FileIcon = getFileIcon(item.fileName)

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    const a = document.createElement("a")
    a.href = `/api/download/${item.id}`
    a.download = item.fileName ?? item.title
    a.click()
  }

  return (
    <ClickableItemCard
      itemId={item.id}
      className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
    >
      {/* File icon */}
      <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />

      {/* Name + meta */}
      <div className="flex-1 min-w-0 flex items-center gap-4 sm:gap-6">
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {item.fileName ?? item.title}
        </span>
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {item.fileSize != null ? formatBytes(item.fileSize) : "—"}
        </span>
        {/* suppressHydrationWarning: toLocaleDateString is timezone-sensitive; server (UTC)
            and browser (local tz) can produce different day strings near UTC midnight */}
        <span className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
          {formatDate(item.createdAt)}
        </span>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Download file"
      >
        <Download className="h-4 w-4" />
      </button>
    </ClickableItemCard>
  )
}
