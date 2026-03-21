// ─────────────────────────────────────────────────────────────────────────────
// Mock data — single source of truth for dashboard UI during development
// Replace with real DB queries once the database is wired up
// ─────────────────────────────────────────────────────────────────────────────

export const mockUser = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: false,
};

// ─── Item Types ───────────────────────────────────────────────────────────────

export const mockItemTypes = [
  { id: "type_snippet",  name: "snippet",  icon: "Code",       color: "#3b82f6", isSystem: true },
  { id: "type_prompt",   name: "prompt",   icon: "Sparkles",   color: "#8b5cf6", isSystem: true },
  { id: "type_command",  name: "command",  icon: "Terminal",   color: "#f97316", isSystem: true },
  { id: "type_note",     name: "note",     icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type_file",     name: "file",     icon: "File",       color: "#6b7280", isSystem: true },
  { id: "type_image",    name: "image",    icon: "Image",      color: "#ec4899", isSystem: true },
  { id: "type_link",     name: "link",     icon: "Link",       color: "#10b981", isSystem: true },
];

// ─── Items ────────────────────────────────────────────────────────────────────

export const mockItems = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "text",
    content: `import { useState, useEffect } from "react";\n\nexport function useAuth() {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    // fetch session\n  }, []);\n\n  return { user, loading };\n}`,
    language: "typescript",
    isFavorite: true,
    isPinned: true,
    itemTypeId: "type_snippet",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_react"],
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "text",
    content: `async function fetchWithRetry(url, options = {}, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url, options);\n      if (!res.ok) throw new Error(res.statusText);\n      return res.json();\n    } catch (err) {\n      if (i === retries - 1) throw err;\n      await new Promise(r => setTimeout(r, 2 ** i * 1000));\n    }\n  }\n}`,
    language: "javascript",
    isFavorite: false,
    isPinned: true,
    itemTypeId: "type_snippet",
    tags: ["api", "error-handling", "fetch"],
    collectionIds: ["col_react", "col_interview"],
    createdAt: "2025-01-15T11:00:00Z",
  },
  {
    id: "item_3",
    title: "Git Undo Last Commit",
    description: "Undo the last commit while keeping changes staged",
    contentType: "text",
    content: "git reset --soft HEAD~1",
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_command",
    tags: ["git"],
    collectionIds: ["col_git"],
    createdAt: "2025-01-14T09:00:00Z",
  },
  {
    id: "item_4",
    title: "Python List Comprehension",
    description: "Filter and transform a list in one line",
    contentType: "text",
    content: "squares = [x**2 for x in range(10) if x % 2 == 0]",
    language: "python",
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_snippet",
    tags: ["python", "list"],
    collectionIds: ["col_python"],
    createdAt: "2025-01-13T14:00:00Z",
  },
  {
    id: "item_5",
    title: "Code Review Prompt",
    description: "Prompt for a thorough AI code review",
    contentType: "text",
    content: "Review the following code for bugs, security issues, and performance improvements. Be concise and specific:\n\n```\n{{code}}\n```",
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_prompt",
    tags: ["code-review", "ai"],
    collectionIds: ["col_prompts"],
    createdAt: "2025-01-12T16:00:00Z",
  },
  {
    id: "item_6",
    title: "CLAUDE.md System Context",
    description: "Base system context file for Claude projects",
    contentType: "text",
    content: "# Project Context\n\nYou are helping with a Next.js TypeScript project...",
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_file",
    tags: ["claude", "context"],
    collectionIds: ["col_context"],
    createdAt: "2025-01-11T10:00:00Z",
  },
];

// ─── Collections ──────────────────────────────────────────────────────────────

export const mockCollections = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    userId: "user_1",
    itemCount: 12,
    // The most common item type determines the card's accent color
    dominantTypeId: "type_snippet",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    userId: "user_1",
    itemCount: 8,
    dominantTypeId: "type_snippet",
    createdAt: "2025-01-02T00:00:00Z",
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    userId: "user_1",
    itemCount: 5,
    dominantTypeId: "type_file",
    createdAt: "2025-01-03T00:00:00Z",
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    userId: "user_1",
    itemCount: 24,
    dominantTypeId: "type_snippet",
    createdAt: "2025-01-04T00:00:00Z",
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    userId: "user_1",
    itemCount: 15,
    dominantTypeId: "type_command",
    createdAt: "2025-01-05T00:00:00Z",
  },
  {
    id: "col_prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    userId: "user_1",
    itemCount: 18,
    dominantTypeId: "type_prompt",
    createdAt: "2025-01-06T00:00:00Z",
  },
];

// ─── Sidebar counts (items per type) ─────────────────────────────────────────

export const mockTypeCounts: Record<string, number> = {
  type_snippet: 24,
  type_prompt: 18,
  type_command: 15,
  type_note: 12,
  type_file: 5,
  type_image: 5,
  type_link: 8,
};
