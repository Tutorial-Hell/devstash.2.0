# Current Feature

## Status

Not Started

## Goals

<!-- Add goals here -->

## Notes

<!-- Add notes here -->

## History

**Components Folder Refactor** (2026-05-03)
- Extracted `useToggleCollectionFavorite` hook — eliminated duplicate async favorite-toggle logic in `collection-card.tsx` and `collection-detail-actions.tsx`
- Extracted `useItemAiFeatures` hook — removed ~70 lines of duplicated `handleGenerateDescription`, `handleSuggestTags`, `acceptTag`, `rejectTag` from `new-item-dialog.tsx` and `item-drawer-edit.tsx`
- Extracted `ItemGridCard` component — replaced ~100 lines of duplicated item card JSX across `collections/[id]/page.tsx` and `items/[type]/page.tsx`; supports `titlePrefix` slot (icon badge) and `footer` slot (CopyButton)
- Fixed `ImageThumbnailCard` and `FileListRow` to wrap in `ClickableItemCard` — removed duplicate keyboard handler in ImageThumbnailCard and fixed accessibility gap in FileListRow (plain `div onClick` had no keyboard support)
- Replaced local `formatFileSize` in `file-list-row.tsx` with `formatBytes` from `lib/utils`
- Replaced inline back-link in `items/[type]/page.tsx` with existing `<BackToDashboard />` component
