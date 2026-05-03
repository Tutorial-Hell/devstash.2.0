"use client"

import { useState } from "react"
import { toast } from "sonner"
import { generateAutoTags, generateDescription } from "@/actions/ai"

export function useItemAiFeatures({
  title,
  content,
  url,
  type,
  tagsInput,
  setTagsInput,
  setDescription,
}: {
  title: string
  content: string
  url: string
  type: string
  tagsInput: string
  setTagsInput: React.Dispatch<React.SetStateAction<string>>
  setDescription: React.Dispatch<React.SetStateAction<string>>
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loadingDescription, setLoadingDescription] = useState(false)

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

  return {
    suggestions,
    setSuggestions,
    loadingSuggestions,
    loadingDescription,
    handleGenerateDescription,
    handleSuggestTags,
    acceptTag,
    rejectTag,
  }
}
