"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCopy } from "@/hooks/use-copy"
import { AiFeatureButton } from "@/components/ai-feature-button"

const MAX_HEIGHT = 400

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
  onOptimize?: () => void
  optimizedContent?: string | null
  isOptimizing?: boolean
  isPro?: boolean
  onAccept?: (content: string) => void
  onDiscard?: () => void
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
  onOptimize,
  optimizedContent,
  isOptimizing,
  isPro,
  onAccept,
  onDiscard,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">(readOnly ? "preview" : "write")
  const { copied, copy: handleCopy } = useCopy(value)
  const [activeViewTab, setActiveViewTab] = useState<"content" | "optimized">("content")

  const showOptimizeTabs = readOnly && (optimizedContent != null || isOptimizing === true)

  // Auto-switch to optimized tab when optimization starts
  useEffect(() => {
    if (isOptimizing) setActiveViewTab("optimized")
  }, [isOptimizing])

  function handleOptimizeClick() {
    setActiveViewTab("optimized")
    onOptimize?.()
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-white/[0.06]">
        {/* Left: Write/Preview tabs or Content/Optimized tabs */}
        <div className="flex items-center gap-0.5">
          {showOptimizeTabs ? (
            <>
              <TabButton active={activeViewTab === "content"} onClick={() => setActiveViewTab("content")}>
                Content
              </TabButton>
              <TabButton active={activeViewTab === "optimized"} onClick={() => setActiveViewTab("optimized")}>
                Optimized
              </TabButton>
            </>
          ) : (
            <>
              {!readOnly && (
                <TabButton active={tab === "write"} onClick={() => setTab("write")}>
                  Write
                </TabButton>
              )}
              <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
                Preview
              </TabButton>
            </>
          )}
        </div>

        {/* Right: copy + optimize */}
        <div className="flex items-center gap-2">
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
          {onOptimize && (
            <AiFeatureButton
              label="Optimize"
              isPro={isPro ?? false}
              isLoading={isOptimizing ?? false}
              onClick={handleOptimizeClick}
              ariaLabel="Optimize prompt"
            />
          )}
        </div>
      </div>

      {/* Body */}
      {showOptimizeTabs && activeViewTab === "optimized" ? (
        <div className="bg-[#1e1e1e] editor-scrollbar" style={{ maxHeight: MAX_HEIGHT, overflowY: "auto" }}>
          {isOptimizing && !optimizedContent ? (
            <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          ) : (
            <>
              <div className="px-4 py-3 min-h-[200px]">
                <div className="markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {optimizedContent ?? ""}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-white/[0.06]">
                <button
                  onClick={onDiscard}
                  className="px-3 py-1 text-[11px] font-medium rounded text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={() => optimizedContent && onAccept?.(optimizedContent)}
                  className="px-3 py-1 text-[11px] font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Accept
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-[#1e1e1e] editor-scrollbar" style={{ maxHeight: MAX_HEIGHT, overflowY: "auto" }}>
          {showOptimizeTabs || tab === "preview" ? (
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
          ) : (
            <textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="Write markdown..."
              className="w-full min-h-[200px] bg-transparent px-4 py-3 text-[13px] text-[#d4d4d4] font-mono placeholder:text-white/20 focus:outline-none resize-none"
              style={{ lineHeight: "1.7" }}
            />
          )}
        </div>
      )}
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
