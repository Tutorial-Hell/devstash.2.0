# Current Feature

## Status

Not Started

## Goals

<!-- Add goals here -->

## Notes

<!-- Add notes here -->

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
