"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Sparkles, Wand2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeEditor } from "@/components/code-editor"
import { MarkdownEditor } from "@/components/markdown-editor"
import { formatDate } from "@/lib/utils"
import { updateItem } from "@/actions/items"
import { generateAutoTags, generateDescription } from "@/actions/ai"
import { fetchCollectionsForSelect } from "@/actions/collections"
import { CollectionSelect } from "@/components/collection-select"
import { TagSuggestions } from "@/components/tag-suggestions"
import {
  type ItemDetailResponse,
  CONTENT_TYPES,
  LANGUAGE_TYPES,
  MARKDOWN_TYPES,
  DetailRow,
} from "@/components/item-drawer-view"

// ─── EditBody ─────────────────────────────────────────────────────────────────

export function EditBody({
  item,
  typeName,
  onCancel,
  onSaved,
}: {
  item: ItemDetailResponse
  typeName: string
  onCancel: () => void
  onSaved: (updated: ItemDetailResponse) => void
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const isPro = session?.user?.isPro ?? false
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? "")
  const [content, setContent] = useState(item.content ?? "")
  const [url, setUrl] = useState(item.url ?? "")
  const [language, setLanguage] = useState(item.language ?? "")
  const [tagsInput, setTagsInput] = useState(item.tags.map((t) => t.name).join(", "))
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState(false)

  const [allCollections, setAllCollections] = useState<{ id: string; name: string }[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    item.collections.map((c) => c.id)
  )
  const [collectionSelectOpen, setCollectionSelectOpen] = useState(false)

  useEffect(() => {
    fetchCollectionsForSelect().then(setAllCollections)
  }, [])

  const showContent = CONTENT_TYPES.has(typeName)
  const showLanguage = LANGUAGE_TYPES.has(typeName)
  const showMarkdown = MARKDOWN_TYPES.has(typeName)
  const showUrl = typeName === "link"

  async function handleGenerateDescription() {
    setLoadingDescription(true)
    const result = await generateDescription({
      title,
      type: typeName,
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

  async function handleSuggestTags() {
    setLoadingSuggestions(true)
    const result = await generateAutoTags({ title, content: content || null, type: typeName })
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

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const result = await updateItem(item.id, {
        title,
        description: description || null,
        content: content || null,
        url: url || null,
        language: language || null,
        tags,
        collectionIds: selectedCollectionIds,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      const updated: ItemDetailResponse = {
        ...result.data,
        createdAt: new Date(result.data.createdAt).toISOString(),
        updatedAt: new Date(result.data.updatedAt).toISOString(),
      }

      toast.success("Item saved.")
      router.refresh()
      onSaved(updated)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Edit action bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-y border-border">
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      {/* Edit form */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {error && (
          <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title"
            className="h-8 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            {isPro && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={handleGenerateDescription}
                disabled={loadingDescription || !title.trim()}
              >
                {loadingDescription
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Wand2 className="h-3 w-3" />
                }
                {loadingDescription ? "Generating…" : "Generate"}
              </Button>
            )}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {/* Content — snippet, prompt, command, note */}
        {showContent && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Content</label>
            {showLanguage ? (
              <CodeEditor
                value={content}
                onChange={setContent}
                language={language || "plaintext"}
                onLanguageChange={setLanguage}
              />
            ) : showMarkdown ? (
              <MarkdownEditor value={content} onChange={setContent} />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Item content"
                rows={8}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
              />
            )}
          </div>
        )}

        {/* URL — link */}
        {showUrl && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">URL</label>
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            {isPro && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={handleSuggestTags}
                disabled={loadingSuggestions || !title.trim()}
              >
                <Sparkles className="h-3 w-3" />
                {loadingSuggestions ? "Suggesting…" : "Suggest Tags"}
              </Button>
            )}
          </div>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, hooks, typescript"
            className="h-8 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">Comma-separated</p>
          <TagSuggestions suggestions={suggestions} onAccept={acceptTag} onReject={rejectTag} />
        </div>

        {/* Collections */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Collections</label>
          <CollectionSelect
            collections={allCollections}
            selected={selectedCollectionIds}
            onChange={setSelectedCollectionIds}
            open={collectionSelectOpen}
            onOpenChange={setCollectionSelectOpen}
          />
        </div>

        <div className="space-y-1.5 pt-1 border-t border-border">
          <DetailRow label="Created" value={formatDate(new Date(item.createdAt))} />
          <DetailRow label="Updated" value={formatDate(new Date(item.updatedAt))} />
        </div>
      </div>
    </>
  )
}
