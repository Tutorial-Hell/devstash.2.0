"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { iconMap } from "@/lib/icon-map"
import { CodeEditor } from "@/components/code-editor"
import { MarkdownEditor } from "@/components/markdown-editor"
import { createItem, type CreateItemInput } from "@/actions/items"

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["snippet", "prompt", "command", "note", "link"] as const
type ItemTypeName = (typeof ITEM_TYPES)[number]

const CONTENT_TYPES = new Set<ItemTypeName>(["snippet", "prompt", "command", "note"])
const LANGUAGE_TYPES = new Set<ItemTypeName>(["snippet", "command"])
const MARKDOWN_TYPES = new Set<ItemTypeName>(["note", "prompt"])

const TYPE_META: Record<ItemTypeName, { icon: string; color: string }> = {
  snippet: { icon: "Code",       color: "#3b82f6" },
  prompt:  { icon: "Sparkles",   color: "#8b5cf6" },
  command: { icon: "Terminal",   color: "#f97316" },
  note:    { icon: "StickyNote", color: "#fde047" },
  link:    { icon: "Link",       color: "#10b981" },
}

// ─── TypeDropdown ─────────────────────────────────────────────────────────────

function TypeDropdown({
  value,
  onChange,
}: {
  value: ItemTypeName
  onChange: (t: ItemTypeName) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selected = TYPE_META[value]
  const SelectedIcon = iconMap[selected.icon]

  return (
    <div ref={ref} className="relative w-40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <SelectedIcon className="h-4 w-4 shrink-0" style={{ color: selected.color }} />
        <span className="flex-1 text-left capitalize">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          {ITEM_TYPES.map((t) => {
            const meta = TYPE_META[t]
            const Icon = iconMap[meta.icon]
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false) }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
                <span className="capitalize">{t}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NewItemDialogProps {
  defaultType?: ItemTypeName
}

export function NewItemDialog({ defaultType }: NewItemDialogProps = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) setType(defaultType ?? "snippet")
    setOpen(next)
    if (!next) resetForm()
  }

  // ─── Form state ────────────────────────────────────────────────────────────

  const [type, setType] = useState<ItemTypeName>(defaultType ?? "snippet")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [url, setUrl] = useState("")
  const [language, setLanguage] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const showContent = CONTENT_TYPES.has(type)
  const showLanguage = LANGUAGE_TYPES.has(type)
  const showMarkdown = MARKDOWN_TYPES.has(type)
  const showUrl = type === "link"

  function resetForm() {
    setType("snippet")
    setTitle("")
    setDescription("")
    setContent("")
    setUrl("")
    setLanguage("")
    setTagsInput("")
    setError(null)
    setSaving(false)
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const input: CreateItemInput = {
        type,
        title,
        description: description || null,
        content: content || null,
        url: url || null,
        language: language || null,
        tags,
      }

      const result = await createItem(input)

      if (!result.success) {
        setError(result.error)
        return
      }

      toast.success("Item created.")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {defaultType
          ? `New ${defaultType.charAt(0).toUpperCase() + defaultType.slice(1)}`
          : "New Item"}
      </Button>

      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {error && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          {/* Type selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <TypeDropdown value={type} onChange={setType} />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title"
              className="h-8 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={1}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Content — snippet, prompt, command, note */}
          {showContent && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              {showLanguage ? (
                <CodeEditor
                  value={content}
                  onChange={setContent}
                  language={language || "plaintext"}
                />
              ) : showMarkdown ? (
                <MarkdownEditor value={content} onChange={setContent} />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Item content"
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              )}
            </div>
          )}

          {/* Language — snippet, command */}
          {showLanguage && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Language</label>
              <Input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. typescript"
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* URL — link */}
          {showUrl && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                URL <span className="text-destructive">*</span>
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="h-8 text-sm"
                type="url"
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="react, hooks, typescript"
              className="h-8 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !title.trim()}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
