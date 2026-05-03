# Current Feature

Components Folder Refactor

## Status

In Progress

## Goals

- Extract `useItemAiFeatures` hook from duplicated AI handler logic in `new-item-dialog.tsx` and `item-drawer-edit.tsx` (R-002)
- Extract shared `ItemCard` component from triplicated item card JSX across three page components (R-003)
- Extract `useToggleCollectionFavorite` hook from two collection components (R-001)
- Replace inline `formatFileSize` in `file-list-row.tsx` with `formatBytes` from `lib/utils.ts` (R-007)
- Fix `ImageThumbnailCard` to wrap in `ClickableItemCard` instead of reimplementing keyboard handler (R-009)
- Fix `FileListRow` accessibility gap — plain `div onClick` has no keyboard handler (R-009)
- Replace inline back-link in `items/[type]/page.tsx` with existing `<BackToDashboard />` component (R-012)

## Notes

Scan date: 2026-05-02. Full scan covered 45 files across `src/components/`, `src/app/(dashboard)/`, and `src/app/(auth)/`.

### High Priority

**R-001** — Duplicate toggle-collection-favorite logic
- Files: `src/components/collection-card.tsx` (lines 31–47), `src/components/collection-detail-actions.tsx` (lines 34–49)
- Character-for-character copy of async handler: `setTogglingFavorite`, call `toggleCollectionFavorite`, check result, set state, `router.refresh()`, toast, catch, finally
- Extract to: `src/hooks/use-toggle-collection-favorite.ts` returning `{ favorite, togglingFavorite, handleToggleFavorite }`
- Only difference: `collection-card.tsx` calls `setDropdownOpen(false)` before the handler — stays local

**R-002** — Duplicate AI feature handlers in NewItemDialog and EditBody
- Files: `src/components/new-item-dialog.tsx` (lines 172–209), `src/components/item-drawer-edit.tsx` (lines 65–104)
- Duplicated: `handleGenerateDescription`, `handleSuggestTags`, `acceptTag`, `rejectTag` — all near-verbatim copies
- State shape also identical: `suggestions`, `loadingSuggestions`, `loadingDescription`
- Extract to: `src/hooks/use-item-ai-features.ts` accepting `{ title, content, url, type, tagsInput, setTagsInput }`
- ~60–70 lines of duplicate async and tag-management logic

**R-003** — Repeated item card JSX across three page components
- Files: `src/app/(dashboard)/collections/[id]/page.tsx` (lines 70–109), `src/app/(dashboard)/items/[type]/page.tsx` (lines 96–136), `src/app/(dashboard)/dashboard/page.tsx` (lines 170–220)
- Shared: left accent bar, title row with Pin/Star icons, description paragraph, `BadgeList` tags — same className strings
- Extract to: `src/components/item-card.tsx` accepting `item: ItemWithMeta`, optional `children` for extension points (e.g. CopyButton)
- ~100 lines of duplicated JSX

**R-004** — Repeated collection card content JSX in two page components
- Files: `src/app/(dashboard)/dashboard/page.tsx` (lines 66–108), `src/app/(dashboard)/collections/page.tsx` (lines 57–99)
- Shared: left accent bar, name+favorite row, item count, optional description, type icon row — only difference is `line-clamp-1` vs `line-clamp-2`
- Extract to: `src/components/collection-card-content.tsx` or absorb into `CollectionCard` as default children
- ~50 lines of near-identical JSX

### Medium Priority

**R-005** — Duplicate controlled-dialog open/reset pattern
- Files: `src/components/new-item-dialog.tsx` (lines 102–114), `src/components/new-collection-dialog.tsx` (lines 26–46)
- Same controlled/uncontrolled duality: `controlledOpen ?? internalOpen`, `handleOpenChange`, `resetForm()` on close
- Extract to: `src/hooks/use-dialog-open.ts`

**R-006** — Duplicate error message paragraph in four form components
- Files: `new-item-dialog.tsx` (line 286), `new-collection-dialog.tsx` (line 96), `collection-edit-delete-dialogs.tsx` (line 117), `item-drawer-edit.tsx` (line 161)
- All four: `<p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>`
- Add `error` prop to existing `FormField`, or create `<FormError error={string | null} />`

**R-007** — Duplicate `formatFileSize` masking `formatBytes` utility
- Files: `src/components/file-list-row.tsx` (lines 19–24), `src/lib/utils.ts` (lines 34–38)
- Identical logic; `formatBytes` already imported in `file-upload.tsx`
- Fix: delete local function, import `formatBytes`, add null guard at callsite

**R-008** — Duplicate auth page shell structure
- Files: `sign-in/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`
- Shared outer shell + heading pattern; sign-in and register also share GitHub OAuth button + OR divider
- Extract to: `src/components/auth/auth-card.tsx`, `<OAuthDivider />`, `<GitHubSignInButton>`

**R-009** — `ImageThumbnailCard` and `FileListRow` bypass `ClickableItemCard`
- `ImageThumbnailCard` reimplements the full keyboard handler instead of wrapping in `ClickableItemCard`
- `FileListRow` uses plain `div onClick` with no keyboard handler — accessibility gap
- Fix: both should use `ClickableItemCard` as wrapper

### Low Priority

**R-010** — Inline `TypeDropdown` in `new-item-dialog.tsx` should be extracted
- Lines 46–92 in `new-item-dialog.tsx`; no closure dependencies on outer component
- Extract to: `src/components/item-type-dropdown.tsx`

**R-011** — Section header pattern duplicated inside `favorites-sortable.tsx`
- Lines 57–73 and 113–126: identical flex header with label, count, sort select
- File-level extraction only — no new file needed

**R-012** — Inline back-link in items page bypasses existing `BackToDashboard` component
- `src/app/(dashboard)/items/[type]/page.tsx` line 53 uses `← Dashboard` (HTML char) instead of `<BackToDashboard />`
- Also visually inconsistent (no lucide `ArrowLeft` icon)
- Fix: swap inline link for `<BackToDashboard />`

**R-013** — Duplicate empty state card pattern across four pages
- Files: collections/[id], items/[type], collections, favorites pages
- Extract to: `src/components/empty-state.tsx` with `message`, `subtext`, `icon` props
- Low urgency — padding varies (p-8 vs p-12), requires design alignment

### Do Not Extract

- Similar form field structure across auth forms — different field sets, actions, and conditional rendering; coincidental structure
- `handleSubmit` vs `handleSave` — call different actions with different input shapes
- `handleToggleFavorite` vs `handleTogglePin` in `item-drawer-view.tsx` — different fields, actions, toast messages
- `CollectionCard` dropdown vs `UserMenu` links — different element types (`button` vs `Link`/`form`)
- Expanded vs collapsed sidebar nav — intentional divergence for different UX modes

## History

<!-- Completed features appended here -->
