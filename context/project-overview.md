# 🗄️ DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all your dev knowledge & resources.**

---

## 🔍 Problem

Developers keep their essentials scattered across too many places:

| What | Where it ends up |
|---|---|
| Code snippets | VS Code, Notion, random gists |
| AI prompts | Lost in chat histories |
| Context files | Buried in project folders |
| Useful links | Browser bookmarks |
| Documentation | Random folders |
| Commands | `.txt` files, bash history |
| Templates | GitHub gists |

This creates **context switching**, **lost knowledge**, and **inconsistent workflows**. DevStash solves this by giving developers a single, fast, searchable home for everything they reach for daily.

---

## 👥 Target Users

| Persona | Core Need |
|---|---|
| **Everyday Developer** | Fast access to snippets, prompts, commands, links |
| **AI-First Developer** | Save & organize prompts, contexts, workflows, system messages |
| **Content Creator / Educator** | Store code blocks, explanations, course notes |
| **Full-Stack Builder** | Collect patterns, boilerplates, API examples |

---

## ✨ Features

### A. Items & Item Types

Items are the core unit of DevStash. Each item has a **type** that determines its behavior, color, and icon. Users will eventually be able to create custom types (Pro), but the app ships with these **system types** (immutable):

| Type | Color | Icon | Content Mode | Tier |
|---|---|---|---|---|
| 🔵 Snippet | `#3b82f6` | `Code` | Text | Free |
| 🟣 Prompt | `#8b5cf6` | `Sparkles` | Text | Free |
| 🟠 Command | `#f97316` | `Terminal` | Text | Free |
| 🟡 Note | `#fde047` | `StickyNote` | Text | Free |
| ⚫ File | `#6b7280` | `File` | File upload | Pro |
| 🩷 Image | `#ec4899` | `Image` | File upload | Pro |
| 🟢 Link | `#10b981` | `Link` | URL | Free |

A type's content mode can be **text** (snippet, note, prompt, command), **url** (link), or **file** (file, image).

**Routing:** `/items/snippets`, `/items/prompts`, `/items/commands`, etc.

Items should be **quick to access and create** — they open and are authored inside a slide-out drawer, not a full page.

---

### B. Collections

Collections are user-created groupings. An item can belong to **multiple** collections (many-to-many).

**Examples:**

- *React Patterns* → snippets, notes
- *Context Files* → files
- *Interview Prep* → snippets, prompts
- *Python Snippets* → snippets

---

### C. Search

Full-text search across:

- Content body
- Titles
- Tags
- Item types

---

### D. Authentication

- Email / password
- GitHub OAuth
- Powered by **NextAuth v5**

---

### E. General Features

- ⭐ Favorite collections and items
- 📌 Pin items to top
- 🕑 Recently used items
- 📥 Import code from a file
- ✏️ Markdown editor for text-based types
- 📤 File upload for file/image types (Cloudflare R2)
- 📦 Export data (JSON / ZIP) — Pro
- 🌙 Dark mode by default, light mode optional
- ➕ Add/remove items to/from multiple collections
- 👁️ View which collections an item belongs to

---

### F. AI Features (Pro Only)

| Feature | Description |
|---|---|
| **Auto-Tag Suggestions** | AI analyzes content and suggests relevant tags |
| **Summarize** | Generate a concise summary of any item |
| **Explain This Code** | Plain-english explanation of a code snippet |
| **Prompt Optimizer** | Refine and improve AI prompts |

**AI Model:** OpenAI API (see `src/lib/openai.ts` for model config)

---

## 🗃️ Data Models

See `prisma/schema.prisma` for the authoritative schema. Models: User, Item, ItemType, Collection, ItemCollection, Tag, EmailVerificationToken, and the NextAuth models (Account, Session, VerificationToken).

> **⚠️ Migration policy:** Never use `db push` or directly modify DB structure. All schema changes go through Prisma Migrate — run in dev first, then apply to prod.

---

