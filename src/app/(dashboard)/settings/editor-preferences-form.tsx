"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { updateEditorPreferences } from "@/actions/settings"
import { useEditorPreferences } from "@/contexts/editor-preferences-context"
import { FONT_SIZE_OPTIONS, TAB_SIZE_OPTIONS, THEME_OPTIONS } from "@/types/editor-preferences"
import type { EditorPreferences } from "@/types/editor-preferences"

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground mb-1.5">{children}</p>
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | number
  options: readonly { value: string | number; label: string }[]
  onChange: (val: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

export function EditorPreferencesForm() {
  const { prefs, setPrefs } = useEditorPreferences()
  const [, startTransition] = useTransition()

  function save(next: EditorPreferences) {
    setPrefs(next)
    startTransition(async () => {
      const result = await updateEditorPreferences(next)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Editor preferences saved")
      }
    })
  }

  const fontSizeOptions = FONT_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n}px` }))
  const tabSizeOptions = TAB_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} spaces` }))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Font size"
          value={prefs.fontSize}
          options={fontSizeOptions}
          onChange={(val) => save({ ...prefs, fontSize: Number(val) })}
        />
        <SelectField
          label="Tab size"
          value={prefs.tabSize}
          options={tabSizeOptions}
          onChange={(val) => save({ ...prefs, tabSize: Number(val) })}
        />
      </div>

      <SelectField
        label="Theme"
        value={prefs.theme}
        options={THEME_OPTIONS as unknown as { value: string; label: string }[]}
        onChange={(val) => save({ ...prefs, theme: val as EditorPreferences["theme"] })}
      />

      <div className="space-y-4 pt-1">
        <ToggleField
          label="Word wrap"
          description="Wrap long lines instead of scrolling horizontally"
          checked={prefs.wordWrap}
          onChange={(val) => save({ ...prefs, wordWrap: val })}
        />
        <ToggleField
          label="Minimap"
          description="Show a miniature overview of your code on the right"
          checked={prefs.minimap}
          onChange={(val) => save({ ...prefs, minimap: val })}
        />
      </div>
    </div>
  )
}
