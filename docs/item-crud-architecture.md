# Item CRUD Architecture

A unified CRUD system for all 7 item types built on three principles:
1. **Mutations live in one actions file** — `src/app/(dashboard)/items/actions.ts`
2. **Queries live in `src/lib/db/items.ts`** — called directly from server components
3. **One dynamic route** — `src/app/(dashboard)/items/[type]/page.tsx` — shared components adapt by type

---

## File Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── items/
│           ├── actions.ts                  # All item mutations (create, update, delete, toggleFavorite, togglePin)
│           └── [type]/
│               └── page.tsx                # Server component — fetches items by type, renders list
├── components/
│   └── items/
│       ├── item-card.tsx                   # Display card (adapts to contentType)
│       ├── item-drawer.tsx                 # Slide-out drawer — wraps item-form and item-detail
│       ├── item-form.tsx                   # Create / edit form — fields adapt by contentType
│       └── item-list.tsx                   # Grid / list of item-cards + "New item" button
└── lib/
    ├── db/
    │   └── items.ts                        # All item queries (existing + new getItemsByType, getItemById)
    ├── constants.tsx                       # ITEM_TYPES array — single source of truth for type metadata
    └── icon-map.ts                         # Lucide icon lookup (already exists)
```

---

## Routing: `/items/[type]`

The sidebar links use the pattern `/items/${name}s` (e.g. `/items/snippets`, `/items/commands`).

The dynamic segment `[type]` receives the **plural slug** (e.g. `"snippets"`). The page component converts it back to the canonical name:

```ts
// src/app/(dashboard)/items/[type]/page.tsx
const slugToName: Record<string, string> = {
  snippets: "snippet",
  prompts:  "prompt",
  commands: "command",
  notes:    "note",
  files:    "file",
  images:   "image",
  links:    "link",
}
```

If the slug doesn't match, call `notFound()`.

---

## Data Layer: `src/lib/db/items.ts`

Add these two queries alongside the existing ones (`getPinnedItems`, `getRecentItems`, etc.):

```ts
// Full item shape returned to the list page and drawer
export type ItemFull = {
  id: string
  title: string
  description: string | null
  contentType: string          // "text" | "url" | "file"
  content: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  tags: { id: string; name: string }[]
  itemType: { id: string; name: string; icon: string; color: string }
  collections: { id: string; name: string }[]
  createdAt: Date
  updatedAt: Date
}

export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemFull[]>

export async function getItemById(
  userId: string,
  itemId: string
): Promise<ItemFull | null>
```

Both use `prisma.item.findMany` / `findUnique` with `where: { userId, itemType: { name: typeName } }` and `include: { itemType, tags, collections: { include: { collection } } }`.

---

## Mutations: `src/app/(dashboard)/items/actions.ts`

One `"use server"` file. All actions authenticate via `auth()`, look up the demo user for development.

```ts
"use server"

// Shared guard used by all mutations
async function requireUserId(): Promise<string>  // throws if not authenticated

export async function createItemAction(formData: FormData): Promise<ActionResult>
export async function updateItemAction(itemId: string, formData: FormData): Promise<ActionResult>
export async function deleteItemAction(itemId: string): Promise<ActionResult>
export async function toggleFavoriteAction(itemId: string): Promise<ActionResult>
export async function togglePinAction(itemId: string): Promise<ActionResult>

