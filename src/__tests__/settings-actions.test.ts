import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth-utils", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}))

import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { updateEditorPreferences } from "@/actions/settings"
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences"

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset()
    vi.mocked(prisma.user.update).mockReset()
  })

  it("returns error when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null as never)

    const result = await updateEditorPreferences({ fontSize: 14 })

    expect(result).toEqual({ error: "Not authenticated" })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("returns error when session has no user id", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: {} } as never)

    const result = await updateEditorPreferences({ fontSize: 14 })

    expect(result).toEqual({ error: "Not authenticated" })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("merges partial prefs with defaults and saves", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user-1" } } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const result = await updateEditorPreferences({ fontSize: 16 })

    expect(result).toEqual({})
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        editorPreferences: {
          ...DEFAULT_EDITOR_PREFERENCES,
          fontSize: 16,
        },
      },
    })
  })

  it("saves full prefs when all fields provided", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user-2" } } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const fullPrefs = {
      fontSize: 18,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai" as const,
    }

    const result = await updateEditorPreferences(fullPrefs)

    expect(result).toEqual({})
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { editorPreferences: fullPrefs },
    })
  })

  it("uses all defaults when empty object passed", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: "user-3" } } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const result = await updateEditorPreferences({})

    expect(result).toEqual({})
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-3" },
      data: { editorPreferences: DEFAULT_EDITOR_PREFERENCES },
    })
  })
})
