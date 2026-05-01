"use server"

import { z } from "zod"
import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { DEFAULT_EDITOR_PREFERENCES, FONT_SIZE_OPTIONS, TAB_SIZE_OPTIONS } from "@/types/editor-preferences"

const editorPrefsSchema = z.object({
  fontSize: z.number().int().refine((v) => (FONT_SIZE_OPTIONS as readonly number[]).includes(v)).optional(),
  tabSize: z.number().int().refine((v) => (TAB_SIZE_OPTIONS as readonly number[]).includes(v)).optional(),
  wordWrap: z.boolean().optional(),
  minimap: z.boolean().optional(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]).optional(),
})

export async function updateEditorPreferences(
  prefs: unknown
): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const parsed = editorPrefsSchema.safeParse(prefs)
  if (!parsed.success) return { error: "Invalid preferences." }

  const merged = { ...DEFAULT_EDITOR_PREFERENCES, ...parsed.data }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: merged },
  })

  return {}
}
