"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_HEIGHT = 400

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">(readOnly ? "preview" : "write")
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-white/[0.06]">
        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {!readOnly && (
            <TabButton active={tab === "write"} onClick={() => setTab("write")}>
              Write
            </TabButton>
          )}
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </TabButton>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          aria-label="Copy content"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Body */}
      <div className="bg-[#1e1e1e] editor-scrollbar" style={{ maxHeight: MAX_HEIGHT, overflowY: "auto" }}>
        {tab === "write" ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Write markdown..."
            className="w-full min-h-[200px] bg-transparent px-4 py-3 text-[13px] text-[#d4d4d4] font-mono placeholder:text-white/20 focus:outline-none resize-none"
            style={{ lineHeight: "1.7" }}
          />
        ) : (
          <div className="px-4 py-3 min-h-[200px]">
            {value.trim() ? (
              <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-[13px] text-white/20 italic">Nothing to preview.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer",
        active
          ? "bg-white/10 text-white/80"
          : "text-white/40 hover:text-white/60"
      )}
    >
      {children}
    </button>
  )
}
