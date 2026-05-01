"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Plus, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { iconMap } from "@/lib/icon-map"
import { createItem, type CreateItemInput } from "@/actions/items"
import { generateAutoTags, generateDescription } from "@/actions/ai"
import { fetchCollectionsForSelect } from "@/actions/collections"
import { FileUpload, type UploadedFile } from "@/components/file-upload"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { ItemFormFields } from "@/components/item-form-fields"
import { FormField } from "@/components/form-field"

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["snippet", "prompt", "command", "note", "link", "file", "image"] as const
type ItemTypeName = (typeof ITEM_TYPES)[number]

const CONTENT_TYPES = new Set<ItemTypeName>(["snippet", "prompt", "command", "note"])
const LANGUAGE_TYPES = new Set<ItemTypeName>(["snippet", "command"])
const MARKDOWN_TYPES = new Set<ItemTypeName>(["note", "prompt"])
const FILE_TYPES = new Set<ItemTypeName>(["file", "image"])

const TYPE_META: Record<ItemTypeName, { icon: string; color: string }> = {
  snippet: { icon: "Code",       color: "#3b82f6" },
  prompt:  { icon: "Sparkles",   color: "#8b5cf6" },
  command: { icon: "Terminal",   color: "#f97316" },
  note:    { icon: "StickyNote", color: "#fde047" },
  link:    { icon: "Link",       color: "#10b981" },
  file:    { icon: "File",       color: "#64748b" },
  image:   { icon: "Image",      color: "#ec4899" },
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
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false))

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
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NewItemDialog({ defaultType, open: controlledOpen, onOpenChange: controlledOnOpenChange }: NewItemDialogProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const isPro = session?.user?.isPro ?? false
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen

  function handleOpenChange(next: boolean) {
    if (next) setType(defaultType ?? "snippet")
    if (controlledOnOpenChange) controlledOnOpenChange(next)
    else setInternalOpen(next)
    if (!next) resetForm()
  }

  useEffect(() => {
    if (open) {
      fetchCollectionsForSelect().then(setCollections)
    }
  }, [open])

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

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)

  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [collectionSelectOpen, setCollectionSelectOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState(false)

  const showContent = CONTENT_TYPES.has(type)
  const showLanguage = LANGUAGE_TYPES.has(type)
  const showMarkdown = MARKDOWN_TYPES.has(type)
  const showUrl = type === "link"
  const showFileUpload = FILE_TYPES.has(type)

  function handleTypeChange(newType: ItemTypeName) {
    if (!FILE_TYPES.has(newType)) setUploadedFile(null)
    setType(newType)
  }

  function resetForm() {
    setType(defaultType ?? "snippet")
    setTitle("")
    setDescription("")
    setContent("")
    setUrl("")
    setLanguage("")
    setTagsInput("")
    setUploadedFile(null)
    setSelectedCollectionIds([])
    setCollectionSelectOpen(false)
    setSuggestions([])
    setError(null)
    setSaving(false)
  }

  // ─── Description generation ────────────────────────────────────────────────

  async function handleGenerateDescription() {
    setLoadingDescription(true)
    const result = await generateDescription({
      title,
      type,
      content: content || null,
      url: url || null,
    })
    setLoadingDescription(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setDescription(result.description)
  }

  // ─── Tag suggestions ───────────────────────────────────────────────────────

  async function handleSuggestTags() {
    setLoadingSuggestions(true)
    const result = await generateAutoTags({ title, content: content || null, type })
    setLoadingSuggestions(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    const existing = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    setSuggestions(result.tags.filter((t) => !existing.includes(t)))
  }

  function acceptTag(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag))
    setTagsInput((prev) => {
      const existing = prev.split(",").map((t) => t.trim()).filter(Boolean)
      if (existing.map((t) => t.toLowerCase()).includes(tag.toLowerCase())) return prev
      return [...existing, tag].join(", ")
    })
  }

  function rejectTag(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag))
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
        fileUrl: uploadedFile?.key ?? null,
        fileName: uploadedFile?.fileName ?? null,
        fileSize: uploadedFile?.fileSize ?? null,
        language: language || null,
        tags,
        collectionIds: selectedCollectionIds,
      }

      const result = await createItem(input)

      if (!result.success) {
        setError(result.error)
        return
      }

      toast.success("Item created.")
      handleOpenChange(false)
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
      {controlledOpen === undefined && (
        <Button
          size="sm"
          aria-label={defaultType ? `New ${defaultType.charAt(0).toUpperCase() + defaultType.slice(1)}` : "New Item"}
          onClick={() => handleOpenChange(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">
            {defaultType
              ? `New ${defaultType.charAt(0).toUpperCase() + defaultType.slice(1)}`
              : "New Item"}
          </span>
        </Button>
      )}

      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          {error && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2 mb-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {/* Type selector */}
            <FormField label="Type">
              <TypeDropdown value={type} onChange={handleTypeChange} />
            </FormField>

            <ItemFormFields
              title={title}
              description={description}
              content={content}
              url={url}
              language={language}
              tagsInput={tagsInput}
              selectedCollectionIds={selectedCollectionIds}
              collectionSelectOpen={collectionSelectOpen}
              collections={collections}
              suggestions={suggestions}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onContentChange={setContent}
              onUrlChange={setUrl}
              onLanguageChange={setLanguage}
              onTagsInputChange={setTagsInput}
              onCollectionIdsChange={setSelectedCollectionIds}
              onCollectionSelectOpenChange={setCollectionSelectOpen}
              onAcceptTag={acceptTag}
              onRejectTag={rejectTag}
              showContent={showContent}
              showLanguage={showLanguage}
              showMarkdown={showMarkdown}
              showUrl={showUrl}
              isPro={isPro}
              onGenerateDescription={handleGenerateDescription}
              loadingDescription={loadingDescription}
              onSuggestTags={handleSuggestTags}
              loadingSuggestions={loadingSuggestions}
              titleRequired
              urlLabelRequired
              descriptionRows={1}
              contentRows={3}
              afterDescriptionSlot={
                showFileUpload ? (
                  <FormField label={type === "image" ? "Image" : "File"} required>
                    <FileUpload
                      itemType={type as "file" | "image"}
                      uploaded={uploadedFile}
                      onUpload={setUploadedFile}
                      onClear={() => setUploadedFile(null)}
                    />
                  </FormField>
                ) : undefined
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || !title.trim() || (showFileUpload && !uploadedFile)}
            >
              {saving ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
