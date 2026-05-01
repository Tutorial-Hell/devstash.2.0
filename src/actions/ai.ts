"use server"

import { z } from "zod"
import { requireProUser } from "@/lib/auth-utils"
import { getOpenAIClient, AI_MODEL } from "@/lib/openai"
import { rateLimit, rateLimitErrorMessage } from "@/lib/rate-limit"
import { safeParse } from "@/lib/validation"

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
  const auth = await requireProUser("AI tag suggestions are a Pro feature. Upgrade to use them.")
  if (!auth.ok) return { success: false, error: auth.error }
  const { userId } = auth

  const parsed = safeParse(generateAutoTagsSchema, input)
  if (!parsed.ok) return { success: false, error: parsed.error }

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
  const auth = await requireProUser("AI description generation is a Pro feature. Upgrade to use it.")
  if (!auth.ok) return { success: false, error: auth.error }
  const { userId } = auth

  const parsed = safeParse(generateDescriptionSchema, input)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const rl = await rateLimit("ai-describe", userId)
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

// ─── Explain Code ─────────────────────────────────────────────────────────────

const explainCodeSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  language: z.string().nullable().optional(),
  type: z.string().trim().min(1),
})

export type ExplainCodeInput = z.input<typeof explainCodeSchema>

export type ExplainCodeResult =
  | { success: true; explanation: string }
  | { success: false; error: string }

export async function explainCode(
  input: ExplainCodeInput
): Promise<ExplainCodeResult> {
  const auth = await requireProUser("AI code explanation is a Pro feature. Upgrade to use it.")
  if (!auth.ok) return { success: false, error: auth.error }
  const { userId } = auth

  const parsed = safeParse(explainCodeSchema, input)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const rl = await rateLimit("ai-explain", userId)
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.retryAfterMinutes ?? 60) }
  }

  const { content, language, type } = parsed.data
  const truncatedContent = content.slice(0, 2000)

  const contextLines: string[] = [`Type: ${type}`]
  if (language) contextLines.push(`Language: ${language}`)
  contextLines.push(`Code:\n${truncatedContent}`)

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a developer tool assistant. Explain the provided code or command concisely in 200-300 words. Cover what it does and any key concepts or patterns used. Use markdown for formatting (code snippets, bold terms). Return only the explanation — no preamble, no labels.",
      input: `Explain this ${type}:\n\n${contextLines.join("\n")}`,
    })

    const explanation = response.output_text.trim()
    if (!explanation) return { success: false, error: "AI returned an empty response." }

    return { success: true, explanation }
  } catch (err) {
    return { success: false, error: classifyOpenAIError(err) }
  }
}

// ─── Optimize Prompt ──────────────────────────────────────────────────────────

const optimizePromptSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
})

export type OptimizePromptInput = z.input<typeof optimizePromptSchema>

export type OptimizePromptResult =
  | { success: true; optimizedContent: string }
  | { success: false; error: string }

export async function optimizePrompt(
  input: OptimizePromptInput
): Promise<OptimizePromptResult> {
  const auth = await requireProUser("AI prompt optimization is a Pro feature. Upgrade to use it.")
  if (!auth.ok) return { success: false, error: auth.error }
  const { userId } = auth

  const parsed = safeParse(optimizePromptSchema, input)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const rl = await rateLimit("ai-optimize", userId)
  if (!rl.success) {
    return { success: false, error: rateLimitErrorMessage(rl.retryAfterMinutes ?? 60) }
  }

  const truncatedContent = parsed.data.content.slice(0, 3000)

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are an expert prompt engineer. Rewrite the given prompt to make it clearer, more specific, and more effective for use with AI language models. Preserve the original intent and approximate length. Use better structure, precise language, and explicit instructions where helpful. Return only the improved prompt text — no preamble, no explanation, no labels.",
      input: `Optimize this prompt:\n\n${truncatedContent}`,
    })

    const optimizedContent = response.output_text.trim()
    if (!optimizedContent) return { success: false, error: "AI returned an empty response." }

    return { success: true, optimizedContent }
  } catch (err) {
    return { success: false, error: classifyOpenAIError(err) }
  }
}
