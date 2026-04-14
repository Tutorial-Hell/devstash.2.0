"use client"

import * as React from "react"
import type { EditorPreferences } from "@/types/editor-preferences"
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences"

interface EditorPreferencesContextValue {
  prefs: EditorPreferences
  setPrefs: (prefs: EditorPreferences) => void
}

const EditorPreferencesContext = React.createContext<EditorPreferencesContextValue>({
  prefs: DEFAULT_EDITOR_PREFERENCES,
  setPrefs: () => {},
})

export function EditorPreferencesProvider({
  initial,
  children,
}: {
  initial: EditorPreferences
  children: React.ReactNode
}) {
  const [prefs, setPrefs] = React.useState<EditorPreferences>(initial)

  return (
    <EditorPreferencesContext value={{ prefs, setPrefs }}>
      {children}
    </EditorPreferencesContext>
  )
}

export function useEditorPreferences() {
  return React.useContext(EditorPreferencesContext)
}
