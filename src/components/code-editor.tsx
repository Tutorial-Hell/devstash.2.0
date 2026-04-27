"use client"

import { useState, useEffect } from "react"
import MonacoEditor, { OnMount } from "@monaco-editor/react"
import { registerMonacoThemes } from "@/lib/monaco-themes"
import { Copy, Check, ChevronDown, Sparkles, Crown, Loader2 } from "lucide-react"
import { cn, normalizeLanguage } from "@/lib/utils"
import { useEditorPreferences } from "@/contexts/editor-preferences-context"
import { LANGUAGE_OPTIONS } from "@/lib/languages"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const MIN_HEIGHT = 80
const MAX_HEIGHT = 400

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  onLanguageChange?: (lang: string) => void
  readOnly?: boolean
  className?: string
  onExplain?: () => void
  explanation?: string | null
  isExplaining?: boolean
  isPro?: boolean
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  onLanguageChange,
  readOnly = false,
  className,
  onExplain,
  explanation,
  isExplaining,
  isPro,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const [editorHeight, setEditorHeight] = useState(MIN_HEIGHT)
  const [activeTab, setActiveTab] = useState<"code" | "explain">("code")
  const { prefs } = useEditorPreferences()

  const normalizedLang = normalizeLanguage(language)
  const showTabs = explanation != null || isExplaining

  // Auto-switch to explain tab when generation starts
  useEffect(() => {
    if (isExplaining) setActiveTab("explain")
  }, [isExplaining])

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleExplainClick() {
    setActiveTab("explain")
    onExplain?.()
  }

  const handleMount: OnMount = (editor) => {
    const contentHeight = Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, editor.getContentHeight())
    )
    setEditorHeight(contentHeight)

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
        {/* Left: window dots or Code/Explain tabs */}
        <div className="flex items-center gap-1.5">
          {showTabs ? (
            <>
              <button
                onClick={() => setActiveTab("code")}
                className={cn(
                  "text-[11px] font-mono px-2 py-0.5 rounded transition-colors",
                  activeTab === "code"
                    ? "text-white bg-white/10"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab("explain")}
                className={cn(
                  "text-[11px] font-mono px-2 py-0.5 rounded transition-colors",
                  activeTab === "explain"
                    ? "text-white bg-white/10"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                Explain
              </button>
            </>
          ) : (
            <>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </>
          )}
        </div>

        {/* Right: language + copy + explain */}
        <div className="flex items-center gap-2">
          {onLanguageChange ? (
            <div className="relative flex items-center">
              <select
                value={LANGUAGE_OPTIONS.some((o) => o.value === normalizedLang) ? normalizedLang : "plaintext"}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="appearance-none bg-transparent text-[11px] text-white/50 hover:text-white/80 font-mono pr-4 cursor-pointer focus:outline-none transition-colors"
              >
                {LANGUAGE_OPTIONS.map(({ label, value }) => (
                  <option key={value} value={value} className="bg-[#1e1e1e] text-white text-xs">
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 h-2.5 w-2.5 text-white/30 pointer-events-none" />
            </div>
          ) : (
            language && (
              <span className="text-[11px] text-white/40 font-mono select-none">
                {language}
              </span>
            )
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
          {onExplain && (
            isPro ? (
              <button
                onClick={isExplaining ? undefined : handleExplainClick}
                disabled={isExplaining}
                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Explain code"
              >
                {isExplaining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Explain
              </button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="flex items-center gap-1 text-[11px] text-white/20 cursor-default select-none bg-transparent border-0 p-0"
                    aria-label="AI features require Pro subscription"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Explain
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    AI features require Pro subscription
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </div>
      </div>

      {/* Body: Monaco editor or explanation markdown */}
      {activeTab === "explain" && showTabs ? (
        <div
          className="bg-[#1e1e1e] px-4 py-3 overflow-y-auto editor-scrollbar"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        >
          {isExplaining && !explanation ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          ) : (
            <div className="markdown-preview text-sm text-white/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation ?? ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ) : (
        <MonacoEditor
          value={value}
          language={normalizedLang}
          theme={prefs.theme}
          height={editorHeight}
          options={{
            readOnly,
            minimap: { enabled: prefs.minimap },
            scrollBeyondLastLine: false,
            fontSize: prefs.fontSize,
            tabSize: prefs.tabSize,
            lineHeight: Math.round(prefs.fontSize * 1.6),
            padding: { top: 12, bottom: 12 },
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            wordWrap: prefs.wordWrap ? "on" : "off",
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
          beforeMount={registerMonacoThemes}
        />
      )}
    </div>
  )
}