type ActionResult = { success: true } | { error: string }
```

### What `createItemAction` does

1. `requireUserId()`
2. Read `title`, `description`, `itemTypeId`, `contentType`, `tags` (comma-separated string) from `formData`
3. Branch on `contentType`:
   - `"text"` → read `content`, optional `language`
   - `"url"` → read `url`
   - `"file"` → **not handled in the action**; file upload goes through a separate API route (`POST /api/upload`) that returns a `fileUrl`, which the client then includes in a second call or passes as a hidden field
4. Upsert tags: `prisma.tag.upsert` per tag name, then connect
5. `prisma.item.create({ data: { ...fields, userId, tags: { connect: tagIds } } })`
6. `revalidatePath("/items/[type]")` using the type slug, plus `revalidatePath("/dashboard")`

### What `updateItemAction` does

Same shape as create. Verifies item ownership (`where: { id: itemId, userId }`). Replaces tag set with new one (`set: []` then `connect`).

### Type-specific logic stays out of actions

Actions are type-agnostic — they write whatever fields `formData` contains. The **form component** is responsible for rendering the right fields. Actions never branch on type name.

---

## Components

### `item-list.tsx` (server or client)
- Receives `items: ItemFull[]`, `typeName: string`, `typeColor: string`, `typeIcon: string`
- Renders a grid of `<ItemCard>`s
- Contains a "New item" button that opens `<ItemDrawer mode="create" />`

### `item-card.tsx` (client)
- Props: `item: ItemFull`
- Shows: type-colored left border (derived from `item.itemType.color`), title, description, tags, date
- Click opens `<ItemDrawer mode="view" itemId={item.id} />`
- Content preview:
  - `"text"`: truncated `item.content`
  - `"url"`: `item.url` displayed as a styled link chip
  - `"file"`: `item.fileName` + formatted `item.fileSize`

### `item-drawer.tsx` (client)
- Uses shadcn `<Sheet>` (`side="right"`)
- Two modes controlled by a local state machine:
  - **view**: renders `<ItemDetail item={...} />` with Edit / Delete buttons
  - **edit** / **create**: renders `<ItemForm />`
- On submit: calls `createItemAction` or `updateItemAction` via `useActionState`, closes on success
- On delete: calls `deleteItemAction`, closes on success

### `item-form.tsx` (client)
- Props: `itemType: { name, contentType, id }`, optional `item: ItemFull` for editing
- **Shared fields** (all types): `title`, `description`, tag input
- **Type-specific fields** selected by `contentType`:
  - `"text"`: `<Textarea>` for `content`, optional language selector
  - `"url"`: `<Input type="url">` for `url`
  - `"file"`: `<Input type="file">` → uploads to `/api/upload`, stores returned `fileUrl` in hidden input
- The `itemTypeId` is passed as a hidden input; the form does not let the user change the type after creation

---

## Where Type-Specific Logic Lives

| Concern | Where |
|---|---|
| Type metadata (name, icon, color, contentType) | `src/lib/constants.tsx` |
| Icon rendering | `src/lib/icon-map.ts` |
| Which fields to show in the form | `item-form.tsx` — branches on `contentType` prop |
| Content preview in card | `item-card.tsx` — branches on `item.contentType` |
| DB queries | `src/lib/db/items.ts` |
| Write operations | `src/app/(dashboard)/items/actions.ts` |
| Route resolution (slug → type name) | `src/app/(dashboard)/items/[type]/page.tsx` |

Actions and DB queries are **type-agnostic**. UI components are where `contentType` branching happens.

---

## `src/lib/constants.tsx` (to be created)

The single source of truth for type metadata, imported by the sidebar, form, card, and drawer:

```tsx
import { Code, Sparkles, Terminal, StickyNote, File, Image, Link } from "lucide-react"

export type ContentMode = "text" | "url" | "file"

export type ItemTypeConfig = {
  name: string
  slug: string         // plural, used in routes
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  iconName: string     // stored in DB / used by icon-map
  color: string
  contentMode: ContentMode
  isPro: boolean
}

export const ITEM_TYPES: ItemTypeConfig[] = [
  { name: "snippet", slug: "snippets", icon: Code,       iconName: "Code",       color: "#3b82f6", contentMode: "text", isPro: false },
  { name: "prompt",  slug: "prompts",  icon: Sparkles,   iconName: "Sparkles",   color: "#8b5cf6", contentMode: "text", isPro: false },
  { name: "command", slug: "commands", icon: Terminal,   iconName: "Terminal",   color: "#f97316", contentMode: "text", isPro: false },
  { name: "note",    slug: "notes",    icon: StickyNote, iconName: "StickyNote", color: "#fde047", contentMode: "text", isPro: false },
  { name: "file",    slug: "files",    icon: File,       iconName: "File",       color: "#6b7280", contentMode: "file", isPro: true  },
  { name: "image",   slug: "images",   icon: Image,      iconName: "Image",      color: "#ec4899", contentMode: "file", isPro: true  },
  { name: "link",    slug: "links",    icon: Link,       iconName: "Link",       color: "#10b981", contentMode: "url",  isPro: false },
]

export function getTypeBySlug(slug: string): ItemTypeConfig | undefined {
  return ITEM_TYPES.find((t) => t.slug === slug)
}

export function getTypeByName(name: string): ItemTypeConfig | undefined {
  return ITEM_TYPES.find((t) => t.name === name)
}
```

---

## Data Flow Summary

```
User visits /items/snippets
  → [type]/page.tsx (server component)
      → getItemsByType(userId, "snippet")   ← lib/db/items.ts
      → renders <ItemList items={...} />

User clicks "New item"
  → ItemDrawer opens in create mode
      → ItemForm renders text fields (contentMode = "text")
      → submit → createItemAction(formData)  ← items/actions.ts
          → prisma.item.create(...)
          → revalidatePath("/items/snippets")
      → drawer closes, list refreshes

User clicks an item card
  → ItemDrawer opens in view mode
      → Edit → ItemForm in edit mode
          → submit → updateItemAction(id, formData)
      → Delete → deleteItemAction(id)
```

---

## Existing Patterns to Follow

- Auth guard: `const session = await auth()` → return `{ error: "Not authenticated." }` if missing (see `profile/actions.ts`)
- DB queries: wrapped in `cache()` from React when called from layout/server components shared across routes (see `getItemTypes`, `getCollections`)
- Demo user: `getDemoUserId()` in `lib/db/collections.ts` — replace with real `auth()` session before launch
- Route groups: all dashboard pages live under `src/app/(dashboard)/` and share the layout in `(dashboard)/layout.tsx`
