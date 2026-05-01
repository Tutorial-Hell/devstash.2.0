"use client"

import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeEditor } from "@/components/code-editor"
import { MarkdownEditor } from "@/components/markdown-editor"
import { CollectionSelect } from "@/components/collection-select"
import { TagSuggestions } from "@/components/tag-suggestions"
import { FormField } from "@/components/form-field"

interface ItemFormFieldsProps {
  title: string
  description: string
  content: string
  url: string
  language: string
  tagsInput: string
  selectedCollectionIds: string[]
  collectionSelectOpen: boolean
  collections: { id: string; name: string }[]
  suggestions: string[]

  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onContentChange: (v: string) => void
  onUrlChange: (v: string) => void
  onLanguageChange: (v: string) => void
  onTagsInputChange: (v: string) => void
  onCollectionIdsChange: (ids: string[]) => void
  onCollectionSelectOpenChange: (open: boolean) => void
  onAcceptTag: (tag: string) => void
  onRejectTag: (tag: string) => void

  showContent: boolean
  showLanguage: boolean
  showMarkdown: boolean
  showUrl: boolean

  isPro: boolean
  onGenerateDescription?: () => void
  loadingDescription?: boolean
  onSuggestTags?: () => void
  loadingSuggestions?: boolean

  spacing?: "tight" | "normal"
  titleRequired?: boolean
  urlLabelRequired?: boolean
  descriptionRows?: number
  contentRows?: number
  resizableContent?: boolean
  showTagsHint?: boolean
  afterDescriptionSlot?: React.ReactNode
}

export function ItemFormFields({
  title,
  description,
  content,
  url,
  language,
  tagsInput,
  selectedCollectionIds,
  collectionSelectOpen,
  collections,
  suggestions,
  onTitleChange,
  onDescriptionChange,
  onContentChange,
  onUrlChange,
  onLanguageChange,
  onTagsInputChange,
  onCollectionIdsChange,
  onCollectionSelectOpenChange,
  onAcceptTag,
  onRejectTag,
  showContent,
  showLanguage,
  showMarkdown,
  showUrl,
  isPro,
  onGenerateDescription,
  loadingDescription = false,
  onSuggestTags,
  loadingSuggestions = false,
  spacing = "tight",
  titleRequired,
  urlLabelRequired,
  descriptionRows = 1,
  contentRows = 3,
  resizableContent = false,
  showTagsHint = false,
  afterDescriptionSlot,
}: ItemFormFieldsProps) {
  const spaceClass = spacing === "tight" ? "space-y-1" : "space-y-1.5"

  return (
    <>
      {/* Title */}
      <FormField label="Title" required={titleRequired} spacing={spacing}>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Item title"
          className="h-8 text-sm"
          required={titleRequired}
        />
      </FormField>

      {/* Description */}
      <div className={spaceClass}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          {isPro && onGenerateDescription && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={onGenerateDescription}
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
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
          rows={descriptionRows}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      {afterDescriptionSlot}

      {/* Content */}
      {showContent && (
        <FormField label="Content" spacing={spacing}>
          {showLanguage ? (
            <CodeEditor
              value={content}
              onChange={onContentChange}
              language={language || "plaintext"}
              onLanguageChange={onLanguageChange}
            />
          ) : showMarkdown ? (
            <MarkdownEditor value={content} onChange={onContentChange} />
          ) : (
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Item content"
              rows={contentRows}
              className={`w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring ${resizableContent ? "resize-y" : "resize-none"}`}
            />
          )}
        </FormField>
      )}

      {/* URL */}
      {showUrl && (
        <FormField label="URL" required={urlLabelRequired} spacing={spacing}>
          <Input
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://…"
            className="h-8 text-sm"
            type="url"
          />
        </FormField>
      )}

      {/* Tags */}
      <div className={spaceClass}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Tags</label>
          {isPro && onSuggestTags && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={onSuggestTags}
              disabled={loadingSuggestions || !title.trim()}
            >
              <Sparkles className="h-3 w-3" />
              {loadingSuggestions ? "Suggesting…" : "Suggest Tags"}
            </Button>
          )}
        </div>
        <Input
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          placeholder="react, hooks, typescript"
          className="h-8 text-sm"
        />
        {showTagsHint && <p className="text-[11px] text-muted-foreground">Comma-separated</p>}
        <TagSuggestions suggestions={suggestions} onAccept={onAcceptTag} onReject={onRejectTag} />
      </div>

      {/* Collections */}
      <FormField label="Collections" spacing={spacing}>
        <CollectionSelect
          collections={collections}
          selected={selectedCollectionIds}
          onChange={onCollectionIdsChange}
          open={collectionSelectOpen}
          onOpenChange={onCollectionSelectOpenChange}
        />
      </FormField>
    </>
  )
}
