# Current Feature

## Status

Not Started

## Goals

## Notes

## History

**Hooks Folder Refactor — High Priority** (2026-05-03)
- Extracted `useToggleItemFavorite` and `useToggleItemPin` hooks from `ViewBody` in `item-drawer-view.tsx` — removed ~40 lines of duplicate async toggle logic that mirrored `use-toggle-collection-favorite`
- Added `useOutsideClickMulti` to `use-outside-click.ts` — replaced the only hand-rolled `mousedown` listener in the codebase (`sidebar.tsx` lines 121–133); `SidebarContent` now uses the same pattern as `CollectionCard`, `CollectionSelect`, and `NewItemDialog`

**Components Folder Refactor** (2026-05-03)
- Extracted `useToggleCollectionFavorite` hook — eliminated duplicate async favorite-toggle logic in `collection-card.tsx` and `collection-detail-actions.tsx`
- Extracted `useItemAiFeatures` hook — removed ~70 lines of duplicated `handleGenerateDescription`, `handleSuggestTags`, `acceptTag`, `rejectTag` from `new-item-dialog.tsx` and `item-drawer-edit.tsx`
- Extracted `ItemGridCard` component — replaced ~100 lines of duplicated item card JSX across `collections/[id]/page.tsx` and `items/[type]/page.tsx`; supports `titlePrefix` slot (icon badge) and `footer` slot (CopyButton)
- Fixed `ImageThumbnailCard` and `FileListRow` to wrap in `ClickableItemCard` — removed duplicate keyboard handler in ImageThumbnailCard and fixed accessibility gap in FileListRow (plain `div onClick` had no keyboard support)
- Replaced local `formatFileSize` in `file-list-row.tsx` with `formatBytes` from `lib/utils`
- Replaced inline back-link in `items/[type]/page.tsx` with existing `<BackToDashboard />` component

**App Folder Refactor — High Priority** (2026-05-03)
- Extracted `getAuthenticatedUserId` and `requireUserId` to `lib/auth-utils.ts` — replaced 7 pages worth of inline `auth()` + `userId` extraction (R-001)
- Extracted `parsePage()` to `lib/utils.ts` — centralized the double-fallback page parse logic used across 3 paginated routes (R-003)
- Added `className` prop to `BackToDashboard`; replaced inline arrow-link in `settings/page.tsx` and `profile/page.tsx` (R-005)
- Extracted `EmptyState` component to `src/components/empty-state.tsx` — replaced 4 inline empty-state blocks across collections, items, and favorites pages (R-007)
- Extracted `CollectionCardBody` to `src/components/collection-card-body.tsx` — removed ~25 duplicated lines of accent bar + name + icon row JSX from `dashboard/page.tsx` and `collections/page.tsx`; accepts `descriptionClamp` prop (R-002)
- Extracted `AuthPageShell` to `src/components/auth/auth-page-shell.tsx` and shared `signInWithGitHub` action to `src/app/(auth)/actions.ts` — replaced duplicated sign-in and register page structure (R-004)
