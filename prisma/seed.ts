import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────────────────────────────────────────
// System item types
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code",       color: "#3b82f6", isSystem: true },
  { name: "prompt",  icon: "Sparkles",   color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal",   color: "#f97316", isSystem: true },
  { name: "note",    icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file",    icon: "File",       color: "#6b7280", isSystem: true },
  { name: "image",   icon: "Image",      color: "#ec4899", isSystem: true },
  { name: "link",    icon: "Link",       color: "#10b981", isSystem: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function cleanupDuplicates(userId: string) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  // Group by name, keep earliest, remove the rest
  const seen = new Map<string, string>()
  const toDelete: string[] = []

  for (const c of collections) {
    if (seen.has(c.name)) {
      toDelete.push(c.id)
    } else {
      seen.set(c.name, c.id)
    }
  }

  if (toDelete.length === 0) return 0

  // Get all item IDs belonging only to duplicate collections
  const itemLinks = await prisma.itemCollection.findMany({
    where: { collectionId: { in: toDelete } },
    select: { itemId: true },
  })
  const itemIds = itemLinks.map((l) => l.itemId)

  // Delete items (cascades to ItemCollection)
  await prisma.item.deleteMany({ where: { id: { in: itemIds } } })

  // Delete the now-empty duplicate collections
  await prisma.collection.deleteMany({ where: { id: { in: toDelete } } })

  return toDelete.length
}

async function seedSystemTypes() {
  const typeMap: Record<string, string> = {}
  for (const type of SYSTEM_TYPES) {
    let record = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    })
    if (!record) {
      record = await prisma.itemType.create({ data: { ...type, userId: null } })
    }
    typeMap[type.name] = record.id
  }
  return typeMap
}

