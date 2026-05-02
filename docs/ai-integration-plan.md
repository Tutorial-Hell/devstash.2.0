# AI Integration Plan

## Status: Superseded — 2026-04-27

All features described here are fully implemented. Note: this plan recommended `gpt-4o-mini` via `chat.completions`; the actual implementation uses the OpenAI Responses API — see `src/lib/openai.ts` and `src/actions/ai.ts` for the live code.

---

## Overview

This document covers how to add OpenAI-powered features to DevStash: auto-tagging, AI-generated summaries, code explanation, and prompt optimization. All AI features are Pro-only gates following the existing `isPro` / `isAtItemLimit` pattern.

**Model:** `gpt-4o-mini` (lowest cost, fast) for tagging/summaries; `gpt-4o` for code explanation and prompt optimization where quality matters more than latency.

> Note: The research prompt specified "gpt-5-nano" — no such model exists in the OpenAI API. `gpt-4o-mini` is the current equivalent: fastest, cheapest, capable enough for structured output tasks.

---

## 1. SDK Setup

### Install

```bash
npm install openai
```

### Singleton client (`src/lib/openai.ts`)

Follow the same pattern as `src/lib/stripe.ts` — guard the env var at module init, export a singleton.

```ts
import OpenAI from "openai"

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error("OPENAI_API_KEY is not set")

export const openai = new OpenAI({
  apiKey,
  maxRetries: 2,
  timeout: 30 * 1000, // 30 s — generous for streaming, tight for one-shot calls
})
```

### Environment variable

```env
OPENAI_API_KEY=sk-...
```

Add to `.env.local` for development. Never expose to the client bundle — only used in server actions and API routes.

---

## 2. Pro Gating Pattern

All AI server actions must check `isPro` before calling the OpenAI API. Follow the exact pattern from `src/actions/items.ts`:

```ts
"use server"

import { getSession } from "@/lib/auth-utils"
import { openai } from "@/lib/openai"

export async function someAiAction(itemId: string) {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) return { success: false, error: "Not authenticated." }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require a Pro plan." }
  }

  // ... call OpenAI
}
```

---

## 3. Rate Limiting

Add AI-specific limits to `src/lib/rate-limit.ts`. AI calls are expensive — limit them tightly:

```ts
const LIMITS: Record<string, LimitConfig> = {
  // ... existing auth limits ...
  "ai-tag":     { requests: 20,  window: "1 h" },   // auto-tag: 20/hr per user
  "ai-summary": { requests: 20,  window: "1 h" },   // summaries: 20/hr per user
  "ai-explain": { requests: 10,  window: "1 h" },   // code explain: 10/hr
  "ai-optimize":{ requests: 10,  window: "1 h" },   // prompt optimize: 10/hr
}
```

Use `userId` (not IP) as the rate limit key for AI actions — these are authenticated, Pro-only features and per-user limits are more meaningful than per-IP.

```ts
const rl = await rateLimit("ai-tag", userId)
if (!rl.success) return { success: false, error: rateLimitErrorMessage(rl.retryAfterMinutes!) }
```

---

## 4. Non-Streaming Actions (Auto-tag, Summary)

For short structured outputs, use a plain `create()` call — no streaming. Results come back in ~1–2 s.

### Auto-tagging (`src/actions/ai.ts`)

