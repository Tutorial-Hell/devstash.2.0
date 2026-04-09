"use client"

import { useState } from "react"
import MonacoEditor, { OnMount } from "@monaco-editor/react"
import { Copy, Check } from "lucide-react"
import { cn, normalizeLanguage } from "@/lib/utils"

const MIN_HEIGHT = 80
const MAX_HEIGHT = 400

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  className?: string
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
  className,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const [editorHeight, setEditorHeight] = useState(MIN_HEIGHT)

  const normalizedLang = normalizeLanguage(language)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleMount: OnMount = (editor) => {
    // Set initial height based on content
    const contentHeight = Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, editor.getContentHeight())
    )
    setEditorHeight(contentHeight)

    // Update height as content changes
    editor.onDidContentSizeChange(() => {
      const newHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, editor.getContentHeight())
      )
      setEditorHeight(newHeight)
    })
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      {/* macOS-style header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-white/[0.06]">
        {/* Window dots */}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>

        {/* Language + copy */}
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-[11px] text-white/40 font-mono select-none">
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Monaco editor */}
      <MonacoEditor
        value={value}
        language={normalizedLang}
        theme="vs-dark"
        height={editorHeight}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 12, bottom: 12 },
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          wordWrap: "on",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: editorHeight >= MAX_HEIGHT ? "auto" : "hidden",
            horizontal: "hidden",
            verticalScrollbarSize: 6,
            useShadows: false,
          },
          lineNumbers: "on",
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          renderLineHighlight: readOnly ? "none" : "line",
          cursorBlinking: "smooth",
          contextmenu: false,
        }}
        onChange={(val) => onChange?.(val ?? "")}
        onMount={handleMount}
      />
    </div>
  )
}

