import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
  dockerfile: "dockerfile",
  tf: "hcl",
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function slugToTypeName(slug: string): string {
  return slug.replace(/s$/, "")
}

export function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase()
  return LANGUAGE_ALIAS_MAP[lower] ?? lower
}
