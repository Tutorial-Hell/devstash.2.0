import type { BeforeMount } from "@monaco-editor/react"

export const registerMonacoThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715e", fontStyle: "italic" },
      { token: "keyword", foreground: "f92672" },
      { token: "string", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "class", foreground: "a6e22e" },
      { token: "function", foreground: "a6e22e" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "operator", foreground: "f92672" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#75715e",
      "editor.selectionBackground": "#49483e",
      "editor.lineHighlightBackground": "#3e3d32",
      "editorCursor.foreground": "#f8f8f2",
      "editor.findMatchBackground": "#ffe792",
      "editor.findMatchHighlightBackground": "#ffe79288",
    },
  })

  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "class", foreground: "d2a8ff" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "e6edf3" },
      { token: "operator", foreground: "ff7b72" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#6e7681",
      "editor.selectionBackground": "#264f78",
      "editor.lineHighlightBackground": "#161b22",
      "editorCursor.foreground": "#e6edf3",
      "editor.findMatchBackground": "#f2cc6044",
      "editor.findMatchHighlightBackground": "#f2cc6022",
    },
  })
}