async function seedUser() {
  const existing = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  })
  if (existing) return existing

  const passwordHash = await bcrypt.hash("12345678", 12)
  return prisma.user.create({
    data: {
      email: "demo@devstash.io",
      name: "Demo User",
      isPro: false,
      emailVerified: new Date(),
      // Store hash in the Account relation via a credentials account
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: "demo@devstash.io",
          access_token: passwordHash,
        },
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n")

  // System types
  console.log("System item types...")
  const types = await seedSystemTypes()
  console.log("  ✓ 7 system types ready\n")

  // Demo user
  console.log("Demo user...")
  const user = await seedUser()
  console.log(`  ✓ ${user.email}\n`)

  // Cleanup
  console.log("Checking for duplicates...")
  const removed = await cleanupDuplicates(user.id)
  console.log(removed > 0 ? `  ✓ Removed ${removed} duplicate collection(s)\n` : "  ✓ No duplicates found\n")

  // ── React Patterns ──────────────────────────────────────────────────────────
  console.log("Collections & items...")

  const existingReactPatterns = await prisma.collection.findFirst({
    where: { name: "React Patterns", userId: user.id },
  })
  const reactPatterns = existingReactPatterns ?? await prisma.collection.create({
    data: {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "useDebounce Hook",
                description: "Delays updating a value until after a specified delay",
                contentType: "text",
                language: "typescript",
                isPinned: true,
                content: `import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}`,
                userId: user.id,
                itemTypeId: types.snippet,
              },
            },
          },
          {
            item: {
              create: {
                title: "Context Provider Pattern",
                description: "Typed context with a custom hook and compound provider",
                contentType: "text",
                language: "typescript",
                content: `import { createContext, useContext, useState, ReactNode } from "react"

interface ThemeContextValue {
  theme: "light" | "dark"
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"))
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}`,
                userId: user.id,
                itemTypeId: types.snippet,
              },
            },
          },
          {
            item: {
              create: {
                title: "Utility Functions",
                description: "Common TypeScript utilities: cn, formatDate, truncate",
                contentType: "text",
                language: "typescript",
                content: `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str
}`,
                userId: user.id,
                itemTypeId: types.snippet,
              },
            },
          },
        ],
      },
    },
  })
  console.log(`  ✓ ${reactPatterns.name}`)

  // ── AI Workflows ────────────────────────────────────────────────────────────

  const existingAiWorkflows = await prisma.collection.findFirst({
    where: { name: "AI Workflows", userId: user.id },
  })
  const aiWorkflows = existingAiWorkflows ?? await prisma.collection.create({
    data: {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "Code Review Prompt",
                description: "Thorough code review with actionable feedback",
                contentType: "text",
                isPinned: true,
                content: `Review the following code and provide structured feedback covering:

1. **Correctness** — Are there any bugs, edge cases, or logic errors?
2. **Performance** — Are there any obvious inefficiencies or bottlenecks?
3. **Readability** — Is the code clear and easy to follow?
4. **Security** — Are there any vulnerabilities or unsafe patterns?
5. **Best practices** — Does it follow idiomatic patterns for the language/framework?

Be specific, cite line numbers where relevant, and suggest concrete improvements.

\`\`\`
[PASTE CODE HERE]
\`\`\``,
                userId: user.id,
                itemTypeId: types.prompt,
              },
            },
          },
          {
            item: {
              create: {
                title: "Documentation Generator",
                description: "Generate JSDoc / TSDoc for functions and modules",
                contentType: "text",
                content: `Generate comprehensive documentation for the following code. Include:

- A concise summary of what it does
- @param descriptions for every parameter (include type and purpose)
- @returns description of the return value
- @throws for any errors that may be thrown
- A usage @example with realistic input/output
- Any important @remarks about edge cases or limitations

Output only the documentation comment block — no explanations outside of it.

\`\`\`
[PASTE CODE HERE]
\`\`\``,
                userId: user.id,
                itemTypeId: types.prompt,
              },
            },
          },
          {
            item: {
              create: {
                title: "Refactoring Assistant",
                description: "Identify and fix code smells with step-by-step refactoring",
                contentType: "text",
                content: `Analyze the following code for refactoring opportunities. For each issue:

1. Name the code smell or anti-pattern
2. Explain why it's problematic
3. Provide a refactored version with inline comments explaining the changes

Focus on: duplication, long functions, deep nesting, unclear naming, and violation of single-responsibility. Preserve the original behaviour exactly.

\`\`\`
[PASTE CODE HERE]
\`\`\``,
                userId: user.id,
                itemTypeId: types.prompt,
              },
            },
          },
        ],
      },
    },
  })
  console.log(`  ✓ ${aiWorkflows.name}`)

  // ── DevOps ──────────────────────────────────────────────────────────────────

  const existingDevops = await prisma.collection.findFirst({
    where: { name: "DevOps", userId: user.id },
  })
  const devops = existingDevops ?? await prisma.collection.create({
    data: {
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "Docker Compose — Next.js + Postgres",
                description: "Local dev stack with Next.js app and Postgres database",
                contentType: "text",
                language: "yaml",
                content: `services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/devstash
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: devstash
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:`,
                userId: user.id,
                itemTypeId: types.snippet,
              },
            },
          },
          {
            item: {
              create: {
                title: "Deploy to Production",
                description: "Build, migrate, and restart the production Next.js app",
                contentType: "text",
                content: "git pull origin main && npm ci && npx prisma migrate deploy && npm run build && pm2 restart app",
                userId: user.id,
                itemTypeId: types.command,
              },
            },
          },
          {
            item: {
              create: {
                title: "Docker Documentation",
                description: "Official Docker Engine and Compose reference",
                contentType: "url",
                url: "https://docs.docker.com",
                userId: user.id,
                itemTypeId: types.link,
              },
            },
          },
          {
            item: {
              create: {
                title: "GitHub Actions Docs",
                description: "CI/CD workflows with GitHub Actions",
                contentType: "url",
                url: "https://docs.github.com/en/actions",
                userId: user.id,
                itemTypeId: types.link,
              },
            },
          },
        ],
      },
    },
  })
  console.log(`  ✓ ${devops.name}`)

  // ── Terminal Commands ────────────────────────────────────────────────────────

  const existingTerminalCommands = await prisma.collection.findFirst({
    where: { name: "Terminal Commands", userId: user.id },
  })
  const terminalCommands = existingTerminalCommands ?? await prisma.collection.create({
    data: {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "Git — Undo Last Commit (keep changes)",
                description: "Soft-reset HEAD by one commit, leaving files staged",
                contentType: "text",
                isPinned: true,
                content: "git reset --soft HEAD~1",
                userId: user.id,
                itemTypeId: types.command,
              },
            },
          },
          {
            item: {
              create: {
                title: "Docker — Remove All Stopped Containers & Unused Images",
                description: "Free up disk space by pruning dangling Docker resources",
                contentType: "text",
                content: "docker system prune -af",
                userId: user.id,
                itemTypeId: types.command,
              },
            },
          },
          {
            item: {
              create: {
                title: "Kill Process on Port",
                description: "Find and kill whatever is listening on a given port",
                contentType: "text",
                content: "lsof -ti tcp:3000 | xargs kill -9",
                userId: user.id,
                itemTypeId: types.command,
              },
            },
          },
          {
            item: {
              create: {
                title: "npm — Clean Install & Rebuild",
                description: "Delete node_modules and lock file, then reinstall from scratch",
                contentType: "text",
                content: "rm -rf node_modules package-lock.json && npm install",
                userId: user.id,
                itemTypeId: types.command,
              },
            },
          },
        ],
      },
    },
  })
  console.log(`  ✓ ${terminalCommands.name}`)

  // ── Design Resources ─────────────────────────────────────────────────────────

  const existingDesignResources = await prisma.collection.findFirst({
    where: { name: "Design Resources", userId: user.id },
  })
  const designResources = existingDesignResources ?? await prisma.collection.create({
    data: {
      name: "Design Resources",
      description: "UI/UX resources and references",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "Tailwind CSS Docs",
                description: "Utility-first CSS framework reference",
                contentType: "url",
                url: "https://tailwindcss.com/docs",
                userId: user.id,
                itemTypeId: types.link,
              },
            },
          },
          {
            item: {
              create: {
                title: "shadcn/ui",
                description: "Accessible component library built on Radix + Tailwind",
                contentType: "url",
                url: "https://ui.shadcn.com",
                userId: user.id,
                itemTypeId: types.link,
              },
            },
          },
          {
            item: {
              create: {
                title: "Radix UI Primitives",
                description: "Unstyled, accessible component primitives for React",
                contentType: "url",
                url: "https://www.radix-ui.com/primitives",
                userId: user.id,
                itemTypeId: types.link,
              },
            },
          },
          {
            item: {
              create: {
                title: "Lucide Icons",
                description: "Open-source icon library used throughout the app",
                contentType: "url",
                url: "https://lucide.dev/icons",
                userId: user.id,
                itemTypeId: types.link,
              },
            },
          },
        ],
      },
    },
  })
  console.log(`  ✓ ${designResources.name}`)

  // ── Pin specific items (idempotent) ─────────────────────────────────────────
  await prisma.item.updateMany({
    where: {
      userId: user.id,
      title: { in: ["useDebounce Hook", "Code Review Prompt", "Git — Undo Last Commit (keep changes)"] },
    },
    data: { isPinned: true },
  })
  console.log("\n  ✓ Pinned items updated")

  console.log("\nDone.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
