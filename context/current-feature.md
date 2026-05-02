# Current Feature

## Status

In Progress

## Goals

Refactor the `context/` folder to reduce staleness, eliminate ambiguity about completed work, and fix structural defects. See findings below.

## Notes

Scan performed 2026-05-02. Findings are prioritized. C-006 (one-line fix) should go first; C-001 and C-002 are highest value.

---

## Refactor Findings

### High Priority

#### [C-001] Split `current-feature.md` — active template vs. history archive

The `## History` section (~85 entries, ~75 lines) lives in the same file as the active-work template, forcing every agent session to read two months of completed work to reach the current status. Extract the entire `## History` section into a new `context/history.md` file. Update `ai-interaction.md` step 10 to append to `context/history.md` instead. `current-feature.md` drops from ~90 lines to ~12.

#### [C-002] Remove embedded Prisma schema from `project-overview.md`

Lines 124–254 of `project-overview.md` contain an initial-design schema that is materially out of sync with `prisma/schema.prisma` (missing `password`, `editorPreferences`, `EmailVerificationToken`, `@db.Text` on content, and more). Replace the entire block with a one-line pointer: "See `prisma/schema.prisma` for the authoritative schema." Also fix dead screenshot references on lines 317–318 (`dashboard-ui-main.png`, `dashboard-ui-drawer.png` are deleted); update to point to existing files in `context/screenshots/`.

#### [C-003] Archive superseded AI research + plan docs

`context/research/ai-integration-research.md` was a one-time prompt brief to generate `docs/ai-integration-plan.md`. Both are fully implemented (2026-04-26/27) and `docs/ai-integration-plan.md` partially contradicts what was built (recommends `gpt-4o-mini`, actual code uses `gpt-5-nano`; recommends `chat.completions`, actual code uses Responses API). Archive or delete both. If keeping, add a `## Status: Superseded` banner to each.

---

### Medium Priority

#### [C-004] Mark completed feature specs with a status banner

`context/features/editor-settings-spec.md`, `favorites-spec.md`, and `homepage-spec.md` are all written in present-tense imperative with no status indicator. All three are confirmed complete per the history log (2026-04-14 through 2026-04-18). An AI reading them cannot tell whether they represent open work or completed work. Add a `## Status: Completed — YYYY-MM-DD` banner at the top of each (or move them to `context/features/completed/`).

#### [C-005] Update or replace the "Suggested Project Structure" in `project-overview.md`

Lines 337–395 show the initial directory layout. The actual `src/` tree has diverged significantly: `src/lib/` gained 9 new files, `src/lib/db/` gained 2, `src/actions/` gained 3, `src/components/` gained `marketing/` and `layout/` subdirectories, `src/types/` gained 2 files, and `src/app/` gained 10+ new routes. Replace the detailed file tree with a high-level module map (6–8 lines) describing the roles of each folder without enumerating filenames — concrete filenames will drift again with every feature.

#### [C-006] Fix broken code fence in `coding-standards.md` (one-line fix)

The Tailwind CSS section opens a ` ```css ` block at line 43 that is never closed. Everything after it — `## File Organization`, `## Naming`, `## Styling`, `## Database`, `## Data Fetching`, `## Error Handling`, `## Code Quality` — renders as literal text inside a CSS code block rather than as navigable Markdown headings. Add a closing ` ``` ` fence after line 50 (after the `}` closing the `@theme` block). **Do this first — it's one line and restores proper document structure.**

---

### Low Priority

#### [C-007] Fix non-existent model name in `project-overview.md`

Line 116 specifies `AI Model: OpenAI gpt-5-nano`. No such model exists in the OpenAI API. Update to reflect the actual model name in `src/lib/openai.ts`, or replace with "OpenAI API (see `src/lib/openai.ts` for model config)".

#### [C-008] Update `ai-interaction.md` if C-001 is implemented

Steps 1 and 10 reference `@context/current-feature.md`. If history is extracted to `context/history.md`, step 10 needs a one-line update: "Mark as completed in `@context/current-feature.md` and append to `@context/history.md`". Dependent on C-001.