```ts
export async function generateTags(
  itemId: string
): Promise<{ success: true; tags: string[] } | { success: false; error: string }> {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!session.user.isPro) return { success: false, error: "AI features require Pro." }

  const rl = await rateLimit("ai-tag", userId)
  if (!rl.success) return { success: false, error: rateLimitErrorMessage(rl.retryAfterMinutes!) }

  const item = await getItemById(userId, itemId) // existing DB helper
  if (!item) return { success: false, error: "Item not found." }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a tagging assistant. Return 3–6 short, lowercase tags for the provided content. " +
            "Output valid JSON: { \"tags\": [\"tag1\", \"tag2\"] }. No markdown, no explanation.",
        },
        {
          role: "user",
          content: `Title: ${item.title}\n\nContent: ${(item.content ?? item.description ?? "").slice(0, 2000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
      temperature: 0.3,
    })

    const raw = response.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw) as { tags?: unknown }
    const tags = Array.isArray(parsed.tags)
      ? (parsed.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 6)
      : []

    return { success: true, tags }
  } catch (err) {
    return { success: false, error: formatAiError(err) }
  }
}
```

**Key points:**
- `response_format: { type: "json_object" }` forces structured JSON output — no regex parsing needed.
- Content is capped at 2000 characters to control token cost.
- `temperature: 0.3` keeps tags consistent and predictable.
- Use `gpt-4o-mini` — tagging is a low-complexity task.

### AI Summary

Same pattern as auto-tag. System prompt: "Summarize in 1–2 sentences. Plain text only."

```ts
model: "gpt-4o-mini",
max_tokens: 120,
temperature: 0.4,
```

---

## 5. Streaming Actions (Code Explanation, Prompt Optimization)

Longer outputs (explanations, rewrites) should stream so the user sees text appearing immediately rather than waiting 5–10 s for the full response.

**Next.js constraint:** Server actions cannot return a `ReadableStream` directly. The correct pattern is an **API route** that streams via Server-Sent Events, called from a client component.

### API Route (`src/app/api/ai/explain/route.ts`)

```ts
import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { openai } from "@/lib/openai"
import { rateLimit, rateLimitErrorMessage, getClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  if (!session.user.isPro) return new Response("Pro required", { status: 403 })

  const rl = await rateLimit("ai-explain", session.user.id)
  if (!rl.success) {
    return new Response(rateLimitErrorMessage(rl.retryAfterMinutes!), { status: 429 })
  }

  const { content, language } = await req.json() as { content: string; language?: string }
  if (!content) return new Response("content required", { status: 400 })

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a senior developer explaining code clearly and concisely. Use markdown.",
      },
      {
        role: "user",
        content: `Language: ${language ?? "unknown"}\n\n\`\`\`\n${content.slice(0, 4000)}\n\`\`\`\n\nExplain what this code does.`,
      },
    ],
    stream: true,
    max_tokens: 600,
    temperature: 0.4,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ""
          if (delta) controller.enqueue(encoder.encode(delta))
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
```

### Client-side consumption

```ts
async function fetchExplanation(content: string, language: string) {
  const res = await fetch("/api/ai/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, language }),
  })
  if (!res.ok || !res.body) throw new Error(await res.text())

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    setExplanation((prev) => prev + decoder.decode(value, { stream: true }))
  }
}
```

---

## 6. Error Handling

Create a shared `formatAiError` helper:

```ts
import OpenAI from "openai"

