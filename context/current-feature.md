# Current Feature

Hooks Folder Refactor

## Status

In Progress

## Goals

- Extract `useToggleItemFavorite` and `useToggleItemPin` hooks from inline handlers in `ViewBody` (H-001)
- Extend `useOutsideClick` to accept multiple refs and replace inline `mousedown` listener in `SidebarContent` (H-002)

## Notes

Scan date: 2026-05-03. Reviewed 4 hook files + 13 component/context files that contain hook-equivalent logic or consume the hooks.

### High Priority

**H-001** — Inline toggle-item handlers in `ViewBody` duplicate `use-toggle-collection-favorite` pattern
- File: `src/components/item-drawer-view.tsx` (lines 191–225): `handleTogglePin`, `handleToggleFavorite`
- Pattern: `useState` loading bool + action call + `result.success` check + `toast.error` + success toast with ternary + `router.refresh()` + `try/finally` — character-for-character match with `use-toggle-collection-favorite.ts` (lines 13–29)
- Only difference: different action functions (`toggleItemFavorite`/`toggleItemPin`) and different result field read
- Extract to: `src/hooks/use-toggle-item-favorite.ts` and `src/hooks/use-toggle-item-pin.ts`, same signature as `use-toggle-collection-favorite`
- Impact: ~60 lines removed from `ViewBody`; future inline favorite/pin buttons on `ItemGridCard` could reuse these directly

**H-002** — `SidebarContent` re-implements `useOutsideClick` inline
- File: `src/components/layout/sidebar.tsx` (lines 121–133): manual `mousedown` listener in `useEffect` checking two refs (`menuRef`, `collapsedMenuRef`)
- `useOutsideClick` already handles this pattern for `CollectionCard`, `CollectionSelect`, and `NewItemDialog` — only reason it wasn't used here is the two-ref requirement
- Fix: extend `useOutsideClick` to accept optional additional `excludeRefs` array, or add `useOutsideClickMulti` overload
- Proposed callsite: `useOutsideClickMulti([menuRef, collapsedMenuRef], () => setMenuOpen(false), menuOpen)`
- Impact: removes the only hand-rolled `mousedown` listener in the codebase; makes the pattern consistent across 4+ callsites

### Medium Priority

**M-001** — Duplicate async loading shell in `ViewBody` AI handlers
- File: `src/components/item-drawer-view.tsx` (lines 120–158): `handleExplain`, `handleOptimize`, `handleAcceptOptimized`
- Pattern: each sets a loading bool, calls an action, checks `result.success`, toasts on failure, updates state on success, catches with generic error toast, and resets loading in `finally` — same shell as `use-item-ai-features.ts`
- Distinct from `use-item-ai-features`: these handlers operate on the displayed item and call `onUpdate`, not form setters
- Extract to: `src/hooks/use-item-view-ai-features.ts` accepting `item` and `onUpdate` callback, returning 6 loading flags + 3 handlers
- Impact: `ViewBody` drops from 7 AI-related `useState` calls; shrinks from ~180 lines to under 100

**M-002** — Duplicate `fetchCollectionsForSelect` + `useEffect` pattern
- Files: `src/components/new-item-dialog.tsx` (lines 116–120): gates on `open`; `src/components/item-drawer-edit.tsx` (lines 62–64): runs on mount
- Both call `fetchCollectionsForSelect().then(setCollections)` into identical `{ id: string; name: string }[]` state
- Extract to: `src/hooks/use-collections-for-select.ts` accepting optional `enabled` boolean gate, returning `{ collections, loading }`
- Impact: 2 callsites collapse to one line each; future cache or AbortController only needs to be added in one place

### Low Priority

**L-001** — `useCopy` missing timeout cleanup on unmount
- File: `src/hooks/use-copy.ts` (line 9): `setTimeout(() => setCopied(false), 1500)` — return value not stored, not cleared on unmount
- If the component unmounts within 1.5s of a copy (drawer closes after copying), React attempts to call `setCopied` on an unmounted component
- Fix: store timeout in a `useRef`, clear it in a `useEffect` cleanup
- Impact: 3 callsites (`CodeEditor`, `MarkdownEditor`, any future copy consumer); no behavior change in practice, eliminates stale-closure risk

### Do Not Extract

- `useItemDrawer` in `item-drawer.tsx` — context hook, lives correctly alongside its provider
- `handleOpenChange` / `resetForm` / `controlledOpen ?? internalOpen` in `NewItemDialog` vs `NewCollectionDialog` — different form shapes, different actions; saves ~8 lines but creates an abstraction with no behavioral reuse
- The two AI handler groups in `use-item-ai-features.ts` vs `ViewBody` are intentionally separate — edit-form handlers mutate `setTagsInput`/`setDescription`, view handlers call `onUpdate` on displayed item
- `router.refresh()` in toggle hooks — architectural pattern, not duplication

## History

**Components Folder Refactor** (2026-05-03)
- Extracted `useToggleCollectionFavorite` hook — eliminated duplicate async favorite-toggle logic in `collection-card.tsx` and `collection-detail-actions.tsx`
- Extracted `useItemAiFeatures` hook — removed ~70 lines of duplicated `handleGenerateDescription`, `handleSuggestTags`, `acceptTag`, `rejectTag` from `new-item-dialog.tsx` and `item-drawer-edit.tsx`
- Extracted `ItemGridCard` component — replaced ~100 lines of duplicated item card JSX across `collections/[id]/page.tsx` and `items/[type]/page.tsx`; supports `titlePrefix` slot (icon badge) and `footer` slot (CopyButton)
- Fixed `ImageThumbnailCard` and `FileListRow` to wrap in `ClickableItemCard` — removed duplicate keyboard handler in ImageThumbnailCard and fixed accessibility gap in FileListRow (plain `div onClick` had no keyboard support)
- Replaced local `formatFileSize` in `file-list-row.tsx` with `formatBytes` from `lib/utils`
- Replaced inline back-link in `items/[type]/page.tsx` with existing `<BackToDashboard />` component
