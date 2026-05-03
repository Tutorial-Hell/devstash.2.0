"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { updateItem } from "@/actions/items"
import { fetchCollectionsForSelect } from "@/actions/collections"
import { useItemAiFeatures } from "@/hooks/use-item-ai-features"
import { ItemFormFields } from "@/components/item-form-fields"
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
  const { suggestions, loadingSuggestions, loadingDescription, handleGenerateDescription, handleSuggestTags, acceptTag, rejectTag } = useItemAiFeatures({
    title,
    content,
    url,
    type: typeName,
    tagsInput,
    setTagsInput,
    setDescription,
  })

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

        <ItemFormFields
          title={title}
          description={description}
          content={content}
          url={url}
          language={language}
          tagsInput={tagsInput}
          selectedCollectionIds={selectedCollectionIds}
          collectionSelectOpen={collectionSelectOpen}
          collections={allCollections}
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
          spacing="normal"
          descriptionRows={2}
          contentRows={8}
          resizableContent
          showTagsHint
        />

        <div className="space-y-1.5 pt-1 border-t border-border">
          <DetailRow label="Created" value={formatDate(new Date(item.createdAt))} />
          <DetailRow label="Updated" value={formatDate(new Date(item.updatedAt))} />
        </div>
      </div>
    </>
  )
}