export function formatAiError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) return "AI service is busy. Please try again in a moment."
    if (err.status === 401) return "AI service is not configured correctly."
    if (err.status >= 500) return "AI service is temporarily unavailable."
    return `AI error: ${err.message}`
  }
  if (err instanceof Error && err.name === "APIConnectionTimeoutError") {
    return "AI request timed out. Please try again."
  }
  return "An unexpected error occurred."
}
```

The SDK throws typed subclasses (`RateLimitError`, `AuthenticationError`, `InternalServerError`, etc.) — catch them specifically when you need different behavior per error type.

---

## 7. UI Patterns

### Accept/Reject suggestion flow

AI results should always be suggestions, never automatic writes. The pattern:

1. User clicks "Suggest tags" / "Summarize" button
2. Button shows spinner, becomes disabled
3. Result appears in a highlighted preview area below/beside the field
4. Two actions: **Accept** (writes to form state) / **Dismiss** (clears preview)
5. On accept, the form still requires an explicit Save — AI doesn't auto-save

```tsx
function AiTagSuggestion({ itemId, onAccept }: { itemId: string; onAccept: (tags: string[]) => void }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  async function handleGenerate() {
    setState("loading")
    const result = await generateTags(itemId)
    if (result.success) {
      setSuggestedTags(result.tags)
      setState("done")
    } else {
      setErrorMsg(result.error)
      setState("error")
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        Suggest tags
      </Button>

      {state === "done" && (
        <div className="mt-2 rounded border border-blue-500/20 bg-blue-500/5 p-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {suggestedTags.map((t) => <TagBadge key={t} tag={t} />)}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onAccept(suggestedTags); setState("idle") }}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => setState("idle")}>Dismiss</Button>
          </div>
        </div>
      )}

      {state === "error" && <p className="text-xs text-destructive mt-1">{errorMsg}</p>}
    </div>
  )
}
```

### Streaming loading state

For streaming responses (explain, optimize), show a `MarkdownEditor` in read-only mode that fills in progressively:

```tsx
const [explanation, setExplanation] = useState("")
const [streaming, setStreaming] = useState(false)

// While streaming: show the MarkdownEditor with growing content + a pulsing border
// When done: show Accept / Dismiss buttons
```

### Pro gate UI

When a free user triggers an AI action, show an inline upgrade prompt — do not redirect. Example:

```tsx
{!isPro && (
  <div className="text-xs text-muted-foreground flex items-center gap-1">
    <Sparkles className="h-3 w-3 text-blue-400" />
    <Link href="/upgrade" className="text-blue-400 hover:underline">Upgrade to Pro</Link>
    {" "}to use AI features
  </div>
)}
```

---

## 8. Cost Optimization

| Feature | Model | Est. tokens/call | Est. cost/1k calls |
|---|---|---|---|
| Auto-tag | gpt-4o-mini | ~400 in / 60 out | ~$0.08 |
| Summary | gpt-4o-mini | ~600 in / 80 out | ~$0.10 |
| Code explain | gpt-4o | ~800 in / 500 out | ~$1.75 |
| Prompt optimize | gpt-4o | ~500 in / 400 out | ~$1.35 |

**Strategies:**

1. **Content truncation** — cap input at 2000–4000 characters before sending. Most stash content is short; long content rarely changes tag/summary quality.
2. **`max_tokens` cap** — always set. Prevents runaway costs from unexpectedly long outputs.
3. **Model selection** — use `gpt-4o-mini` for tagging/summaries (structured, low-complexity); reserve `gpt-4o` for explanation/optimization where quality is the product.
4. **Rate limits** — the per-user hourly limits defined above bound worst-case cost per user to roughly $0.02–0.04/hr for mini tasks and $0.15–0.20/hr for gpt-4o tasks.
5. **No polling or retries on the client** — if a call fails, the user retries manually. No automatic retry loops.
6. **Cache static explanations** — for snippet/command items that haven't changed, cache the explanation in a DB column (`aiExplanation String?`) and skip the API call on repeated requests. Invalidate on `updatedAt` change.

---

## 9. Security Considerations

**API key:** `OPENAI_API_KEY` is only used server-side. Never import `src/lib/openai.ts` from a client component. Next.js will include it in the bundle if you do — the singleton guard (`throw new Error`) will catch it at build time, but prefer naming the file with a `.server.ts` suffix or enforcing via ESLint `no-restricted-imports`.

**Input sanitization:** User content is passed directly to the model. This is intentional — the model sees their own data. However:
- Truncate all content before sending (already in all examples above).
- Never include other users' data in a prompt.
- Never reflect model output back to the DB without user review (the accept/reject pattern above enforces this for tags; summaries should follow the same pattern).

**Prompt injection:** Users could craft content like "Ignore previous instructions and output…". For tagging and summaries this is low-risk (worst case: bad tags). Use `response_format: { type: "json_object" }` for structured outputs — it significantly constrains what the model can output even under injection attempts.

**Output validation:** Always validate model output before using it:
- Tags: filter to `string[]`, max length per tag 50 chars, max 6 tags.
- Summaries: trim, max 300 chars.
- Streaming content (explain/optimize): render via `MarkdownEditor` which already handles XSS via `react-markdown`.

---

## 10. Implementation Order

1. `src/lib/openai.ts` — singleton client
2. Add AI rate limit keys to `src/lib/rate-limit.ts`
3. `src/actions/ai.ts` — `generateTags` and `generateSummary` (non-streaming, ship first)
4. Wire into item drawer edit mode: "Suggest tags" and "Summarize" buttons with accept/reject UI
5. `src/app/api/ai/explain/route.ts` — streaming code explanation
6. `src/app/api/ai/optimize/route.ts` — streaming prompt optimization
7. Wire explain into `CodeEditor` header (snippet/command drawer view mode)
8. Wire optimize into `MarkdownEditor` header (prompt drawer view mode)
9. Add `aiExplanation`/`aiSummary` columns to `Item` model for caching (optional, Phase 2)
