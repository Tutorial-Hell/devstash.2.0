# Item Types

DevStash ships with 7 immutable system item types. Each type has a name, icon (Lucide), hex color, content mode, and tier. Users cannot modify system types; custom types are reserved for Pro (future).

---

## Type Reference

### Snippet
| Field | Value |
|---|---|
| **Icon** | `Code` |
| **Color** | `#3b82f6` (blue) |
| **Content mode** | text |
| **Tier** | Free |
| **Purpose** | Store reusable code blocks, functions, patterns, and templates in any language. |
| **Key fields** | `content` (required), `language` (optional — e.g. `typescript`, `yaml`) |

---

### Prompt
| Field | Value |
|---|---|
| **Icon** | `Sparkles` |
| **Color** | `#8b5cf6` (violet) |
| **Content mode** | text |
| **Tier** | Free |
| **Purpose** | Save AI prompts, system messages, and workflow templates for reuse with LLMs. |
| **Key fields** | `content` (required), `language` not typically used |

---

### Command
| Field | Value |
|---|---|
| **Icon** | `Terminal` |
| **Color** | `#f97316` (orange) |
| **Content mode** | text |
| **Tier** | Free |
| **Purpose** | Store shell commands, scripts, CLI one-liners, and deployment sequences. |
| **Key fields** | `content` (required), `language` not typically used |

---

### Note
| Field | Value |
|---|---|
| **Icon** | `StickyNote` |
| **Color** | `#fde047` (yellow) |
| **Content mode** | text |
| **Tier** | Free |
| **Purpose** | Free-form markdown notes, documentation snippets, and context. |
| **Key fields** | `content` (required), `language` not typically used |

---

### File
| Field | Value |
|---|---|
| **Icon** | `File` |
| **Color** | `#6b7280` (gray) |
| **Content mode** | file upload |
| **Tier** | Pro |
| **Purpose** | Upload and store context files, config files, PDFs, and other documents. Stored on Cloudflare R2. |
| **Key fields** | `fileUrl` (R2 URL), `fileName` (original name), `fileSize` (bytes); `content` is null |

---

### Image
| Field | Value |
|---|---|
| **Icon** | `Image` |
| **Color** | `#ec4899` (pink) |
| **Content mode** | file upload |
| **Tier** | Pro |
| **Purpose** | Upload and store screenshots, diagrams, design references, and visual assets. Stored on Cloudflare R2. |
| **Key fields** | `fileUrl` (R2 URL), `fileName` (original name), `fileSize` (bytes); `content` is null |

---

### Link
| Field | Value |
|---|---|
| **Icon** | `Link` |
| **Color** | `#10b981` (emerald) |
| **Content mode** | URL |
| **Tier** | Free |
| **Purpose** | Bookmark documentation, references, tools, and external resources. |
| **Key fields** | `url` (required); `content` is null |

---

## Classification Summary

### By content mode

| Mode | Types | `contentType` value | Active fields |
|---|---|---|---|
| **Text** | snippet, prompt, command, note | `"text"` | `content`, optionally `language` |
| **File upload** | file, image | `"file"` | `fileUrl`, `fileName`, `fileSize` |
| **URL** | link | `"url"` | `url` |

The `contentType` column on the `Item` model stores one of these three string values and determines which fields are populated.

### By tier

| Tier | Types |
|---|---|
| **Free** | snippet, prompt, command, note, link |
| **Pro** | file, image |

---

## Shared Properties

All item types share these fields regardless of content mode:

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | CUID |
| `title` | `String` | Required |
| `description` | `String?` | Optional subtitle |
| `contentType` | `String` | `"text"` \| `"url"` \| `"file"` |
| `isFavorite` | `Boolean` | Default false |
| `isPinned` | `Boolean` | Default false |
| `userId` | `String` | Owner |
| `itemTypeId` | `String` | FK to `ItemType` |
| `collections` | relation | Many-to-many via `ItemCollection` |
| `tags` | relation | Many-to-many |
| `createdAt` / `updatedAt` | `DateTime` | Auto-managed |

---

## Display Differences

| Type | Color coding | Editor | URL preview | File download |
|---|---|---|---|---|
| snippet | Blue border | Markdown + syntax highlight | — | — |
| prompt | Violet border | Markdown | — | — |
| command | Orange border | Markdown (monospace) | — | — |
| note | Yellow border | Markdown | — | — |
| file | Gray border | — (filename + size shown) | — | Yes |
| image | Pink border | — (thumbnail shown) | — | Yes |
| link | Emerald border | — (URL shown) | Yes | — |

Item cards and the slide-out drawer derive their border/accent color from the type's `color` hex. The sidebar navigation groups items by type, routing to `/items/{type-name}` (e.g. `/items/snippets`).

---

## System Type Seeding

System types are seeded with `userId: null` and `isSystem: true`. They are global — not owned by any user. The seed is idempotent: it checks for existence before inserting.

```ts
// prisma/seed.ts
const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code",       color: "#3b82f6", isSystem: true },
  { name: "prompt",  icon: "Sparkles",   color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal",   color: "#f97316", isSystem: true },
  { name: "note",    icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file",    icon: "File",       color: "#6b7280", isSystem: true },
  { name: "image",   icon: "Image",      color: "#ec4899", isSystem: true },
  { name: "link",    icon: "Link",       color: "#10b981", isSystem: true },
]
```

The `@@unique([name, userId])` constraint on `ItemType` allows the same name to exist once as a system type (`userId: null`) and once per user for future custom types.
