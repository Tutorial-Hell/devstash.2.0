"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { EditorPreferences } from "@/types/editor-preferences"
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences"

export async function updateEditorPreferences(
  prefs: Partial<EditorPreferences>
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const merged: EditorPreferences = { ...DEFAULT_EDITOR_PREFERENCES, ...prefs }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: merged as object },
  })

  return {}
}
