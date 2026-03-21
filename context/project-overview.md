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

**AI Model:** OpenAI `gpt-5-nano`

---

## 🗃️ Data Models

Below are the Prisma schema models. These extend the NextAuth default schema (User, Account, Session, VerificationToken).

```prisma
// ──────────────────────────────────────────
// User (extends NextAuth User)
// ──────────────────────────────────────────
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  isPro         Boolean   @default(false)

  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique

  items       Item[]
  collections Collection[]
  itemTypes   ItemType[]
  tags        Tag[]
  accounts    Account[]
  sessions    Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ──────────────────────────────────────────
// Item
// ──────────────────────────────────────────
model Item {
  id          String  @id @default(cuid())
  title       String
  description String?

  contentType String  // "text" | "url" | "file"
  content     String? // text body (null if file)
  url         String? // for link types
  fileUrl     String? // Cloudflare R2 URL (null if text)
  fileName    String? // original filename
  fileSize    Int?    // bytes

  language    String? // programming language (optional)
  isFavorite  Boolean @default(false)
  isPinned    Boolean @default(false)

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  collections ItemCollection[]
  tags        Tag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

// ──────────────────────────────────────────
// ItemType
// ──────────────────────────────────────────
model ItemType {
  id       String  @id @default(cuid())
  name     String  // "snippet", "prompt", etc.
  icon     String  // Lucide icon name
  color    String  // hex color
  isSystem Boolean @default(false)

  userId String? // null for system types
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  Item[]

  @@unique([name, userId])
  @@index([userId])
}

// ──────────────────────────────────────────
// Collection
// ──────────────────────────────────────────
model Collection {
  id          String  @id @default(cuid())
  name        String
  description String?
  isFavorite  Boolean @default(false)

  defaultTypeId String?  // fallback type for empty collections
  defaultType   ItemType? @relation(fields: [defaultTypeId], references: [id])

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items ItemCollection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// ──────────────────────────────────────────
// ItemCollection (join table)
// ──────────────────────────────────────────
model ItemCollection {
  itemId       String
  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  addedAt DateTime @default(now())

  @@id([itemId, collectionId])
  @@index([collectionId])
}

// ──────────────────────────────────────────
// Tag
// ──────────────────────────────────────────
model Tag {
  id   String @id @default(cuid())
  name String

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  Item[]

  @@unique([name, userId])
  @@index([userId])
}
```

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

- @context/screenshots/dashboard-ui-main.png
- @context/screenshots/dashboard-ui-drawer.png

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

## 🗂️ Suggested Project Structure

```
devstash/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts               # Seed system item types
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Sidebar + main shell
│   │   │   ├── page.tsx       # Home / recent items
│   │   │   ├── items/
│   │   │   │   └── [type]/    # /items/snippets, /items/prompts ...
│   │   │   ├── collections/
│   │   │   │   └── [id]/
│   │   │   ├── search/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── items/
│   │   │   ├── collections/
│   │   │   ├── tags/
│   │   │   ├── ai/
│   │   │   ├── upload/
│   │   │   └── stripe/
│   │   │       └── webhook/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── items/
│   │   │   ├── item-card.tsx
│   │   │   ├── item-drawer.tsx
│   │   │   └── item-form.tsx
│   │   ├── collections/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   └── shared/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── stripe.ts
│   │   ├── r2.ts              # Cloudflare R2 helpers
│   │   ├── ai.ts              # OpenAI helpers
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── styles/
│       └── globals.css
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

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
