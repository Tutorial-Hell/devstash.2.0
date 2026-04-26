"use server"

import { z } from "zod"
import { getSession } from "@/lib/auth-utils"
import { getOpenAIClient, AI_MODEL } from "@/lib/openai"
import { rateLimit, rateLimitErrorMessage } from "@/lib/rate-limit"

// ─── Shared error handler ─────────────────────────────────────────────────────

function classifyOpenAIError(err: unknown): string {
  const e = err as { status?: number; code?: string; message?: string }
  console.error("OpenAI error:", e.status, e.code, e.message)
  if (e.status === 401) return "OpenAI API key is invalid or not configured."
  if (e.status === 429 || e.code === "insufficient_quota")
    return "OpenAI quota exceeded. Please check your billing at platform.openai.com."
  return "AI service error. Please try again."
}

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().nullable().optional(),
  type: z.string().trim().min(1),
})

export type GenerateAutoTagsInput = z.input<typeof generateAutoTagsSchema>

export type GenerateAutoTagsResult =
  | { success: true; tags: string[] }
  | { success: false; error: string }

export async function generateAutoTags(
  input: GenerateAutoTagsInput
): Promise<GenerateAutoTagsResult> {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) return { success: false, error: "Not authenticated." }

  if (!session?.user?.isPro) {
    return { success: false, error: "AI tag suggestions are a Pro feature. Upgrade to use them." }
  }

  const parsed = generateAutoTagsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const rl = await rateLimit("ai-suggest-tags", userId)
  if (!rl.success) {
    return {
      success: false,
      error: rateLimitErrorMessage(rl.retryAfterMinutes ?? 60),
    }
  }

  const { title, content, type } = parsed.data
  const truncatedContent = content ? content.slice(0, 2000) : ""

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a developer tool assistant. Return your response as a JSON object with a 'tags' array of 3-5 lowercase strings (single words or short hyphenated phrases).",
      input: `Suggest 3-5 relevant tags for this ${type} item. Respond in JSON.\n\nTitle: ${title}${truncatedContent ? `\n\nContent:\n${truncatedContent}` : ""}`,
      text: { format: { type: "json_object" } },
    })

    const raw = response.output_text
    let tags: string[] = []
    try {
      const data = JSON.parse(raw)
      if (Array.isArray(data)) {
        tags = data
      } else if (Array.isArray(data.tags)) {
        tags = data.tags
      }
    } catch {
      return { success: false, error: "AI returned an unexpected response." }
    }

    tags = tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean)
      .slice(0, 5)

    return { success: true, tags }
  } catch (err) {
    return { success: false, error: classifyOpenAIError(err) }
  }
}

// ─── Generate Description ─────────────────────────────────────────────────────

const generateDescriptionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.string().trim().min(1),
  content: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
})

export type GenerateDescriptionInput = z.input<typeof generateDescriptionSchema>

export type GenerateDescriptionResult =
  | { success: true; description: string }
  | { success: false; error: string }

export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) return { success: false, error: "Not authenticated." }

  if (!session?.user?.isPro) {
    return { success: false, error: "AI description generation is a Pro feature. Upgrade to use it." }
  }

  const parsed = generateDescriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  const rl = await rateLimit("ai-suggest-tags", userId)
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.retryAfterMinutes ?? 60) }
  }

  const { title, type, content, url } = parsed.data
  const truncatedContent = content ? content.slice(0, 2000) : ""

  const contextLines: string[] = [`Title: ${title}`, `Type: ${type}`]
  if (url) contextLines.push(`URL: ${url}`)
  if (truncatedContent) contextLines.push(`Content:\n${truncatedContent}`)

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a developer tool assistant. Write a concise 1-2 sentence description for the given item. Return only the description text — no quotes, no labels, no extra formatting.",
      input: `Write a 1-2 sentence description for this ${type} item:\n\n${contextLines.join("\n")}`,
    })

    const description = response.output_text.trim()
    if (!description) return { success: false, error: "AI returned an empty response." }

    return { success: true, description }
  } catch (err) {
    return { success: false, error: classifyOpenAIError(err) }
  }
}