## 🏗️ Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 16 / React 19 | SSR pages, API routes, single repo |
| **Language** | TypeScript | End-to-end type safety |
| **Database** | Neon PostgreSQL | Serverless Postgres in the cloud |
| **ORM** | Prisma 7 | Latest version — fetch current docs before use |
| **File Storage** | Cloudflare R2 | S3-compatible, for file & image uploads |
| **Auth** | NextAuth v5 | Email/password + GitHub OAuth |
| **AI** | OpenAI (`gpt-5-nano`) | Auto-tag, summarize, explain, optimize |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first + accessible component library |
| **Caching** | Redis | Under consideration for future optimization |
| **Payments** | Stripe | Subscriptions for Pro tier |

### Key Architecture Decisions

- **Single codebase** — frontend and backend live in one Next.js repo for reduced overhead.
- **SSR pages with dynamic components** — server-rendered shells with client interactivity where needed.
- **API routes** for backend needs: storing items, file uploads, AI calls.
- **Prisma Migrate only** — no `db push` in any environment.

---

## 💰 Monetization

Freemium model with a single Pro tier.

| | Free | Pro |
|---|---|---|
| **Price** | $0 | **$8/mo** or **$72/yr** (25% savings) |
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| File / image types | ❌ | ✅ |
| Custom types | ❌ | ✅ (future) |
| AI features | ❌ | ✅ |
| Data export | ❌ | JSON / ZIP |
| Priority support | ❌ | ✅ |

> **Dev note:** During development, all users have full access. Pro gating will be wired up before launch using `user.isPro` checks and Stripe webhooks.

---

## 🎨 UI / UX

### Design Philosophy

- Modern, minimal, developer-focused
- **Dark mode by default**, light mode optional
- Clean typography, generous whitespace, subtle borders and shadows
- Syntax highlighting for all code blocks
- **Inspiration:** Notion, Linear, Raycast

### Screenshots

Refer to the screenshots below as a base for the dashboard UI. It does not have to be exact - use it as a reference.

- @context/screenshots/dashboard-main.png
- @context/screenshots/dashboard-snippets.png
- @context/screenshots/dashboard-favorites.png
- @context/screenshots/dashboard-settings.png

### Layout

- **Sidebar** (collapsible): item type navigation (Snippets, Commands, etc.) + recent collections
- **Main area**: grid of color-coded collection cards; background color derived from the most common item type. Items display as color-coded cards (border color matches type).
- **Item drawer**: items open in a fast slide-out drawer — not a separate page.
- **Mobile**: sidebar collapses into a hamburger drawer.

### Micro-Interactions

- Smooth transitions on navigation and drawer open/close
- Hover states on cards
- Toast notifications for CRUD actions
- Loading skeletons while data fetches

---

## 🗂️ Project Structure

- `prisma/` — schema, migrations, seed
- `src/app/(auth)/` — sign-in, register, forgot/reset-password, verify-email pages
- `src/app/(dashboard)/` — all authenticated app pages (dashboard, items, collections, favorites, profile, settings)
- `src/app/api/` — webhook handlers, file upload/download, item fetch, Stripe routes
- `src/actions/` — server actions by domain (items, collections, ai, subscription, settings)
- `src/components/` — UI components; `ui/` for shadcn primitives, `layout/` for sidebar/topbar, `marketing/` for homepage
- `src/lib/` — shared utilities and singletons (prisma, stripe, openai, r2, rate-limit, auth-utils, constants); `db/` subfolder for data-access functions
- `src/types/` — shared TypeScript types and module augmentations

---

## 🔗 Useful Links

| Resource | URL |
|---|---|
| Next.js Docs | https://nextjs.org/docs |
| Prisma Docs | https://www.prisma.io/docs |
| NextAuth v5 | https://authjs.dev |
| Tailwind CSS v4 | https://tailwindcss.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Cloudflare R2 | https://developers.cloudflare.com/r2 |
| Stripe Billing | https://docs.stripe.com/billing |
| OpenAI API | https://platform.openai.com/docs |
| Neon Postgres | https://neon.tech/docs |
| Lucide Icons | https://lucide.dev/icons |
